import { Link, useParams } from "react-router-dom"
import { BackIcon } from "@/lib/icons"
import { earningsHistory } from "@/lib/caregiver-dashboard-data"
import { familyReviews } from "@/lib/reviews-data"
import { ReviewForm } from "@/components/reviews/ReviewForm"

export default function WriteFamilyReview() {
  const { id } = useParams()
  const entry = id ? earningsHistory.find((e) => e.id === id) : undefined

  if (!entry) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-lg font-semibold text-text-charcoal">Booking not found</p>
        <Link to="/dashboard" className="text-sm font-medium text-brand-red hover:underline">
          Back to dashboard
        </Link>
      </div>
    )
  }

  const existing = familyReviews.find((r) => r.bookingId === entry.id)
  const firstName = entry.parentName.split(" ")[0]

  return (
    <div className="h-full overflow-y-auto bg-background-offwhite">
      <div className="mx-auto max-w-lg px-6 py-8 md:px-10 md:py-10">
        <Link
          to="/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text-charcoal"
        >
          <BackIcon className="size-4" />
          Back to dashboard
        </Link>

        <h1 className="text-xl font-bold text-text-charcoal md:text-2xl">Rate this family</h1>
        <p className="mt-1 text-sm text-text-muted">
          Your feedback stays on file with HelloMama and helps other caregivers know what to expect.
        </p>

        <div className="mt-6">
          <ReviewForm
            targetName={entry.parentName}
            targetAvatarUrl={entry.parentAvatarUrl}
            targetMeta={`${entry.date} · ${entry.hours}h`}
            prompt={`Rate your experience with ${firstName}'s family`}
            placeholder="How was communication, punctuality, and the home environment?"
            submittedMessage="Thanks for the feedback."
            existingReview={existing}
          />
        </div>
      </div>
    </div>
  )
}
