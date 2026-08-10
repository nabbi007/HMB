export type VerificationTier = "green" | "gold"

export type AvailabilityStatus = "Available" | "Today" | "This week"

export interface Caregiver {
  id: string
  name: string
  role: string
  specialty: string
  rating: number
  reviewCount: number
  distanceKm: number
  priceGhsPerHour: number
  availability: AvailabilityStatus
  verificationTier: VerificationTier
  languages: string[]
  bio: string
  certifications: string[]
  lng: number
  lat: number
  avatarUrl: string
}

// Cleared: caregivers now come from the backend search endpoint (HMB-31).
export const caregivers: Caregiver[] = []

export function getCaregiver(id: string) {
  return caregivers.find((c) => c.id === id)
}
