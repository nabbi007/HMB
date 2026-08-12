import { useEffect, useRef, useState } from "react"
import { Button, Label, TextInput, Textarea, ToggleSwitch, useThemeMode } from "flowbite-react"
import { Link, useNavigate } from "react-router-dom"
import { AddIcon, LogoutIcon, TrashIcon, UploadIcon, VerifiedIcon } from "@/lib/icons"
import { api, ApiError, mediaUrl, uploadFile } from "@/lib/api"
import { useRole } from "@/lib/role-context"
import { PlaceAutocomplete } from "@/components/common/PlaceAutocomplete"

interface NurseProfile {
  bio: string | null
  job_description: string | null
  community: string | null
  latitude: number | string | null
  longitude: number | string | null
  languages: string[] | null
  is_available: boolean
  profile_photo_url: string | null
  verification_status: string
}

interface MotherProfile {
  community: string | null
  latitude: number | string | null
  longitude: number | string | null
  number_of_children: number | null
  children_notes: string | null
}

interface Child {
  id: string
  name: string
  age_years: number | null
  allergies: string | null
  notes: string | null
}

function initials(name: string): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "?"
  )
}

const fieldClassName =
  "[&_input]:rounded-panel [&_input]:border-neutral-border [&_input]:bg-neutral-surface [&_textarea]:rounded-panel [&_textarea]:border-neutral-border [&_textarea]:bg-neutral-surface"

export default function Profile() {
  const navigate = useNavigate()
  const { user, role, token, logout, refreshUser } = useRole()
  const { computedMode, toggleMode } = useThemeMode()
  const [pushEnabled, setPushEnabled] = useState(true)
  const [emailEnabled, setEmailEnabled] = useState(true)

  const isNurse = role === "caregiver"
  const name = user?.full_name ?? "—"
  const roleLabel = isNurse ? "Caregiver" : "Parent"

  // Real profile data from the backend.
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  async function changePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    try {
      const { url } = await uploadFile(file, token ?? undefined)
      await api(isNurse ? "/api/v1/nurses/me" : "/api/v1/mothers/me", {
        method: "PATCH",
        body: { profile_photo_url: url },
        token: token ?? undefined,
      })
      setPhotoUrl(mediaUrl(url) ?? null)
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Couldn't update photo.")
    }
  }
  const [form, setForm] = useState({
    phone: "",
    bio: "",
    job_description: "",
    community: "",
    latitude: "",
    longitude: "",
    languages: "",
    number_of_children: "",
    children_notes: "",
  })
  // Caregiver availability (boolean, kept separate from the string form).
  const [available, setAvailable] = useState(true)

  // Keep the editable phone field in sync with the account.
  useEffect(() => {
    setForm((f) => ({ ...f, phone: user?.phone ?? "" }))
  }, [user?.phone])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Children (mothers only)
  const [children, setChildren] = useState<Child[]>([])
  const [childName, setChildName] = useState("")
  const [childAge, setChildAge] = useState("")
  const [childAllergies, setChildAllergies] = useState("")
  const [childNotes, setChildNotes] = useState("")
  const [childErr, setChildErr] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    const path = isNurse ? "/api/v1/nurses/me" : "/api/v1/mothers/me"
    api<NurseProfile & MotherProfile>(path, { token })
      .then((p) => {
        setForm((f) => ({
          ...f,
          bio: p.bio ?? "",
          job_description: p.job_description ?? "",
          community: p.community ?? "",
          latitude: p.latitude != null ? String(p.latitude) : "",
          longitude: p.longitude != null ? String(p.longitude) : "",
          languages: p.languages ? p.languages.join(", ") : "",
          number_of_children: p.number_of_children != null ? String(p.number_of_children) : "",
          children_notes: p.children_notes ?? "",
        }))
        if (typeof p.is_available === "boolean") setAvailable(p.is_available)
        if (p.profile_photo_url) setPhotoUrl(mediaUrl(p.profile_photo_url) ?? null)
      })
      .catch(() => setError("Could not load your profile."))
      .finally(() => setLoading(false))
  }, [token, isNurse])

  // Load the mother's children.
  useEffect(() => {
    if (isNurse || !token) return
    api<Child[]>("/api/v1/mothers/me/children", { token })
      .then(setChildren)
      .catch(() => {})
  }, [isNurse, token])

  async function addChild(e: React.FormEvent) {
    e.preventDefault()
    setChildErr(null)
    if (!childName.trim()) return
    try {
      const created = await api<Child>("/api/v1/mothers/me/children", {
        method: "POST",
        token: token ?? undefined,
        body: {
          name: childName.trim(),
          age_years: childAge.trim() ? Number(childAge) : null,
          allergies: childAllergies.trim() || null,
          notes: childNotes.trim() || null,
        },
      })
      setChildren((prev) => [...prev, created])
      setChildName("")
      setChildAge("")
      setChildAllergies("")
      setChildNotes("")
    } catch (err) {
      setChildErr(err instanceof ApiError ? err.detail : "Could not add child.")
    }
  }

  async function removeChild(id: string) {
    await api(`/api/v1/mothers/me/children/${id}`, { method: "DELETE", token: token ?? undefined })
    setChildren((prev) => prev.filter((c) => c.id !== id))
  }

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    setSaved(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      // Phone lives on the account (email is not editable here).
      const trimmedPhone = form.phone.trim()
      if (trimmedPhone && trimmedPhone !== user?.phone) {
        await api("/api/v1/auth/me", {
          method: "PATCH",
          body: { phone: trimmedPhone },
          token: token ?? undefined,
        })
        await refreshUser()
      }

      if (isNurse) {
        const payload: Record<string, unknown> = {
          bio: form.bio || null,
          job_description: form.job_description || null,
          community: form.community || null,
          is_available: available,
        }
        const langs = form.languages
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
        payload.languages = langs.length ? langs : null
        if (form.latitude && form.longitude) {
          payload.latitude = Number(form.latitude)
          payload.longitude = Number(form.longitude)
        }
        await api<NurseProfile>("/api/v1/nurses/me", {
          method: "PATCH",
          body: payload,
          token: token ?? undefined,
        })
      } else {
        const payload: Record<string, unknown> = {
          community: form.community || null,
        }
        const langs = form.languages
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
        payload.languages = langs.length ? langs : null
        if (form.latitude && form.longitude) {
          payload.latitude = Number(form.latitude)
          payload.longitude = Number(form.longitude)
        }
        await api("/api/v1/mothers/me", {
          method: "PATCH",
          body: payload,
          token: token ?? undefined,
        })
      }
      setSaved(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Could not save. Try again.")
    } finally {
      setSaving(false)
    }
  }

  function handleLogout() {
    logout()
    navigate("/login", { replace: true })
  }

  return (
    <div className="h-full overflow-y-auto bg-background-offwhite">
      <div className="mx-auto max-w-2xl px-6 py-8 md:px-10 md:py-10">
        <h1 className="text-xl font-bold text-text-charcoal md:text-2xl">Profile</h1>

        {/* Identity */}
        <div className="mt-6 flex flex-col items-center gap-4 rounded-card bg-background-white p-6 text-center md:flex-row md:text-left">
          <div className="relative shrink-0">
            {photoUrl ? (
              <img src={photoUrl} alt={name} className="size-20 rounded-full object-cover" />
            ) : (
              <span className="flex size-20 items-center justify-center rounded-full bg-brand-red text-2xl font-bold text-white">
                {initials(name)}
              </span>
            )}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={changePhoto}
            />
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              aria-label="Change profile photo"
              className="absolute right-0 bottom-0 flex size-7 items-center justify-center rounded-full bg-brand-red text-white ring-2 ring-background-white transition-opacity hover:opacity-90"
            >
              <UploadIcon className="size-3.5" />
            </button>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
              <p className="text-lg font-semibold text-text-charcoal">{name}</p>
              {isNurse && user?.verification_status === "verified" ? (
                <span className="inline-flex items-center gap-1 rounded-[10px] bg-verify-green-bg px-2 py-0.5 text-xs font-medium text-verify-green">
                  <VerifiedIcon className="size-3.5" />
                  Verified
                </span>
              ) : null}
            </div>
            <p className="text-sm text-text-muted">{user?.email ?? user?.phone}</p>
            <p className="text-sm text-text-muted">{roleLabel}</p>
          </div>
        </div>

        {/* Account details (read-only, from your account) */}
        <section className="mt-6 rounded-card bg-background-white p-6">
          <h2 className="text-lg font-semibold text-text-charcoal">Account details</h2>
          <dl className="mt-4 flex flex-col divide-y divide-neutral-border">
            <Row label="Account verified" value={user?.phone_verified ? "Yes" : "No"} />
            {isNurse ? (
              <Row
                label="HMB verification"
                value={user?.verification_status === "verified" ? "Verified" : "Pending"}
              />
            ) : null}
          </dl>
        </section>

        {/* Editable profile (real, saved to the backend) */}
        <section className="mt-6 rounded-card bg-background-white p-6">
          <h2 className="text-lg font-semibold text-text-charcoal">My profile</h2>
          {loading ? (
            <p className="mt-3 text-sm text-text-muted">Loading…</p>
          ) : (
            <form onSubmit={handleSave} className={`mt-4 flex flex-col gap-4 ${fieldClassName}`}>
              {error ? (
                <p className="rounded-panel bg-brand-red-tint px-3 py-2 text-sm text-brand-red">
                  {error}
                </p>
              ) : null}
              {saved ? (
                <p className="rounded-panel bg-verify-green-bg px-3 py-2 text-sm text-verify-green">
                  Saved.
                </p>
              ) : null}

              <div>
                <Label htmlFor="phone">Phone number</Label>
                <TextInput
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="+233 20 000 0000"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <TextInput id="email" type="email" value={user?.email ?? ""} disabled readOnly className="mt-1.5" />
                <p className="mt-1 text-xs text-text-muted">Email can't be changed.</p>
              </div>

              <div>
                <Label htmlFor="community">Community / area</Label>
                <div className="mt-1.5">
                  <PlaceAutocomplete
                    id="community"
                    value={form.community}
                    onChange={(text) => set("community", text)}
                    onSelect={(place) => {
                      setForm((f) => ({
                        ...f,
                        community: place.name,
                        latitude: String(place.lat),
                        longitude: String(place.lng),
                      }))
                      setSaved(false)
                    }}
                    placeholder="Start typing — e.g. Dzorwulu, Achimota, Tema…"
                  />
                </div>
                {form.latitude && form.longitude ? (
                  <p className="mt-1 text-xs text-verify-green">📍 Location set on the map</p>
                ) : (
                  <p className="mt-1 text-xs text-text-muted">Pick a place from the list to set your map location</p>
                )}
              </div>

              {!isNurse ? (
                <div>
                  <Label htmlFor="languages">Languages you speak (comma-separated)</Label>
                  <TextInput
                    id="languages"
                    value={form.languages}
                    onChange={(e) => set("languages", e.target.value)}
                    placeholder="English, Twi, Ga"
                    className="mt-1.5"
                  />
                </div>
              ) : null}

              {isNurse ? (
                <>
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      rows={3}
                      value={form.bio}
                      onChange={(e) => set("bio", e.target.value)}
                      placeholder="Tell families about your experience"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="job_description">Services offered</Label>
                    <Textarea
                      id="job_description"
                      rows={2}
                      value={form.job_description}
                      onChange={(e) => set("job_description", e.target.value)}
                      placeholder="e.g. Newborn care, feeding support"
                      className="mt-1.5"
                    />
                  </div>
                  <div className="rounded-panel bg-neutral-surface p-3">
                    <ToggleSwitch
                      checked={available}
                      label="Available for bookings"
                      onChange={(v) => {
                        setAvailable(v)
                        setSaved(false)
                      }}
                    />
                    <p className="mt-2 text-xs text-text-muted">
                      Turn off if you're not taking bookings — families still see you (marked
                      Unavailable) and can request; you choose to accept or decline. HMB sets the
                      rate (from GHS 100 / 4 hrs), not you.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="languages">Languages (comma-separated)</Label>
                    <TextInput
                      id="languages"
                      value={form.languages}
                      onChange={(e) => set("languages", e.target.value)}
                      placeholder="English, Twi, Ga"
                      className="mt-1.5"
                    />
                  </div>
                  <p className="text-xs text-text-muted">
                    Upload your NMC PIN / license photo and ID on the{" "}
                    <Link to="/verification" className="font-medium text-brand-red hover:underline">
                      verification page
                    </Link>
                    .
                  </p>
                </>
              ) : null}

              <Button type="submit" color="default" disabled={saving} className="self-start">
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </form>
          )}
        </section>

        {/* Children (mothers only) */}
        {!isNurse ? (
          <section className="mt-6 rounded-card bg-background-white p-6">
            <h2 className="text-lg font-semibold text-text-charcoal">My children</h2>
            <p className="mt-1 text-sm text-text-muted">
              Shared only with a matched, paid caregiver — never public.
            </p>

            <div className="mt-4 flex flex-col gap-2">
              {children.length === 0 ? (
                <p className="text-sm text-text-muted">No children added yet.</p>
              ) : (
                children.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-start justify-between gap-3 rounded-panel bg-neutral-surface p-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-charcoal">
                        {c.name}
                        {c.age_years != null ? ` · ${c.age_years} yr` : ""}
                      </p>
                      {c.allergies ? (
                        <p className="mt-0.5 text-xs font-medium text-brand-red">
                          ⚠ Allergies: {c.allergies}
                        </p>
                      ) : null}
                      {c.notes ? <p className="text-xs text-text-muted">{c.notes}</p> : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeChild(c.id)}
                      aria-label={`Remove ${c.name}`}
                      className="flex size-8 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-neutral-border/40 hover:text-brand-red"
                    >
                      <TrashIcon className="size-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={addChild} className={`mt-4 flex flex-col gap-3 ${fieldClassName}`}>
              {childErr ? (
                <p className="rounded-panel bg-brand-red-tint px-3 py-2 text-sm text-brand-red">
                  {childErr}
                </p>
              ) : null}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <Label htmlFor="child-name">Child's name</Label>
                  <TextInput
                    id="child-name"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    placeholder="e.g. Kwame"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="child-age">Age (yrs)</Label>
                  <TextInput
                    id="child-age"
                    type="number"
                    min="0"
                    value={childAge}
                    onChange={(e) => setChildAge(e.target.value)}
                    placeholder="2"
                    className="mt-1.5"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="child-allergies">Allergies (optional)</Label>
                <Textarea
                  id="child-allergies"
                  rows={2}
                  value={childAllergies}
                  onChange={(e) => setChildAllergies(e.target.value)}
                  placeholder="e.g. peanuts, penicillin — leave blank if none"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="child-notes">Routine / other needs (optional)</Label>
                <Textarea
                  id="child-notes"
                  rows={2}
                  value={childNotes}
                  onChange={(e) => setChildNotes(e.target.value)}
                  placeholder="e.g. afternoon nap at 1pm, prefers rice"
                  className="mt-1.5"
                />
              </div>
              <Button
                type="submit"
                color="light"
                disabled={!childName.trim()}
                className="self-start"
              >
                <AddIcon className="mr-1.5 size-4" />
                Add child
              </Button>
            </form>
          </section>
        ) : null}

        {/* Preferences */}
        <section className="mt-6 rounded-card bg-background-white p-6">
          <h2 className="text-lg font-semibold text-text-charcoal">Preferences</h2>
          <div className="mt-4 flex flex-col divide-y divide-neutral-border">
            <ToggleRow
              label="Push notifications"
              description="Booking updates and messages"
              checked={pushEnabled}
              onChange={setPushEnabled}
            />
            <ToggleRow
              label="Email updates"
              description="Receipts and account activity"
              checked={emailEnabled}
              onChange={setEmailEnabled}
            />
            <ToggleRow
              label="Dark mode"
              description="Match your device or switch manually"
              checked={computedMode === "dark"}
              onChange={toggleMode}
            />
          </div>
        </section>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-panel border border-neutral-border bg-background-white px-5 py-3 text-sm font-semibold text-text-charcoal transition-colors hover:bg-neutral-surface"
        >
          <LogoutIcon className="size-4.5" />
          Log out
        </button>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <dt className="text-sm text-text-muted">{label}</dt>
      <dd className="truncate text-sm font-medium text-text-charcoal">{value}</dd>
    </div>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-text-charcoal">{label}</p>
        <p className="text-xs text-text-muted">{description}</p>
      </div>
      <ToggleSwitch checked={checked} onChange={onChange} />
    </div>
  )
}
