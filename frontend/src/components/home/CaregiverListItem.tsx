import { Avatar, Badge } from "flowbite-react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import { avatarSizeTheme } from "@/lib/avatar-theme"
import { availabilityBadgeTheme } from "./availability-badge-theme"
import type { Caregiver } from "@/lib/mock-data"

// Verification tier (green/gold) is shown on the avatar ring — it's a trust signal
// about the caregiver, separate from availability. The badge shows availability
// status, so its color is keyed off that instead, not the tier.
const tierRing = {
  green: "ring-verify-green",
  gold: "ring-verify-gold",
} as const

export function CaregiverListItem({
  caregiver,
  onHover,
}: {
  caregiver: Caregiver
  onHover?: (id: string | null) => void
}) {
  return (
    <div
      onMouseEnter={() => onHover?.(caregiver.id)}
      onMouseLeave={() => onHover?.(null)}
      className="relative flex w-full items-center gap-3.5 rounded-2xl bg-neutral-surface p-4 transition-colors hover:bg-neutral-border/60"
    >
      <Avatar
        rounded
        size="md"
        img={caregiver.avatarUrl}
        alt={caregiver.name}
        theme={avatarSizeTheme("size-12")}
        className={cn(
          "shrink-0 rounded-full ring-3 ring-offset-2 ring-offset-background-white",
          tierRing[caregiver.verificationTier]
        )}
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          {/* `after:absolute after:inset-0` stretches this link's hit area over the
              whole row (per the "stretched link" accessible-card pattern), so the
              entire card is clickable without nesting a button/link around the
              badge, avatar, and other non-interactive content. */}
          <Link
            to={`/caregivers/${caregiver.id}`}
            className="truncate text-lg font-semibold text-text-charcoal after:absolute after:inset-0 hover:underline"
          >
            {caregiver.name}
          </Link>
          <Badge
            className="shrink-0 rounded-[10px]"
            theme={availabilityBadgeTheme[caregiver.availability]}
          >
            {caregiver.availability}
          </Badge>
        </div>
        <span className="text-sm text-text-muted">
          {caregiver.role} · {caregiver.specialty}
        </span>
      </div>
    </div>
  )
}
