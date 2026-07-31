import { Avatar, Badge, Button } from "flowbite-react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { BackIcon, CheckCircleIcon, VerifiedIcon } from "@/lib/icons"
import { avatarSizeTheme } from "@/lib/avatar-theme"
import { withDark } from "@/lib/utils"
import { availabilityBadgeTheme } from "@/components/home/availability-badge-theme"
import { getCaregiver, type VerificationTier } from "@/lib/mock-data"
import { getCaregiverReviews } from "@/lib/reviews-data"
import { ReviewCard } from "@/components/reviews/ReviewCard"

// Button's "light" color ships its own `dark:bg-gray-800` classes. Its `theme` prop
// merges with those via twMerge rather than replacing them, so the override needs
// its own `dark:` twins (via withDark) to actually cancel them out.
const messageButtonTheme = {
  color: {
    light: withDark("border-neutral-border bg-background-white text-text-charcoal hover:bg-neutral-surface"),
  },
}

const tierMeta: Record<VerificationTier, { label: string; ring: string; text: string; bg: string }> = {
  green: { label: "Verified", ring: "ring-verify-green", text: "text-verify-green", bg: "bg-verify-green-bg" },
  gold: {
    label: "Premium Verified",
    ring: "ring-verify-gold",
    text: "text-verify-gold",
    bg: "bg-verify-gold-bg",
  },
}

export default function CaregiverProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const caregiver = id ? getCaregiver(id) : undefined

  if (!caregiver) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-lg font-semibold text-text-charcoal">Caregiver not found</p>
        <p className="text-sm text-text-muted">This profile may have been removed or the link is incorrect.</p>
        <Link to="/" className="text-sm font-medium text-brand-red hover:underline">
          Back to search
        </Link>
      </div>
    )
  }

  const tier = tierMeta[caregiver.verificationTier]
  const reviews = getCaregiverReviews(caregiver.id)

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
          <Avatar
            rounded
            size="md"
            img={caregiver.avatarUrl}
            alt={caregiver.name}
            theme={avatarSizeTheme("size-24")}
            className={`shrink-0 self-center rounded-full ring-4 ring-offset-2 ring-offset-background-white md:self-start ${tier.ring}`}
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-text-charcoal md:text-2xl">{caregiver.name}</h1>
              <span className={`flex items-center gap-1 rounded-[10px] px-2 py-0.5 text-xs font-medium ${tier.bg} ${tier.text}`}>
                <VerifiedIcon className="size-3.5" />
                {tier.label}
              </span>
            </div>
            <p className="mt-1 text-text-muted">
              {caregiver.role} · {caregiver.specialty}
            </p>
            <p className="mt-2 text-sm text-text-muted">
              ★ {caregiver.rating.toFixed(1)} ({caregiver.reviewCount} reviews) · {caregiver.distanceKm} km away ·{" "}
              {caregiver.languages.join(", ")}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button color="default" onClick={() => navigate(`/bookings/${caregiver.id}`)}>
                Book now
              </Button>
              <Button color="light" theme={messageButtonTheme} onClick={() => navigate(`/messages/${caregiver.id}`)}>
                Message
              </Button>
            </div>
          </div>

          <div className="flex shrink-0 flex-row items-center justify-between gap-3 md:flex-col md:items-end md:gap-2">
            <p className="text-2xl font-bold text-text-charcoal">GHS {caregiver.priceGhsPerHour}/hr</p>
            <Badge className="rounded-[10px]" theme={availabilityBadgeTheme[caregiver.availability]}>
              {caregiver.availability}
            </Badge>
          </div>
        </div>

        {/* Verification & certifications */}
        <section className="mt-6 rounded-card bg-background-white p-6 md:p-8">
          <h2 className="text-lg font-semibold text-text-charcoal">Verification &amp; certifications</h2>
          <p className="mt-1 text-sm text-text-muted">
            {caregiver.verificationTier === "gold"
              ? "This caregiver has completed enhanced verification, including specialty certifications beyond our standard requirements."
              : "This caregiver has completed HelloMama's standard verification requirements."}
          </p>
          <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {["ID Verified", "Background Check", ...caregiver.certifications]
              .filter((item, i, arr) => arr.indexOf(item) === i)
              .map((item) => (
                <li key={item} className="flex items-center gap-2 rounded-panel bg-neutral-surface px-4 py-3">
                  <CheckCircleIcon className={`size-5 shrink-0 ${tier.text}`} />
                  <span className="text-sm font-medium text-text-charcoal">{item}</span>
                </li>
              ))}
          </ul>
        </section>

        {/* About */}
        <section className="mt-6 rounded-card bg-background-white p-6 md:p-8">
          <h2 className="text-lg font-semibold text-text-charcoal">About</h2>
          <p className="mt-2 text-sm leading-relaxed text-text-muted">{caregiver.bio}</p>
        </section>

        {/* Reviews */}
        <section className="mt-6 rounded-card bg-background-white p-6 md:p-8">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-text-charcoal">Reviews</h2>
            <p className="text-sm text-text-muted">
              ★ {caregiver.rating.toFixed(1)} · {caregiver.reviewCount} reviews
            </p>
          </div>
          {reviews.length > 0 ? (
            <div className="mt-4 flex flex-col gap-3">
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
            <p className="mt-4 text-sm text-text-muted">No reviews yet.</p>
          )}
        </section>
      </div>
    </div>
  )
}
