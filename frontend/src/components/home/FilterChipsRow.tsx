import { Button } from "flowbite-react"
import { withDark } from "@/lib/utils"
import { availabilityFilterLabel, roleFilters } from "./use-caregiver-filters"

// Button's "light" color ships its own `dark:bg-gray-800` classes. Its `theme` prop
// merges with those via twMerge rather than replacing them, so the override needs
// its own `dark:` twins (via withDark) to actually cancel them out.
const inactiveChipTheme = {
  color: { light: withDark("bg-neutral-surface text-text-charcoal hover:bg-neutral-border/60") },
}

export function FilterChipsRow({
  activeFilters,
  onToggle,
}: {
  activeFilters: Set<string>
  onToggle: (label: string) => void
}) {
  const chips = [availabilityFilterLabel, ...roleFilters.map((r) => r.label)]

  return (
    <div className="flex flex-wrap items-start gap-2">
      {chips.map((label) => {
        const active = activeFilters.has(label)
        return (
          <Button
            key={label}
            pill
            size="sm"
            color={active ? "default" : "light"}
            theme={active ? undefined : inactiveChipTheme}
            onClick={() => onToggle(label)}
            className="px-3.5 whitespace-nowrap"
          >
            {label}
          </Button>
        )
      })}
    </div>
  )
}
