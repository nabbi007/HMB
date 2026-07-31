import { Link, useParams } from "react-router-dom"
import { BackIcon } from "@/lib/icons"
import { getCaregiver } from "@/lib/mock-data"
import { bookings } from "@/lib/bookings-data"
import { caregiverReviews } from "@/lib/reviews-data"
import { ReviewForm } from "@/components/reviews/ReviewForm"

export default function WriteReview() {
  const { id } = useParams()
  const caregiver = id ? getCaregiver(id) : undefined
  const booking = id ? bookings.find((b) => b.caregiverId === id && b.status === "Completed") : undefined

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

  const existing = caregiverReviews.find((r) => r.bookingId === booking.id)
  const firstName = caregiver.name.split(" ")[0]

  return (
    <div className="h-full overflow-y-auto bg-background-offwhite">
      <div className="mx-auto max-w-lg px-6 py-8 md:px-10 md:py-10">
        <Link
          to="/bookings"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text-charcoal"
        >
          <BackIcon className="size-4" />
          Back to bookings
        </Link>

        <h1 className="text-xl font-bold text-text-charcoal md:text-2xl">Rate your booking</h1>
        <p className="mt-1 text-sm text-text-muted">
          Your feedback helps other parents and keeps caregivers accountable.
        </p>

        <div className="mt-6">
          <ReviewForm
            targetName={caregiver.name}
            targetAvatarUrl={caregiver.avatarUrl}
            targetMeta={`${booking.date} · ${booking.time}`}
            prompt={`Rate your experience with ${firstName}`}
            placeholder="How was your care experience? Anything other parents should know?"
            submittedMessage={`Thanks for the feedback — it's now visible on ${firstName}'s profile.`}
            existingReview={existing}
          />
        </div>
      </div>
    </div>
  )
}
