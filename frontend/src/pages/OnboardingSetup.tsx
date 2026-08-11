import { useEffect, useRef, useState } from "react"
import { Button, Label, TextInput, Textarea } from "flowbite-react"
import { useNavigate } from "react-router-dom"
import { Logo } from "@/components/layout/Logo"
import { PlaceAutocomplete } from "@/components/common/PlaceAutocomplete"
import { UploadIcon } from "@/lib/icons"
import { api, ApiError, mediaUrl, uploadFile } from "@/lib/api"
import { useRole } from "@/lib/role-context"

const fieldClassName =
  "[&_input]:rounded-panel [&_input]:border-neutral-border [&_input]:bg-neutral-surface [&_textarea]:rounded-panel [&_textarea]:border-neutral-border [&_textarea]:bg-neutral-surface"

interface LoadedProfile {
  community: string | null
  latitude: number | string | null
  longitude: number | string | null
  bio?: string | null
  daily_rate?: number | string | null
  languages?: string[] | null
  profile_photo_url?: string | null
}

/**
 * First-time profile setup, entered right after account verification.
 * Nurse: details → photo → location. Mother: location. Skippable; the same
 * fields remain editable later on the Profile page.
 */
export default function OnboardingSetup() {
  const navigate = useNavigate()
  const { role, token } = useRole()
  const isNurse = role === "caregiver"
  const landing = isNurse ? "/dashboard" : "/"
  const totalSteps = isNurse ? 3 : 1

  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [languages, setLanguages] = useState("")
  const [dailyRate, setDailyRate] = useState("")
  const [bio, setBio] = useState("")
  const [community, setCommunity] = useState("")
  const [lat, setLat] = useState("")
  const [lng, setLng] = useState("")
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const photoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!token) return
    const path = isNurse ? "/api/v1/nurses/me" : "/api/v1/mothers/me"
    api<LoadedProfile>(path, { token })
      .then((p) => {
        setCommunity(p.community ?? "")
        if (p.latitude != null) setLat(String(p.latitude))
        if (p.longitude != null) setLng(String(p.longitude))
        if (isNurse) {
          setBio(p.bio ?? "")
          setDailyRate(p.daily_rate != null ? String(p.daily_rate) : "")
          setLanguages(p.languages ? p.languages.join(", ") : "")
          if (p.profile_photo_url) setPhotoUrl(mediaUrl(p.profile_photo_url) ?? null)
        }
      })
      .catch(() => {})
  }, [token, isNurse])

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    try {
      const { url } = await uploadFile(file, token ?? undefined)
      await api("/api/v1/nurses/me", {
        method: "PATCH",
        body: { profile_photo_url: url },
        token: token ?? undefined,
      })
      setPhotoUrl(mediaUrl(url) ?? null)
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Upload failed. Try again.")
    }
  }

  async function saveDetails() {
    const langs = languages
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    const body: Record<string, unknown> = {
      bio: bio || null,
      languages: langs.length ? langs : null,
    }
    if (dailyRate.trim()) body.daily_rate = dailyRate.trim()
    await api("/api/v1/nurses/me", { method: "PATCH", body, token: token ?? undefined })
  }

  async function saveLocation() {
    const body: Record<string, unknown> = { community: community || null }
    if (lat && lng) {
      body.latitude = Number(lat)
      body.longitude = Number(lng)
    }
    const path = isNurse ? "/api/v1/nurses/me" : "/api/v1/mothers/me"
    await api(path, { method: "PATCH", body, token: token ?? undefined })
  }

  async function handleNext() {
    setError(null)
    setSaving(true)
    try {
      if (!isNurse) {
        await saveLocation()
        navigate(landing, { replace: true })
        return
      }
      if (step === 0) {
        await saveDetails()
        setStep(1)
      } else if (step === 1) {
        setStep(2) // photo saved on selection
      } else {
        await saveLocation()
        navigate(landing, { replace: true })
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Couldn't save. Try again.")
    } finally {
      setSaving(false)
    }
  }

  const title = !isNurse
    ? "Where do you need care?"
    : step === 0
      ? "About your care"
      : step === 1
        ? "Add a profile photo"
        : "Where are you based?"

  return (
    <div className="flex min-h-svh flex-col items-center bg-background-offwhite px-6 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-4 text-center">
          <Logo className="h-8" />
          <div>
            <p className="text-xs font-medium tracking-wide text-text-muted uppercase">
              Step {step + 1} of {totalSteps}
            </p>
            <h1 className="mt-1 text-xl font-bold text-text-charcoal">{title}</h1>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-surface">
            <div
              className="h-full rounded-full bg-brand-red transition-all"
              style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <div className={`rounded-card bg-background-white p-6 ${fieldClassName}`}>
          {error ? (
            <p className="mb-4 rounded-panel bg-brand-red-tint px-3 py-2 text-sm text-brand-red">
              {error}
            </p>
          ) : null}

          {/* Nurse step 0 — details */}
          {isNurse && step === 0 ? (
            <div className="flex flex-col gap-4">
              <div>
                <Label htmlFor="languages">Languages (comma-separated)</Label>
                <TextInput
                  id="languages"
                  value={languages}
                  onChange={(e) => setLanguages(e.target.value)}
                  placeholder="English, Twi, Ga"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="daily_rate">Daily rate (GHS)</Label>
                <TextInput
                  id="daily_rate"
                  type="number"
                  min="0"
                  value={dailyRate}
                  onChange={(e) => setDailyRate(e.target.value)}
                  placeholder="150"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="bio">Short bio</Label>
                <Textarea
                  id="bio"
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell families about your experience"
                  className="mt-1.5"
                />
              </div>
              <p className="text-xs text-text-muted">
                You'll upload your NMC PIN / license photo and ID on the verification page next.
              </p>
            </div>
          ) : null}

          {/* Nurse step 1 — photo */}
          {isNurse && step === 1 ? (
            <div className="flex flex-col items-center gap-4 py-2">
              <span className="flex size-24 items-center justify-center overflow-hidden rounded-full bg-neutral-surface">
                {photoUrl ? (
                  <img src={photoUrl} alt="Profile" className="size-full object-cover" />
                ) : (
                  <UploadIcon className="size-6 text-text-muted" />
                )}
              </span>
              <input
                ref={photoRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhoto}
              />
              <button
                type="button"
                onClick={() => photoRef.current?.click()}
                className="flex items-center gap-2 rounded-panel border border-dashed border-neutral-border bg-neutral-surface px-4 py-2.5 text-sm font-medium text-text-charcoal hover:bg-neutral-border/30"
              >
                <UploadIcon className="size-4.5" />
                {photoUrl ? "Change photo" : "Upload photo"}
              </button>
              <p className="text-center text-xs text-text-muted">
                Families must see who they're booking.
              </p>
            </div>
          ) : null}

          {/* Location step (nurse step 2, or the mother's only step) */}
          {(isNurse && step === 2) || !isNurse ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="community">Community / area</Label>
              <PlaceAutocomplete
                id="community"
                value={community}
                onChange={setCommunity}
                onSelect={(place) => {
                  setCommunity(place.name)
                  setLat(String(place.lat))
                  setLng(String(place.lng))
                }}
                placeholder="Start typing — e.g. Dzorwulu, Achimota, Tema…"
              />
              {lat && lng ? (
                <p className="text-xs text-verify-green">📍 Location set</p>
              ) : (
                <p className="text-xs text-text-muted">Pick a place from the list</p>
              )}
            </div>
          ) : null}

          <div className="mt-6 flex items-center gap-3">
            {isNurse && step > 0 ? (
              <Button
                color="light"
                onClick={() => setStep((s) => s - 1)}
                disabled={saving}
                theme={{
                  color: {
                    light:
                      "border-neutral-border bg-background-white text-text-charcoal hover:bg-neutral-surface dark:border-neutral-border dark:bg-background-white dark:text-text-charcoal",
                  },
                }}
              >
                Back
              </Button>
            ) : null}
            <Button color="default" fullSized onClick={handleNext} disabled={saving}>
              {saving
                ? "Saving…"
                : (isNurse && step < 2) || false
                  ? "Continue"
                  : "Finish"}
            </Button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate(landing, { replace: true })}
          className="mx-auto mt-4 block text-sm text-text-muted hover:underline"
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}
