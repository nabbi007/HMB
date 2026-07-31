import { useMemo, useState } from "react"
import { useThemeMode } from "flowbite-react"
import Map from "react-map-gl/mapbox"
import { CaregiverListItem } from "@/components/home/CaregiverListItem"
import { CaregiverMapMarker } from "@/components/home/CaregiverMapMarker"
import { CaregiverQuickInfoBar } from "@/components/home/CaregiverQuickInfoBar"
import { CurrentLocationMarker } from "@/components/home/CurrentLocationMarker"
import { MapTokenNotice } from "@/components/home/MapTokenNotice"
import { SearchBar } from "@/components/home/SearchBar"
import { useCaregiverFilters } from "@/components/home/use-caregiver-filters"
import { caregivers, type Caregiver } from "@/lib/mock-data"
import { ChevronDownIcon } from "@/lib/icons"
import { cn } from "@/lib/utils"

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined

export default function Home() {
  const { search, setSearch, activeFilters, toggleFilter, filtered } = useCaregiverFilters()
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [selectedCaregiver, setSelectedCaregiver] = useState<Caregiver | null>(null)
  const [sheetExpanded, setSheetExpanded] = useState(false)

  function handleMarkerSelect(caregiver: Caregiver) {
    setSelectedCaregiver(caregiver)
    setSheetExpanded(false)
  }
  const { computedMode } = useThemeMode()
  const mapStyle =
    computedMode === "dark" ? "mapbox://styles/mapbox/dark-v11" : "mapbox://styles/mapbox/light-v11"

  const center = useMemo(() => {
    const lng = caregivers.reduce((sum, c) => sum + c.lng, 0) / caregivers.length
    const lat = caregivers.reduce((sum, c) => sum + c.lat, 0) / caregivers.length
    return { lng, lat }
  }, [])

  return (
    <div className="flex h-full flex-col md:block">
      {/* Mobile: static search header above the map */}
      <div className="flex flex-col gap-4 border-b border-neutral-border bg-background-white px-5 py-4 md:hidden">
        <h1 className="sr-only">Find caregivers near you</h1>
        <SearchBar
          search={search}
          onSearchChange={setSearch}
          activeFilters={activeFilters}
          onToggleFilter={toggleFilter}
        />
      </div>

      {/* Map fills the rest on mobile, and the entire screen on desktop */}
      <div className="relative flex-1 md:absolute md:inset-0">
        {MAPBOX_TOKEN ? (
          <Map
            mapboxAccessToken={MAPBOX_TOKEN}
            initialViewState={{ longitude: center.lng, latitude: center.lat, zoom: 13.5 }}
            mapStyle={mapStyle}
            style={{ width: "100%", height: "100%" }}
          >
            <CurrentLocationMarker lng={center.lng} lat={center.lat} />
            {filtered.map((c) => (
              <CaregiverMapMarker
                key={c.id}
                caregiver={c}
                highlighted={hoveredId === c.id}
                onSelect={handleMarkerSelect}
              />
            ))}
          </Map>
        ) : (
          <MapTokenNotice />
        )}

        {/* Desktop: floating search + results panel over the map */}
        <div className="absolute top-6 left-12 hidden h-[calc(100%-48px)] w-[440px] flex-col gap-5 rounded-card bg-background-white p-7 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16)] md:flex">
          <SearchBar
            search={search}
            onSearchChange={setSearch}
            activeFilters={activeFilters}
            onToggleFilter={toggleFilter}
          />

          <p className="text-sm font-medium text-text-muted">
            {filtered.length} caregiver{filtered.length === 1 ? "" : "s"} near you
          </p>

          <div className="-mx-2 -mt-1 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-2">
            {filtered.map((c) => (
              <CaregiverListItem key={c.id} caregiver={c} onHover={setHoveredId} />
            ))}
            {filtered.length === 0 && (
              <p className="py-6 text-center text-sm text-text-muted">
                No caregivers match your filters.
              </p>
            )}
          </div>
        </div>

        {/* Desktop: quick-info bar for whichever caregiver's map marker was tapped */}
        {selectedCaregiver && (
          <CaregiverQuickInfoBar
            caregiver={selectedCaregiver}
            onClose={() => setSelectedCaregiver(null)}
          />
        )}

        {/* Mobile: bottom sheet with results — collapsed to a small peek by default
            so the map (and its markers) stay reachable underneath; tapping the
            handle expands it to browse the full list. */}
        <div
          className="absolute inset-x-0 bottom-0 z-20 flex flex-col gap-2 rounded-t-card bg-background-white px-5 pb-4 shadow-[0_-8px_24px_-8px_rgba(0,0,0,0.16)] md:hidden"
          style={{ maxHeight: sheetExpanded ? "65vh" : "92px" }}
        >
          <button
            type="button"
            onClick={() => setSheetExpanded((expanded) => !expanded)}
            aria-expanded={sheetExpanded}
            className="flex w-full shrink-0 flex-col items-center gap-2 py-2"
          >
            <span className="h-1 w-10 rounded-full bg-neutral-border" />
            <span className="flex w-full items-center justify-between">
              <span className="text-sm font-medium text-text-muted">
                {filtered.length} caregiver{filtered.length === 1 ? "" : "s"} near you
              </span>
              <ChevronDownIcon
                className={cn(
                  "size-4 text-text-muted transition-transform",
                  sheetExpanded && "rotate-180"
                )}
              />
            </span>
          </button>

          {sheetExpanded ? (
            <div className="-mx-2 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-2">
              {filtered.map((c) => (
                <CaregiverListItem key={c.id} caregiver={c} />
              ))}
              {filtered.length === 0 && (
                <p className="py-6 text-center text-sm text-text-muted">
                  No caregivers match your filters.
                </p>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
