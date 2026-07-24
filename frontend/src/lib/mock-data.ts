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
  /** Mock photo (pravatar.cc) — swap for real profile photos once caregivers upload their own. */
  avatarUrl: string
}

// Roughly centered on Osu, Accra
export const caregivers: Caregiver[] = [
  {
    id: "ama-boateng",
    name: "Ama Boateng",
    role: "Nurse",
    specialty: "Postpartum",
    rating: 4.9,
    reviewCount: 127,
    distanceKm: 1.2,
    priceGhsPerHour: 85,
    availability: "Available",
    verificationTier: "green",
    languages: ["English", "Twi"],
    bio: "Registered nurse with 6 years in postpartum and newborn care. Calm, detail-oriented, and great with first-time parents.",
    certifications: ["RN License", "Newborn CPR", "Background Check"],
    lng: -0.1769,
    lat: 5.5556,
    avatarUrl: "https://i.pravatar.cc/150?img=47",
  },
  {
    id: "zainab-iddrisu",
    name: "Zainab Iddrisu",
    role: "Night Nurse",
    specialty: "Overnight",
    rating: 4.8,
    reviewCount: 94,
    distanceKm: 2.4,
    priceGhsPerHour: 95,
    availability: "Today",
    verificationTier: "gold",
    languages: ["English", "Hausa", "Dagbani"],
    bio: "Specializes in overnight newborn care so parents can sleep. 8+ years of experience across NICU step-down and home care.",
    certifications: ["RN License", "NICU Certified", "Background Check"],
    lng: -0.168,
    lat: 5.5605,
    avatarUrl: "https://i.pravatar.cc/150?img=44",
  },
  {
    id: "efua-mensah",
    name: "Efua Mensah",
    role: "Babysitter",
    specialty: "Daytime",
    rating: 4.7,
    reviewCount: 63,
    distanceKm: 0.8,
    priceGhsPerHour: 45,
    availability: "Available",
    verificationTier: "green",
    languages: ["English", "Ga"],
    bio: "Warm, energetic daytime babysitter for infants and toddlers. Loves storytime and structured play.",
    certifications: ["First Aid", "Background Check"],
    lng: -0.1745,
    lat: 5.5515,
    avatarUrl: "https://i.pravatar.cc/150?img=45",
  },
  {
    id: "linda-owusu",
    name: "Linda Owusu",
    role: "Caretaker",
    specialty: "Special needs",
    rating: 4.9,
    reviewCount: 45,
    distanceKm: 3.1,
    priceGhsPerHour: 70,
    availability: "This week",
    verificationTier: "green",
    languages: ["English", "Twi"],
    bio: "Trained in special-needs child care with a gentle, patient approach. Works closely with parents on routines.",
    certifications: ["Special Needs Cert.", "Background Check"],
    lng: -0.163,
    lat: 5.549,
    avatarUrl: "https://i.pravatar.cc/150?img=48",
  },
  {
    id: "abena-asante",
    name: "Abena Asante",
    role: "Nurse",
    specialty: "Lactation support",
    rating: 4.6,
    reviewCount: 31,
    distanceKm: 2.0,
    priceGhsPerHour: 80,
    availability: "Available",
    verificationTier: "gold",
    languages: ["English", "Twi", "French"],
    bio: "Certified lactation consultant and postpartum nurse helping new mothers with feeding and recovery.",
    certifications: ["RN License", "IBCLC", "Background Check"],
    lng: -0.181,
    lat: 5.558,
    avatarUrl: "https://i.pravatar.cc/150?img=49",
  },
  {
    id: "grace-tetteh",
    name: "Grace Tetteh",
    role: "Night Nurse",
    specialty: "Twins & multiples",
    rating: 4.95,
    reviewCount: 58,
    distanceKm: 4.2,
    priceGhsPerHour: 95,
    availability: "Today",
    verificationTier: "green",
    languages: ["English", "Ga", "Twi"],
    bio: "Experienced with twins and multiples overnight care. Detail-oriented feeding and sleep-schedule tracking.",
    certifications: ["RN License", "Newborn CPR", "Background Check"],
    lng: -0.171,
    lat: 5.563,
    avatarUrl: "https://i.pravatar.cc/150?img=5",
  },
]

export function getCaregiver(id: string) {
  return caregivers.find((c) => c.id === id)
}
