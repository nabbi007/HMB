import { Avatar, Badge } from "flowbite-react"
import { Link } from "react-router-dom"
import { avatarSizeTheme } from "@/lib/avatar-theme"
import { getCaregiver } from "@/lib/mock-data"
import { hasCaregiverReviewForBooking } from "@/lib/reviews-data"
import { bookingStatusTheme } from "./booking-status-theme"
import type { Booking } from "@/lib/bookings-data"

const tierRing = {
  green: "ring-verify-green",
  gold: "ring-verify-gold",
} as const

export function BookingListItem({ booking }: { booking: Booking }) {
  const caregiver = getCaregiver(booking.caregiverId)
  if (!caregiver) return null

  const isTrackable = booking.status === "Active" || booking.status === "Upcoming"
  const destination = isTrackable ? `/bookings/${caregiver.id}/shift` : `/caregivers/${caregiver.id}`
  const needsReview = booking.status === "Completed" && !hasCaregiverReviewForBooking(booking.id)

  return (
    <div className="relative flex w-full items-center gap-3.5 rounded-2xl bg-neutral-surface p-4 transition-colors hover:bg-neutral-border/60">
      <Avatar
        rounded
        size="md"
        img={caregiver.avatarUrl}
        alt={caregiver.name}
        theme={avatarSizeTheme("size-12")}
        className={`shrink-0 rounded-full ring-3 ring-offset-2 ring-offset-background-white ${tierRing[caregiver.verificationTier]}`}
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <Link
            to={destination}
            className="truncate text-lg font-semibold text-text-charcoal after:absolute after:inset-0 hover:underline"
          >
            {caregiver.name}
          </Link>
          <Badge className="shrink-0 rounded-[10px]" theme={bookingStatusTheme[booking.status]}>
            {booking.status}
          </Badge>
        </div>
        <span className="text-sm text-text-muted">
          {booking.date} · {booking.time}
        </span>
        <span className="text-sm text-text-muted">
          {booking.durationHours}h · GHS {booking.totalPriceGhs}
        </span>
        {needsReview ? (
          <Link
            to={`/bookings/${caregiver.id}/review`}
            className="relative z-10 mt-1 w-fit rounded-panel bg-brand-red px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
          >
            Leave a review
          </Link>
        ) : null}
      </div>
    </div>
  )
}
