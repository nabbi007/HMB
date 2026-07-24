import { Marker } from "react-map-gl/mapbox"

export function CurrentLocationMarker({ lng, lat }: { lng: number; lat: number }) {
  return (
    <Marker longitude={lng} latitude={lat} anchor="center">
      <span className="block size-[18px] rounded-full border-4 border-white bg-brand-red shadow-[0_2px_6px_0_rgba(0,0,0,0.25)]" />
    </Marker>
  )
}
