import { useMemo, useState } from "react"
import { caregivers } from "@/lib/mock-data"

export const availabilityFilterLabel = "Available"

export const roleFilters = [
  { label: "Nurse", value: "Nurse" },
  { label: "Night nurse", value: "Night Nurse" },
  { label: "Babysitter", value: "Babysitter" },
  { label: "Caretaker", value: "Caretaker" },
] as const

export function useCaregiverFilters() {
  const [search, setSearch] = useState("")
  const [activeFilters, setActiveFilters] = useState<Set<string>>(
    () => new Set([availabilityFilterLabel])
  )

  function toggleFilter(label: string) {
    setActiveFilters((prev) => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    const wantsAvailableNow = activeFilters.has(availabilityFilterLabel)
    const wantedRoles: string[] = roleFilters
      .filter((r) => activeFilters.has(r.label))
      .map((r) => r.value)

    return caregivers.filter((c) => {
      if (query) {
        const haystack = `${c.name} ${c.role} ${c.specialty}`.toLowerCase()
        if (!haystack.includes(query)) return false
      }
      if (wantsAvailableNow && c.availability !== "Available") return false
      if (wantedRoles.length > 0 && !wantedRoles.includes(c.role)) return false
      return true
    })
  }, [search, activeFilters])

  return { search, setSearch, activeFilters, toggleFilter, filtered }
}
