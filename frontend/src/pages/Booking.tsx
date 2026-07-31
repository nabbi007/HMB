import { useState } from "react"
import { Button, Label, Textarea, TextInput, ToggleSwitch } from "flowbite-react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { BackIcon } from "@/lib/icons"
import { getCaregiver } from "@/lib/mock-data"

const fieldClassName =
  "[&_input]:rounded-panel [&_input]:border-neutral-border [&_input]:bg-neutral-surface [&_input]:text-text-charcoal [&_input]:focus:border-brand-red [&_input]:focus:ring-brand-red"

function todayIso() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
}

function computeHours(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number)
  const [eh, em] = end.split(":").map(Number)
  if ([sh, sm, eh, em].some(Number.isNaN)) return 0
  let startMinutes = sh * 60 + sm
  let endMinutes = eh * 60 + em
  if (endMinutes <= startMinutes) endMinutes += 24 * 60 // shift crosses midnight
  return (endMinutes - startMinutes) / 60
}

export default function Booking() {
  const { id } = useParams()
  const navigate = useNavigate()
  const caregiver = id ? getCaregiver(id) : undefined

  const [date, setDate] = useState(todayIso())
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("17:00")
  const [recurring, setRecurring] = useState(false)
  const [notes, setNotes] = useState("")

  if (!caregiver) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-lg font-semibold text-text-charcoal">Caregiver not found</p>
        <Link to="/" className="text-sm font-medium text-brand-red hover:underline">
          Back to search
        </Link>
      </div>
    )
  }

  const hours = computeHours(startTime, endTime)
  const total = Math.round(hours * caregiver.priceGhsPerHour)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    navigate(`/bookings/${caregiver!.id}/confirmation`)
  }

  return (
    <div className="h-full overflow-y-auto bg-background-offwhite">
      <div className="mx-auto max-w-2xl px-6 py-8 md:px-10 md:py-10">
        <Link
          to={`/caregivers/${caregiver.id}`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text-charcoal"
        >
          <BackIcon className="size-4" />
          Back to profile
        </Link>

        <h1 className="text-xl font-bold text-text-charcoal md:text-2xl">Book {caregiver.name}</h1>

        <div className="mt-6 flex items-center gap-4 rounded-card bg-background-white p-6">
          <img
            src={caregiver.avatarUrl}
            alt={caregiver.name}
            className="size-14 shrink-0 rounded-full object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-text-charcoal">{caregiver.name}</p>
            <p className="text-sm text-text-muted">
              {caregiver.role} · {caregiver.specialty}
            </p>
          </div>
          <p className="shrink-0 font-semibold text-text-charcoal">GHS {caregiver.priceGhsPerHour}/hr</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-6">
          <section className="rounded-card bg-background-white p-6">
            <h2 className="text-lg font-semibold text-text-charcoal">Date &amp; time</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="date">Date</Label>
                <TextInput
                  id="date"
                  type="date"
                  required
                  min={todayIso()}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`mt-1.5 ${fieldClassName}`}
                />
              </div>
              <div>
                <Label htmlFor="start-time">Start time</Label>
                <TextInput
                  id="start-time"
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={`mt-1.5 ${fieldClassName}`}
                />
              </div>
              <div>
                <Label htmlFor="end-time">End time</Label>
                <TextInput
                  id="end-time"
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={`mt-1.5 ${fieldClassName}`}
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-4 border-t border-neutral-border pt-4">
              <div>
                <p className="text-sm font-medium text-text-charcoal">Repeat weekly</p>
                <p className="text-xs text-text-muted">Book this same shift every week</p>
              </div>
              <ToggleSwitch checked={recurring} onChange={setRecurring} />
            </div>
          </section>

          <section className="rounded-card bg-background-white p-6">
            <h2 className="text-lg font-semibold text-text-charcoal">Notes for {caregiver.name.split(" ")[0]}</h2>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Feeding schedule, allergies, access instructions…"
              rows={4}
              className="mt-3 rounded-panel border-neutral-border bg-neutral-surface text-text-charcoal placeholder:text-text-muted focus:border-brand-red focus:ring-brand-red"
            />
          </section>

          <section className="rounded-card bg-background-white p-6">
            <h2 className="text-lg font-semibold text-text-charcoal">Payment summary</h2>
            <dl className="mt-4 flex flex-col divide-y divide-neutral-border">
              <SummaryRow label="Duration" value={hours > 0 ? `${hours}h` : "—"} />
              <SummaryRow label="Rate" value={`GHS ${caregiver.priceGhsPerHour}/hr`} />
              <SummaryRow label="Total" value={`GHS ${total}`} emphasize />
            </dl>
            <p className="mt-4 rounded-panel bg-neutral-surface p-3 text-xs text-text-muted">
              Your payment is held in escrow and only released to {caregiver.name.split(" ")[0]} once the
              shift is confirmed complete.
            </p>
          </section>

          <Button type="submit" color="default" fullSized disabled={hours <= 0}>
            Confirm booking — GHS {total}
          </Button>
        </form>
      </div>
    </div>
  )
}

function SummaryRow({
  label,
  value,
  emphasize,
}: {
  label: string
  value: string
  emphasize?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <dt className="text-sm text-text-muted">{label}</dt>
      <dd className={emphasize ? "text-lg font-bold text-text-charcoal" : "text-sm font-medium text-text-charcoal"}>
        {value}
      </dd>
    </div>
  )
}
