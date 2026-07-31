import { useEffect, useRef, useState } from "react"
import { FilterIcon, SearchIcon } from "@/lib/icons"
import { cn } from "@/lib/utils"
import { FilterChipsRow } from "./FilterChipsRow"

export function SearchBar({
  search,
  onSearchChange,
  activeFilters,
  onToggleFilter,
}: {
  search: string
  onSearchChange: (value: string) => void
  activeFilters: Set<string>
  onToggleFilter: (label: string) => void
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2 rounded-panel bg-neutral-surface py-1 pr-1 pl-4.5">
        <SearchIcon className="size-4 shrink-0 text-text-muted" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search near me — Osu, Accra"
          className="w-full bg-transparent py-2 text-sm text-text-charcoal placeholder:text-text-muted focus:outline-none"
        />
        <span className="h-6 w-px shrink-0 bg-neutral-border" />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label="Filters"
          aria-expanded={open}
          className={cn(
            "relative flex size-8 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-neutral-border/60 hover:text-text-charcoal",
            open && "bg-neutral-border/60 text-text-charcoal"
          )}
        >
          <FilterIcon className="size-5" />
          {activeFilters.size > 0 ? (
            <span className="absolute top-1 right-1 size-1.5 rounded-full bg-brand-red" />
          ) : null}
        </button>
      </div>

      {open ? (
        <div className="absolute top-[calc(100%+8px)] right-0 z-30 w-[min(320px,calc(100vw-2.5rem))] rounded-panel border border-neutral-border bg-background-white p-4 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16)]">
          <p className="mb-3 text-sm font-semibold text-text-charcoal">Filters</p>
          <FilterChipsRow activeFilters={activeFilters} onToggle={onToggleFilter} />
        </div>
      ) : null}
    </div>
  )
}
