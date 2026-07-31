import { Marker } from "react-map-gl/mapbox"
import { cn } from "@/lib/utils"
import type { Caregiver } from "@/lib/mock-data"

const tierBorder = {
  green: "border-verify-green",
  gold: "border-verify-gold",
} as const

export function CaregiverMapMarker({
  caregiver,
  highlighted,
  onSelect,
}: {
  caregiver: Caregiver
  highlighted: boolean
  onSelect: (caregiver: Caregiver) => void
}) {
  return (
    <Marker longitude={caregiver.lng} latitude={caregiver.lat} anchor="center">
      <button
        type="button"
        onClick={() => onSelect(caregiver)}
        className={cn(
          "relative flex size-10 items-center justify-center rounded-full border-3 bg-background-white shadow-[0_4px_10px_0_rgba(0,0,0,0.18)] transition-transform",
          tierBorder[caregiver.verificationTier],
          highlighted && "scale-110"
        )}
      >
        <img
          src={caregiver.avatarUrl}
          alt={caregiver.name}
          className="size-8 rounded-full object-cover"
        />
      </button>
    </Marker>
  )
}
