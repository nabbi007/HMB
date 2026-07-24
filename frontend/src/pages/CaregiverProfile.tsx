import { useParams } from "react-router-dom"
import { PagePlaceholder } from "@/components/layout/PagePlaceholder"
import { getCaregiver } from "@/lib/mock-data"

export default function CaregiverProfile() {
  const { id } = useParams()
  const caregiver = id ? getCaregiver(id) : undefined

  return (
    <PagePlaceholder
      title={caregiver ? caregiver.name : "Caregiver profile"}
      description="Full caregiver profile with verification detail, certifications, and reviews lands here next."
    />
  )
}
