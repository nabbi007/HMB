import { withDark } from "@/lib/utils"
import type { AvailabilityStatus } from "@/lib/mock-data"

// Badge's default color variants ship their own `hover:bg-*`/`dark:*` classes —
// a leftover "is this clickable?" affordance that doesn't belong on a status label.
// Its `theme` prop merges with those via twMerge rather than replacing them, so the
// override needs to name every state (incl. hover) and its own `dark:` twins (via
// withDark) to actually cancel them out.
export const availabilityBadgeTheme: Record<AvailabilityStatus, object> = {
  Available: {
    root: { color: { info: withDark("bg-verify-green-bg text-verify-green hover:bg-verify-green-bg") } },
  },
  Today: {
    root: { color: { info: withDark("bg-verify-gold-bg text-verify-gold hover:bg-verify-gold-bg") } },
  },
  "This week": {
    root: { color: { info: withDark("bg-neutral-surface text-text-muted hover:bg-neutral-surface") } },
  },
}
