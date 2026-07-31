import { Badge, Button } from "flowbite-react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { CheckCircleIcon, WarningIcon } from "@/lib/icons"
import { getCaregiver } from "@/lib/mock-data"
import { bookings } from "@/lib/bookings-data"
import { bookingStatusTheme } from "@/components/bookings/booking-status-theme"

const steps = ["Scheduled", "Checked in", "Care in progress", "Checked out"] as const

export default function ActiveShift() {
  const { id } = useParams()
  const navigate = useNavigate()
  const caregiver = id ? getCaregiver(id) : undefined
  const booking = id ? bookings.find((b) => b.caregiverId === id) : undefined

  if (!caregiver || !booking) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-lg font-semibold text-text-charcoal">Booking not found</p>
        <Link to="/bookings" className="text-sm font-medium text-brand-red hover:underline">
          Back to bookings
        </Link>
      </div>
    )
  }

  const currentStep = booking.status === "Active" ? 2 : booking.status === "Completed" ? 3 : 0

  return (
    <div className="h-full overflow-y-auto bg-background-offwhite">
      <div className="mx-auto max-w-2xl px-6 py-8 md:px-10 md:py-10">
        <h1 className="text-xl font-bold text-text-charcoal md:text-2xl">Active booking</h1>

        {/* Caregiver + booking summary */}
        <div className="mt-6 flex items-center gap-4 rounded-card bg-background-white p-6">
          <img
            src={caregiver.avatarUrl}
            alt={caregiver.name}
            className="size-14 shrink-0 rounded-full object-cover"
          />
          <div className="min-w-0 flex-1">
            <Link to={`/caregivers/${caregiver.id}`} className="font-semibold text-text-charcoal hover:underline">
              {caregiver.name}
            </Link>
            <p className="text-sm text-text-muted">
              {caregiver.role} · {caregiver.specialty}
            </p>
            <p className="mt-1 text-sm text-text-muted">
              {booking.date} · {booking.time}
            </p>
          </div>
          <Badge className="shrink-0 rounded-[10px]" theme={bookingStatusTheme[booking.status]}>
            {booking.status}
          </Badge>
        </div>

        {/* Check-in status */}
        <div className="mt-6 rounded-card bg-background-white p-6">
          <h2 className="text-lg font-semibold text-text-charcoal">Check-in status</h2>
          <ol className="mt-5 flex items-start justify-between">
            {steps.map((step, index) => {
              const done = index < currentStep || (index === currentStep && booking.status === "Completed")
              const active = index === currentStep && booking.status !== "Completed"
              return (
                <li key={step} className="flex flex-1 flex-col items-center gap-2 text-center">
                  <div className="flex w-full items-center">
                    <div
                      className={`h-0.5 flex-1 ${index === 0 ? "invisible" : done || active ? "bg-brand-red" : "bg-neutral-border"}`}
                    />
                    {done ? (
                      <CheckCircleIcon className="size-6 shrink-0 text-brand-red" />
                    ) : (
                      <span
                        className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 ${active ? "border-brand-red bg-brand-red" : "border-neutral-border"}`}
                      />
                    )}
                    <div
                      className={`h-0.5 flex-1 ${index === steps.length - 1 ? "invisible" : done ? "bg-brand-red" : "bg-neutral-border"}`}
                    />
                  </div>
                  <span
                    className={`text-xs font-medium ${done || active ? "text-text-charcoal" : "text-text-muted"}`}
                  >
                    {step}
                  </span>
                </li>
              )
            })}
          </ol>

          {booking.notes ? (
            <p className="mt-5 rounded-panel bg-neutral-surface p-4 text-sm text-text-muted">{booking.notes}</p>
          ) : null}
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <Button
            fullSized
            color="light"
            theme={{ color: { light: "border-neutral-border bg-background-white text-text-charcoal hover:bg-neutral-surface dark:border-neutral-border dark:bg-background-white dark:text-text-charcoal dark:hover:bg-neutral-surface" } }}
            onClick={() => navigate(`/messages/${caregiver.id}`)}
          >
            Message {caregiver.name.split(" ")[0]}
          </Button>
        </div>

        {/* SOS — deliberately not brand red: solid near-black fill with a red outline
            and icon, so it reads as unmistakably different from every red CTA. */}
        <button
          type="button"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-panel border-2 border-sos-accent bg-sos-fill px-5 py-4 font-semibold text-white transition-opacity hover:opacity-90"
        >
          <WarningIcon className="size-5 text-sos-accent" />
          SOS — Emergency
        </button>
      </div>
    </div>
  )
}
