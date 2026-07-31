import { useState } from "react"
import { Tabs, TabItem } from "flowbite-react"
import { Link } from "react-router-dom"
import { ArrowRightIcon, CalendarIcon, RequestsIcon, StarIcon, VerifiedIcon, WalletIcon } from "@/lib/icons"
import { cn } from "@/lib/utils"
import { AvailabilityCalendar } from "@/components/dashboard/AvailabilityCalendar"
import { earningsHistory, earningsSummary, incomingRequests } from "@/lib/caregiver-dashboard-data"
import { getCaregiverReviews, getFamilyReviewForBooking } from "@/lib/reviews-data"
import { ReviewCard } from "@/components/reviews/ReviewCard"

// Demo identity for the caregiver-side screens — mirrors the caregiver used
// elsewhere in the booking flow demo (see BookingConfirmation → ama-boateng).
const DEMO_CAREGIVER_ID = "ama-boateng"

// Flowbite's default underline tablist wraps onto a second row once four tabs
// no longer fit — on a phone-width screen that eats vertical space and looks
// broken. Scroll horizontally instead, keeping every tab on one line.
const tabsTheme = {
  tablist: {
    base: "flex text-center overflow-x-auto",
    variant: {
      underline: "flex-nowrap border-b border-neutral-border",
    },
    tabitem: {
      base: "flex shrink-0 items-center justify-center gap-2 rounded-t-lg p-4 text-sm font-medium whitespace-nowrap focus:outline-none",
    },
  },
}

type RequestDecision = "accepted" | "declined"

export default function CaregiverDashboard() {
  const [decisions, setDecisions] = useState<Record<string, RequestDecision>>({})
  const reviews = getCaregiverReviews(DEMO_CAREGIVER_ID)

  function decide(id: string, decision: RequestDecision) {
    setDecisions((prev) => ({ ...prev, [id]: decision }))
  }

  return (
    <div className="h-full overflow-y-auto bg-background-offwhite">
      <div className="mx-auto max-w-3xl px-6 py-8 md:px-10 md:py-10">
        <h1 className="text-xl font-bold text-text-charcoal md:text-2xl">Caregiver dashboard</h1>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="This week" value={`GHS ${earningsSummary.thisWeekGhs}`} />
          <Stat label="This month" value={`GHS ${earningsSummary.thisMonthGhs}`} />
          <Stat label="Rating" value={`★ ${earningsSummary.rating}`} />
          <Stat label="Completed" value={`${earningsSummary.completedBookings} bookings`} />
        </div>

        <Link
          to="/verification"
          className="mt-4 flex items-center gap-3 rounded-card bg-background-white p-4 transition-colors hover:bg-neutral-surface"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-verify-green-bg">
            <VerifiedIcon className="size-5 text-verify-green" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-text-charcoal">Verification &amp; documents</p>
            <p className="text-xs text-text-muted">Complete your checks to earn the verified badge</p>
          </div>
          <ArrowRightIcon className="size-4 shrink-0 text-text-muted" />
        </Link>

        <div className="mt-6 rounded-card bg-background-white p-4 md:p-6">
          <Tabs variant="underline" theme={tabsTheme}>
            <TabItem title="Requests" icon={RequestsIcon}>
              <div className="flex flex-col gap-3">
                {incomingRequests.map((req) => {
                  const decision = decisions[req.id]
                  return (
                    <div key={req.id} className="rounded-2xl bg-neutral-surface p-4">
                      <div className="flex items-start gap-3">
                        <img
                          src={req.parentAvatarUrl}
                          alt={req.parentName}
                          className="size-11 shrink-0 rounded-full object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold text-text-charcoal">{req.parentName}</p>
                            <p className="shrink-0 font-semibold text-text-charcoal">GHS {req.offerGhs}</p>
                          </div>
                          <p className="text-sm text-text-muted">
                            {req.date} · {req.time} · {req.durationHours}h
                          </p>
                          <p className="mt-1 text-sm text-text-muted">{req.notes}</p>
                        </div>
                      </div>

                      {decision ? (
                        <p
                          className={cn(
                            "mt-3 text-sm font-medium",
                            decision === "accepted" ? "text-verify-green" : "text-text-muted"
                          )}
                        >
                          {decision === "accepted" ? "Accepted" : "Declined"}
                        </p>
                      ) : (
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => decide(req.id, "accepted")}
                            className="flex-1 rounded-panel bg-verify-green px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => decide(req.id, "declined")}
                            className="flex-1 rounded-panel border border-neutral-border bg-background-white px-4 py-2 text-sm font-semibold text-text-charcoal transition-colors hover:bg-neutral-border/40"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </TabItem>

            <TabItem title="Availability" icon={CalendarIcon}>
              <AvailabilityCalendar />
            </TabItem>

            <TabItem title="Earnings" icon={WalletIcon}>
              <div className="flex flex-col divide-y divide-neutral-border">
                {earningsHistory.map((entry) => {
                  const needsReview = entry.status === "Paid" && !getFamilyReviewForBooking(entry.id)
                  return (
                    <div key={entry.id} className="flex flex-col gap-1.5 py-3.5 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-text-charcoal">{entry.parentName}</p>
                          <p className="text-xs text-text-muted">
                            {entry.date} · {entry.hours}h
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold text-text-charcoal">GHS {entry.amountGhs}</p>
                          <p
                            className={cn(
                              "text-xs font-medium",
                              entry.status === "Paid" ? "text-verify-green" : "text-verify-gold"
                            )}
                          >
                            {entry.status}
                          </p>
                        </div>
                      </div>
                      {needsReview ? (
                        <Link
                          to={`/dashboard/reviews/${entry.id}`}
                          className="self-end text-xs font-semibold text-brand-red hover:underline"
                        >
                          Rate this family
                        </Link>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </TabItem>

            <TabItem title="Reviews" icon={StarIcon}>
              {reviews.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {reviews.map((review) => (
                    <ReviewCard
                      key={review.id}
                      authorName={review.authorName}
                      authorAvatarUrl={review.authorAvatarUrl}
                      rating={review.rating}
                      date={review.date}
                      comment={review.comment}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-muted">No reviews yet.</p>
              )}
            </TabItem>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card bg-background-white p-4">
      <p className="text-xs font-medium text-text-muted uppercase">{label}</p>
      <p className="mt-1 text-lg font-bold text-text-charcoal">{value}</p>
    </div>
  )
}
