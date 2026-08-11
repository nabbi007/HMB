import { useEffect, useState } from "react"
import { Button, Label, Select, Textarea, TextInput } from "flowbite-react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { BackIcon, StarIcon, VerifiedIcon } from "@/lib/icons"
import { api, ApiError, mediaUrl } from "@/lib/api"
import { useRole } from "@/lib/role-context"

function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

interface NursePublic {
  id: string
  name: string
  bio: string | null
  daily_rate: number | string | null
  community: string | null
  languages: string[]
  rating: number | string
  review_count: number
  profile_photo_url: string | null
}

interface Child {
  id: string
  name: string
  age_years: number | null
  allergies: string | null
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

export default function CaregiverProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token, role } = useRole()
  const [nurse, setNurse] = useState<NursePublic | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Booking request form
  const [booking, setBooking] = useState(false)
  const [careDate, setCareDate] = useState(todayIso())
  const [startTime, setStartTime] = useState("09:00")
  const [hours, setHours] = useState("8")
  const [note, setNote] = useState("")
  const [children, setChildren] = useState<Child[]>([])
  const [childId, setChildId] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [bookingErr, setBookingErr] = useState<string | null>(null)

  // A parent's children, so they can say who the booking is for.
  useEffect(() => {
    if (!token || role !== "parent") return
    api<Child[]>("/api/v1/mothers/me/children", { token })
      .then(setChildren)
      .catch(() => setChildren([]))
  }, [token, role])

  async function submitBooking(e: React.FormEvent) {
    e.preventDefault()
    setBookingErr(null)
    setSubmitting(true)
    try {
      await api("/api/v1/bookings", {
        method: "POST",
        token: token ?? undefined,
        body: {
          nurse_id: id,
          child_id: childId || null,
          care_date: careDate,
          start_time: startTime,
          hours: Number(hours),
          note: note || null,
        },
      })
      navigate("/bookings")
    } catch (err) {
      setBookingErr(err instanceof ApiError ? err.detail : "Couldn't send the request.")
    } finally {
      setSubmitting(false)
    }
  }

  const selectedChild = children.find((c) => c.id === childId)

  useEffect(() => {
    if (!id || !token) return
    api<NursePublic>(`/api/v1/nurses/${id}`, { token })
      .then(setNurse)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setNotFound(true)
      })
      .finally(() => setLoading(false))
  }, [id, token])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-text-muted">Loading…</div>
    )
  }

  if (notFound || !nurse) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-lg font-semibold text-text-charcoal">Caregiver not found</p>
        <p className="text-sm text-text-muted">
          This caregiver may not be verified yet or the link is incorrect.
        </p>
        <Link to="/" className="text-sm font-medium text-brand-red hover:underline">
          Back to search
        </Link>
      </div>
    )
  }

  const firstName = nurse.name.split(" ")[0]
  const rating = Number(nurse.rating)
  const rate = nurse.daily_rate != null ? Number(nurse.daily_rate) : null
  const photo = mediaUrl(nurse.profile_photo_url)

  return (
    <div className="h-full overflow-y-auto bg-background-offwhite">
      <div className="mx-auto max-w-3xl px-6 py-8 md:px-10 md:py-10">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text-charcoal"
        >
          <BackIcon className="size-4" />
          Back to search
        </Link>

        {/* Header */}
        <div className="flex flex-col gap-6 rounded-card bg-background-white p-6 shadow-sm md:flex-row md:items-start md:p-8">
          {photo ? (
            <img
              src={photo}
              alt={nurse.name}
              className="size-24 shrink-0 self-center rounded-full object-cover ring-4 ring-verify-green ring-offset-2 ring-offset-background-white md:self-start"
            />
          ) : (
            <span className="flex size-24 shrink-0 items-center justify-center self-center rounded-full bg-brand-red text-3xl font-bold text-white md:self-start">
              {initials(nurse.name)}
            </span>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-text-charcoal md:text-2xl">{nurse.name}</h1>
              <span className="flex items-center gap-1 rounded-[10px] bg-verify-green-bg px-2 py-0.5 text-xs font-medium text-verify-green">
                <VerifiedIcon className="size-3.5" />
                Verified
              </span>
            </div>
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-text-muted">
              <span className="inline-flex items-center gap-1">
                <StarIcon className="size-4 text-verify-gold" />
                {rating > 0 ? rating.toFixed(1) : "New"} ({nurse.review_count})
              </span>
              {nurse.community ? <span>· {nurse.community}</span> : null}
              {nurse.languages.length ? <span>· {nurse.languages.join(", ")}</span> : null}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              {role === "parent" ? (
                <Button color="default" onClick={() => setBooking((b) => !b)}>
                  Book {firstName}
                </Button>
              ) : null}
              {rate != null ? (
                <span className="text-lg font-bold text-text-charcoal">GHS {rate}/day</span>
              ) : null}
            </div>

            {booking ? (
              <form
                onSubmit={submitBooking}
                className="mt-4 flex flex-col gap-3 [&_input]:rounded-panel [&_input]:border-neutral-border [&_input]:bg-neutral-surface [&_textarea]:rounded-panel [&_textarea]:border-neutral-border [&_textarea]:bg-neutral-surface"
              >
                {bookingErr ? (
                  <p className="rounded-panel bg-brand-red-tint px-3 py-2 text-sm text-brand-red">
                    {bookingErr}
                  </p>
                ) : null}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <Label htmlFor="care-date">Date</Label>
                    <TextInput
                      id="care-date"
                      type="date"
                      min={todayIso()}
                      value={careDate}
                      onChange={(e) => setCareDate(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="start-time">Start</Label>
                    <TextInput
                      id="start-time"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hours">Hours</Label>
                    <TextInput
                      id="hours"
                      type="number"
                      min="1"
                      max="24"
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="child">Which child? (optional)</Label>
                  <Select
                    id="child"
                    value={childId}
                    onChange={(e) => setChildId(e.target.value)}
                    className="mt-1.5"
                  >
                    <option value="">Not specified</option>
                    {children.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                        {c.age_years != null ? ` (${c.age_years} yr)` : ""}
                      </option>
                    ))}
                  </Select>
                  {selectedChild?.allergies ? (
                    <p className="mt-1.5 text-xs font-medium text-brand-red">
                      ⚠ {selectedChild.name} has allergies: {selectedChild.allergies}. {firstName}{" "}
                      will see this.
                    </p>
                  ) : children.length === 0 ? (
                    <p className="mt-1.5 text-xs text-text-muted">
                      Add your children in your profile to share their details (incl. allergies)
                      with the caregiver.
                    </p>
                  ) : null}
                </div>
                <div>
                  <Label htmlFor="note">Note (optional)</Label>
                  <Textarea
                    id="note"
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Feeding schedule, access instructions…"
                    className="mt-1.5"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" color="default" disabled={submitting}>
                    {submitting ? "Sending…" : "Send booking request"}
                  </Button>
                  <Button
                    color="light"
                    onClick={() => setBooking(false)}
                    theme={{
                      color: {
                        light:
                          "border-neutral-border bg-background-white text-text-charcoal hover:bg-neutral-surface dark:border-neutral-border dark:bg-background-white dark:text-text-charcoal",
                      },
                    }}
                  >
                    Cancel
                  </Button>
                </div>
                <p className="text-xs text-text-muted">
                  No payment yet — {firstName} will accept or decline your request.
                </p>
              </form>
            ) : null}
          </div>
        </div>

        {/* About */}
        {nurse.bio ? (
          <section className="mt-6 rounded-card bg-background-white p-6 md:p-8">
            <h2 className="text-lg font-semibold text-text-charcoal">About</h2>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">{nurse.bio}</p>
          </section>
        ) : null}

        {/* Details */}
        <section className="mt-6 rounded-card bg-background-white p-6 md:p-8">
          <h2 className="text-lg font-semibold text-text-charcoal">Details</h2>
          <dl className="mt-4 flex flex-col divide-y divide-neutral-border">
            {nurse.languages.length ? <Row label="Languages" value={nurse.languages.join(", ")} /> : null}
            {nurse.community ? <Row label="Community" value={nurse.community} /> : null}
            {rate != null ? <Row label="Rate" value={`GHS ${rate}/day`} /> : null}
          </dl>
        </section>

        {/* Reviews */}
        <section className="mt-6 rounded-card bg-background-white p-6 md:p-8">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-text-charcoal">Reviews</h2>
            <p className="text-sm text-text-muted">
              ★ {rating > 0 ? rating.toFixed(1) : "New"} · {nurse.review_count} reviews
            </p>
          </div>
          <p className="mt-4 text-sm text-text-muted">
            No reviews yet — reviews appear here after completed bookings.
          </p>
        </section>
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
