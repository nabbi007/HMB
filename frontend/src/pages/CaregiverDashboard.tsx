import { useCallback, useEffect, useState } from "react"
import { Tabs, TabItem } from "flowbite-react"
import { Link, useNavigate } from "react-router-dom"
import { CalendarIcon, RequestsIcon, StarIcon, WalletIcon } from "@/lib/icons"
import { cn } from "@/lib/utils"
import { AvailabilityCalendar } from "@/components/dashboard/AvailabilityCalendar"
import { earningsHistory, earningsSummary } from "@/lib/caregiver-dashboard-data"
import { getCaregiverReviews, getFamilyReviewForBooking } from "@/lib/reviews-data"
import { ReviewCard } from "@/components/reviews/ReviewCard"
import { api } from "@/lib/api"
import { useRole } from "@/lib/role-context"
import { VerificationGate } from "@/components/dashboard/VerificationGate"

const DEMO_CAREGIVER_ID = "ama-boateng"

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

interface Booking {
  id: string
  status: string
  care_date: string
  start_time: string
  hours: number
  note: string | null
  estimated_amount: number | string | null
  mother_user_id: string
  mother_name: string
  payment_status: string | null
  hmb_fee: number | string | null
  nurse_payout: number | string | null
  child_name: string | null
  child_age_years: number | null
  child_allergies: string | null
  child_notes: string | null
}

const statusStyle: Record<string, string> = {
  accepted: "bg-verify-gold-bg text-verify-gold",
  confirmed: "bg-verify-green-bg text-verify-green",
  completed: "bg-verify-green-bg text-verify-green",
  declined: "bg-neutral-surface text-text-muted",
  cancelled: "bg-neutral-surface text-text-muted",
}

const statusLabel: Record<string, string> = {
  accepted: "awaiting payment",
  confirmed: "paid",
}

function initials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?"
}

export default function CaregiverDashboard() {
  const navigate = useNavigate()
  const { isVerifiedCaregiver: verified, user, token } = useRole()
  const firstName = user?.full_name?.split(" ")[0]
  const reviews = getCaregiverReviews(DEMO_CAREGIVER_ID)

  const [bookings, setBookings] = useState<Booking[]>([])
  const [loadingBookings, setLoadingBookings] = useState(true)

  const loadBookings = useCallback(() => {
    if (!token) return
    setLoadingBookings(true)
    api<Booking[]>("/api/v1/bookings", { token })
      .then(setBookings)
      .catch(() => setBookings([]))
      .finally(() => setLoadingBookings(false))
  }, [token])

  useEffect(() => {
    if (verified) loadBookings()
  }, [verified, loadBookings])

  const [busy, setBusy] = useState<string | null>(null)

  async function decide(id: string, accept: boolean) {
    await api(`/api/v1/bookings/${id}/${accept ? "accept" : "decline"}`, {
      method: "POST",
      token: token ?? undefined,
    })
    loadBookings()
  }

  async function markComplete(id: string) {
    setBusy(id)
    try {
      await api(`/api/v1/bookings/${id}/complete`, { method: "POST", token: token ?? undefined })
      loadBookings()
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-background-offwhite">
      <div className="mx-auto max-w-3xl px-6 py-8 md:px-10 md:py-10">
        <h1 className="text-xl font-bold text-text-charcoal md:text-2xl">
          {firstName ? `${firstName}'s dashboard` : "Caregiver dashboard"}
        </h1>

        {!verified ? (
          <VerificationGate name={firstName} />
        ) : (
          <>
            {/* Stats */}
            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat label="This week" value={`GHS ${earningsSummary.thisWeekGhs}`} />
              <Stat label="This month" value={`GHS ${earningsSummary.thisMonthGhs}`} />
              <Stat label="Rating" value={`★ ${earningsSummary.rating}`} />
              <Stat label="Completed" value={`${earningsSummary.completedBookings} bookings`} />
            </div>

            <div className="mt-6 rounded-card bg-background-white p-4 md:p-6">
              <Tabs variant="underline" theme={tabsTheme}>
                <TabItem title="Requests" icon={RequestsIcon}>
                  {loadingBookings ? (
                    <p className="text-sm text-text-muted">Loading…</p>
                  ) : bookings.length === 0 ? (
                    <p className="text-sm text-text-muted">No booking requests yet.</p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {bookings.map((b) => (
                        <div key={b.id} className="rounded-2xl bg-neutral-surface p-4">
                          <div className="flex items-start gap-3">
                            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-red text-sm font-bold text-white">
                              {initials(b.mother_name)}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-semibold text-text-charcoal">{b.mother_name}</p>
                                {b.estimated_amount != null ? (
                                  <p className="shrink-0 font-semibold text-text-charcoal">
                                    GHS {Number(b.estimated_amount)}
                                  </p>
                                ) : null}
                              </div>
                              <p className="text-sm text-text-muted">
                                {b.care_date} · {b.start_time} · {b.hours}h
                              </p>
                              {b.child_name ? (
                                <p className="mt-1 text-sm text-text-charcoal">
                                  For {b.child_name}
                                  {b.child_age_years != null ? ` · ${b.child_age_years} yr` : ""}
                                </p>
                              ) : null}
                              {b.child_notes ? (
                                <p className="text-sm text-text-muted">{b.child_notes}</p>
                              ) : null}
                              {b.note ? (
                                <p className="mt-1 text-sm text-text-muted">{b.note}</p>
                              ) : null}
                              {b.child_allergies ? (
                                <p className="mt-2 rounded-panel bg-brand-red-tint px-2.5 py-1.5 text-sm font-semibold text-brand-red">
                                  ⚠ Allergies: {b.child_allergies}
                                </p>
                              ) : null}
                            </div>
                          </div>

                          {b.status === "requested" ? (
                            <div className="mt-3 flex gap-2">
                              <button
                                type="button"
                                onClick={() => decide(b.id, true)}
                                className="flex-1 rounded-panel bg-verify-green px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                              >
                                Accept
                              </button>
                              <button
                                type="button"
                                onClick={() => decide(b.id, false)}
                                className="flex-1 rounded-panel border border-neutral-border bg-background-white px-4 py-2 text-sm font-semibold text-text-charcoal transition-colors hover:bg-neutral-border/40"
                              >
                                Decline
                              </button>
                            </div>
                          ) : (
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <span
                                className={cn(
                                  "inline-block rounded-[10px] px-2.5 py-1 text-xs font-medium capitalize",
                                  statusStyle[b.status] ?? "bg-neutral-surface text-text-muted"
                                )}
                              >
                                {statusLabel[b.status] ?? b.status}
                              </span>
                              {b.nurse_payout != null &&
                              (b.status === "confirmed" || b.status === "completed") ? (
                                <span className="text-xs text-text-muted">
                                  Payout GHS {Number(b.nurse_payout)} (after fee)
                                </span>
                              ) : null}
                            </div>
                          )}
                          {b.status === "confirmed" ? (
                            <button
                              type="button"
                              onClick={() => markComplete(b.id)}
                              disabled={busy === b.id}
                              className="mt-3 w-full rounded-panel bg-verify-green px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                            >
                              {busy === b.id ? "Processing…" : "Mark visit complete"}
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/messages/${b.mother_user_id}`, {
                                state: { name: b.mother_name },
                              })
                            }
                            className="mt-3 block text-sm font-medium text-text-charcoal hover:underline"
                          >
                            Message {b.mother_name.split(" ")[0]}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </TabItem>

                <TabItem title="Availability" icon={CalendarIcon}>
                  <AvailabilityCalendar />
                </TabItem>

                <TabItem title="Earnings" icon={WalletIcon}>
                  {earningsHistory.length === 0 ? (
                    <p className="text-sm text-text-muted">No earnings yet.</p>
                  ) : null}
                  <div className="flex flex-col divide-y divide-neutral-border">
                    {earningsHistory.map((entry) => {
                      const needsReview =
                        entry.status === "Paid" && !getFamilyReviewForBooking(entry.id)
                      return (
                        <div
                          key={entry.id}
                          className="flex flex-col gap-1.5 py-3.5 first:pt-0 last:pb-0"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-text-charcoal">
                                {entry.parentName}
                              </p>
                              <p className="text-xs text-text-muted">
                                {entry.date} · {entry.hours}h
                              </p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-sm font-semibold text-text-charcoal">
                                GHS {entry.amountGhs}
                              </p>
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
          </>
        )}
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
