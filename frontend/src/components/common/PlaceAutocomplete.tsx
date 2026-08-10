import { useEffect, useRef, useState } from "react"

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined

export interface PlaceSelection {
  name: string
  lng: number
  lat: number
}

interface MapboxFeature {
  id: string
  place_name: string
  center: [number, number]
}

/**
 * Ghana place search backed by the Mapbox Geocoding API. Typing shows real
 * localities (Dzorwulu, Achimota, Kasoa, Tema…); selecting one returns its
 * name + coordinates so the caller can store and map the location.
 */
export function PlaceAutocomplete({
  id,
  value,
  onChange,
  onSelect,
  placeholder,
}: {
  id?: string
  value: string
  onChange: (text: string) => void
  onSelect: (place: PlaceSelection) => void
  placeholder?: string
}) {
  const [results, setResults] = useState<MapboxFeature[]>([])
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)
  const skipNext = useRef(false)

  useEffect(() => {
    // Don't re-search the text we just injected from a selection.
    if (skipNext.current) {
      skipNext.current = false
      return
    }
    const q = value.trim()
    if (!TOKEN || q.length < 2) {
      setResults([])
      return
    }
    const handle = setTimeout(async () => {
      try {
        const url =
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json` +
          `?access_token=${TOKEN}&country=gh&autocomplete=true&limit=5` +
          `&types=place,locality,neighborhood,address`
        const res = await fetch(url)
        const data = (await res.json()) as { features?: MapboxFeature[] }
        setResults(data.features ?? [])
        setOpen(true)
      } catch {
        setResults([])
      }
    }, 300)
    return () => clearTimeout(handle)
  }, [value])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [])

  function choose(f: MapboxFeature) {
    skipNext.current = true
    onChange(f.place_name)
    onSelect({ name: f.place_name, lng: f.center[0], lat: f.center[1] })
    setResults([])
    setOpen(false)
  }

  return (
    <div ref={boxRef} className="relative">
      <input
        id={id}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        className="w-full rounded-panel border border-neutral-border bg-neutral-surface px-3 py-2.5 text-sm text-text-charcoal placeholder:text-text-muted focus:border-brand-red focus:ring-brand-red focus:outline-none"
      />
      {open && results.length > 0 ? (
        <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-panel border border-neutral-border bg-background-white shadow-lg">
          {results.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => choose(f)}
                className="block w-full px-3 py-2 text-left text-sm text-text-charcoal hover:bg-neutral-surface"
              >
                {f.place_name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {!TOKEN ? (
        <p className="mt-1 text-xs text-text-muted">Set VITE_MAPBOX_TOKEN to enable place search.</p>
      ) : null}
    </div>
  )
}
