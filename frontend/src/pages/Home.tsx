import { useEffect, useMemo, useState } from "react"
import { useThemeMode } from "flowbite-react"
import Map, { Marker } from "react-map-gl/mapbox"
import { Link, useNavigate } from "react-router-dom"
import { CurrentLocationMarker } from "@/components/home/CurrentLocationMarker"
import { MapTokenNotice } from "@/components/home/MapTokenNotice"
import { ChevronDownIcon, SearchIcon, StarIcon } from "@/lib/icons"
import { api, mediaUrl } from "@/lib/api"
import { useRole } from "@/lib/role-context"
import { cn } from "@/lib/utils"

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined
const ACCRA = { lng: -0.1869, lat: 5.6037 }

interface NurseResult {
  id: string
  name: string
  community: string | null
  languages: string[]
  is_available: boolean
  rating: number | string
  review_count: number
  distance_km: number
  lat: number
  lng: number
  profile_photo_url: string | null
}

function initials(name: string): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "?"
  )
}

function Avatar({ nurse, size }: { nurse: NurseResult; size: string }) {
  const photo = mediaUrl(nurse.profile_photo_url)
  return photo ? (
    <img src={photo} alt={nurse.name} className={cn("rounded-full object-cover", size)} />
  ) : (
    <span
      className={cn(
        "flex items-center justify-center rounded-full bg-brand-red font-bold text-white",
        size
      )}
    >
      {initials(nurse.name)}
    </span>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const { token } = useRole()
  const { computedMode } = useThemeMode()
  const mapStyle =
    computedMode === "dark" ? "mapbox://styles/mapbox/dark-v11" : "mapbox://styles/mapbox/light-v11"

  const [center, setCenter] = useState(ACCRA)
  const [located, setLocated] = useState(false)
  const [nurses, setNurses] = useState<NurseResult[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [sheetExpanded, setSheetExpanded] = useState(false)

  // Center the map on the mother's saved location (else central Accra).
  useEffect(() => {
    if (!token) {
      setLocated(true)
      return
    }
    api<{ latitude: number | string | null; longitude: number | string | null }>(
      "/api/v1/mothers/me",
      { token }
    )
      .then((p) => {
        if (p.latitude != null && p.longitude != null) {
          setCenter({ lng: Number(p.longitude), lat: Number(p.latitude) })
        }
      })
      .catch(() => {})
      .finally(() => setLocated(true))
  }, [token])

  // Fetch verified nurses near the center.
  useEffect(() => {
    if (!located || !token) return
    setLoading(true)
    api<NurseResult[]>(
      `/api/v1/nurses/search?lat=${center.lat}&lng=${center.lng}&radius_km=50`,
      { token }
    )
      .then(setNurses)
      .catch(() => setNurses([]))
      .finally(() => setLoading(false))
  }, [located, token, center.lat, center.lng])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return nurses.filter((n) => {
      if (q) {
        const hay = `${n.name} ${n.community ?? ""} ${n.languages.join(" ")}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [nurses, search])

  const searchAndFilters = (
    <div className="flex items-center gap-2 rounded-panel border border-neutral-border bg-neutral-surface px-3 py-2.5">
      <SearchIcon className="size-4 shrink-0 text-text-muted" />
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search name or area…"
        className="w-full bg-transparent text-sm text-text-charcoal placeholder:text-text-muted focus:outline-none"
      />
    </div>
  )

  const resultsList = (
    <>
      <p className="text-sm font-medium text-text-muted">
        {loading
          ? "Finding caregivers near you…"
          : `${filtered.length} caregiver${filtered.length === 1 ? "" : "s"} near you`}
      </p>
      <div className="-mx-2 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-2">
        {filtered.map((n) => (
          <Link
            key={n.id}
            to={`/caregivers/${n.id}`}
            onMouseEnter={() => setHoveredId(n.id)}
            onMouseLeave={() => setHoveredId(null)}
            className="flex items-center gap-3.5 rounded-2xl bg-neutral-surface p-4 transition-colors hover:bg-neutral-border/60"
          >
            <span className="shrink-0 ring-3 ring-verify-green ring-offset-2 ring-offset-background-white rounded-full">
              <Avatar nurse={n} size="size-12" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <p className="truncate text-lg font-semibold text-text-charcoal">{n.name}</p>
                {!n.is_available ? (
                  <span className="shrink-0 rounded-[8px] bg-verify-gold-bg px-1.5 py-0.5 text-[10px] font-medium text-verify-gold">
                    Unavailable
                  </span>
                ) : null}
              </div>
              <p className="truncate text-sm text-text-muted">
                Caregiver{n.community ? ` · ${n.community}` : ""}
              </p>
              <p className="flex items-center gap-1 text-xs text-text-muted">
                <StarIcon className="size-3.5 text-verify-gold" />
                {Number(n.rating) > 0 ? Number(n.rating).toFixed(1) : "New"} ({n.review_count}) ·{" "}
                {n.distance_km} km
              </p>
            </div>
          </Link>
        ))}
        {!loading && filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-text-muted">
            No verified caregivers found nearby.
          </p>
        ) : null}
      </div>
    </>
  )

  return (
    <div className="flex h-full flex-col md:block">
      {/* Mobile: search header above the map */}
      <div className="flex flex-col gap-3 border-b border-neutral-border bg-background-white px-5 py-4 md:hidden">
        <h1 className="sr-only">Find caregivers near you</h1>
        {searchAndFilters}
      </div>

      <div className="relative flex-1 md:absolute md:inset-0">
        {!located ? (
          <div className="flex h-full items-center justify-center text-sm text-text-muted">
            Loading map…
          </div>
        ) : MAPBOX_TOKEN ? (
          <Map
            mapboxAccessToken={MAPBOX_TOKEN}
            initialViewState={{ longitude: center.lng, latitude: center.lat, zoom: 12.5 }}
            mapStyle={mapStyle}
            style={{ width: "100%", height: "100%" }}
          >
            <CurrentLocationMarker lng={center.lng} lat={center.lat} />
            {filtered.map((n) => (
              <Marker key={n.id} longitude={n.lng} latitude={n.lat} anchor="center">
                <button
                  type="button"
                  onClick={() => navigate(`/caregivers/${n.id}`)}
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full border-3 border-verify-green bg-background-white shadow-[0_4px_10px_0_rgba(0,0,0,0.18)] transition-transform",
                    hoveredId === n.id && "scale-110"
                  )}
                >
                  <Avatar nurse={n} size="size-8 text-xs" />
                </button>
              </Marker>
            ))}
          </Map>
        ) : (
          <MapTokenNotice />
        )}

        {/* Desktop: floating panel */}
        <div className="absolute top-6 left-12 hidden h-[calc(100%-48px)] w-[440px] flex-col gap-4 rounded-card bg-background-white p-7 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16)] md:flex">
          {searchAndFilters}
          {resultsList}
        </div>

        {/* Mobile: bottom sheet */}
        <div
          className="absolute inset-x-0 bottom-0 z-20 flex flex-col gap-2 rounded-t-card bg-background-white px-5 pb-4 shadow-[0_-8px_24px_-8px_rgba(0,0,0,0.16)] md:hidden"
          style={{ maxHeight: sheetExpanded ? "65vh" : "92px" }}
        >
          <button
            type="button"
            onClick={() => setSheetExpanded((v) => !v)}
            aria-expanded={sheetExpanded}
            className="flex w-full shrink-0 flex-col items-center gap-2 py-2"
          >
            <span className="h-1 w-10 rounded-full bg-neutral-border" />
            <span className="flex w-full items-center justify-between">
              <span className="text-sm font-medium text-text-muted">
                {loading ? "Finding…" : `${filtered.length} near you`}
              </span>
              <ChevronDownIcon
                className={cn(
                  "size-4 text-text-muted transition-transform",
                  sheetExpanded && "rotate-180"
                )}
              />
            </span>
          </button>
          {sheetExpanded ? <div className="flex min-h-0 flex-1 flex-col gap-3">{resultsList}</div> : null}
        </div>
      </div>
    </div>
  )
}

