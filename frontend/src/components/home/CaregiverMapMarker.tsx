import { Marker } from "react-map-gl/mapbox"
import { useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import type { Caregiver } from "@/lib/mock-data"

const tierBorder = {
  green: "border-verify-green",
  gold: "border-verify-gold",
} as const

export function CaregiverMapMarker({
  caregiver,
  highlighted,
}: {
  caregiver: Caregiver
  highlighted: boolean
}) {
  const navigate = useNavigate()

  return (
    <Marker longitude={caregiver.lng} latitude={caregiver.lat} anchor="center">
      <button
        type="button"
        onClick={() => navigate(`/caregivers/${caregiver.id}`)}
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
        <span className="absolute -right-1 -bottom-1 rounded-full bg-brand-red px-1 py-0.5 text-[9px] font-bold text-white ring-2 ring-background-white">
          {caregiver.priceGhsPerHour}
        </span>
      </button>
    </Marker>
  )
}
