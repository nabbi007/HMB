import { Badge } from "flowbite-react"
import { Link } from "react-router-dom"
import { CloseIcon } from "@/lib/icons"
import { availabilityBadgeTheme } from "./availability-badge-theme"
import type { Caregiver } from "@/lib/mock-data"

/** Shown when a map marker is tapped — a quick-glance summary without leaving the
 *  map. Tapping a caregiver in the list, by contrast, goes straight to their full
 *  profile (see CaregiverListItem). */
export function CaregiverQuickInfoBar({
  caregiver,
  onClose,
}: {
  caregiver: Caregiver
  onClose: () => void
}) {
  return (
    <div className="absolute right-4 bottom-[108px] left-4 z-20 rounded-card bg-background-white p-5 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16)] md:right-6 md:bottom-6 md:left-[520px]">
      <div className="flex items-start gap-3">
        <img
          src={caregiver.avatarUrl}
          alt={caregiver.name}
          className="size-11 shrink-0 rounded-full object-cover"
        />

        <div className="min-w-0 flex-1">
          <Link
            to={`/caregivers/${caregiver.id}`}
            className="truncate text-lg font-semibold text-text-charcoal hover:underline"
          >
            {caregiver.name}
          </Link>
          <div className="mt-0.5 flex items-center justify-between gap-2">
            <p className="min-w-0 truncate text-sm text-text-muted">
              {caregiver.role} · {caregiver.specialty}
            </p>
            <Badge
              className="shrink-0 rounded-[10px]"
              theme={availabilityBadgeTheme[caregiver.availability]}
            >
              {caregiver.availability}
            </Badge>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-neutral-surface hover:text-text-charcoal"
        >
          <CloseIcon className="size-4" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-neutral-border pt-4 sm:grid-cols-4">
        <Stat label="Rating" value={`★ ${caregiver.rating.toFixed(1)} (${caregiver.reviewCount})`} />
        <Stat label="Distance" value={`${caregiver.distanceKm} km`} />
        <Stat label="Rate" value={`GHS ${caregiver.priceGhsPerHour}/hr`} />
        <Stat label="Languages" value={caregiver.languages.join(", ")} />
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <p className="text-xs font-medium tracking-wide text-text-muted uppercase">{label}</p>
      <p className="truncate text-sm font-semibold text-text-charcoal">{value}</p>
    </div>
  )
}
