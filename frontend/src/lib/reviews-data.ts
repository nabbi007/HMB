export interface CaregiverReview {
  id: string
  bookingId: string
  caregiverId: string
  authorName: string
  authorAvatarUrl: string
  rating: number
  comment: string
  date: string
}

// Parents reviewing caregivers. Note bk-1032 (efua-mensah) is deliberately left
// unreviewed so the "Leave a review" prompt has something to demonstrate.
export const caregiverReviews: CaregiverReview[] = [
  {
    id: "cr1",
    bookingId: "bk-0912",
    caregiverId: "ama-boateng",
    authorName: "Kukua Amissah",
    authorAvatarUrl: "https://i.pravatar.cc/150?img=23",
    rating: 5,
    comment: "Ama was incredible during our first week home from the hospital. Calm, patient, and taught us so much about newborn feeding.",
    date: "12 Jul 2026",
  },
  {
    id: "cr2",
    bookingId: "bk-0887",
    caregiverId: "ama-boateng",
    authorName: "Naa Dedei",
    authorAvatarUrl: "https://i.pravatar.cc/150?img=21",
    rating: 5,
    comment: "Always on time and genuinely warm with the baby. Highly recommend for postpartum support.",
    date: "2 Jul 2026",
  },
  {
    id: "cr3",
    bookingId: "bk-0850",
    caregiverId: "ama-boateng",
    authorName: "Yaa Asantewaa",
    authorAvatarUrl: "https://i.pravatar.cc/150?img=20",
    rating: 4,
    comment: "Great with our toddler. Would have liked a bit more communication mid-shift, but overall a good experience.",
    date: "20 Jun 2026",
  },
  {
    id: "cr4",
    bookingId: "bk-0900",
    caregiverId: "zainab-iddrisu",
    authorName: "Adwoa Darko",
    authorAvatarUrl: "https://i.pravatar.cc/150?img=32",
    rating: 5,
    comment: "Zainab handled our twins' overnight feeds like a pro. We finally got real sleep for the first time in weeks.",
    date: "15 Jul 2026",
  },
  {
    id: "cr5",
    bookingId: "bk-0861",
    caregiverId: "zainab-iddrisu",
    authorName: "Naa Dedei",
    authorAvatarUrl: "https://i.pravatar.cc/150?img=21",
    rating: 5,
    comment: "Meticulous with the sleep-schedule notes she left each morning. Exactly what we needed.",
    date: "22 Jun 2026",
  },
  {
    id: "cr6",
    bookingId: "bk-1028",
    caregiverId: "grace-tetteh",
    authorName: "Kukua Amissah",
    authorAvatarUrl: "https://i.pravatar.cc/150?img=23",
    rating: 5,
    comment: "Grace is a natural with multiples — kept both babies on the same schedule without missing a beat.",
    date: "12 Jul 2026",
  },
  {
    id: "cr7",
    bookingId: "bk-0790",
    caregiverId: "linda-owusu",
    authorName: "Yaa Asantewaa",
    authorAvatarUrl: "https://i.pravatar.cc/150?img=20",
    rating: 5,
    comment: "Linda's patience with our son's routine was exactly what we hoped for. She really gets special needs care.",
    date: "5 Jun 2026",
  },
  {
    id: "cr8",
    bookingId: "bk-0770",
    caregiverId: "abena-asante",
    authorName: "Adwoa Darko",
    authorAvatarUrl: "https://i.pravatar.cc/150?img=32",
    rating: 4,
    comment: "Helped us finally get latching sorted out. Wish sessions were a little longer.",
    date: "28 May 2026",
  },
]

export function getCaregiverReviews(caregiverId: string) {
  return caregiverReviews.filter((review) => review.caregiverId === caregiverId)
}

export function hasCaregiverReviewForBooking(bookingId: string) {
  return caregiverReviews.some((review) => review.bookingId === bookingId)
}

export interface FamilyReview {
  id: string
  bookingId: string
  familyName: string
  rating: number
  comment: string
  date: string
}

// Caregivers reviewing the families they've cared for. Bookings e2 and e4 are
// deliberately left unreviewed so the "Rate this family" prompt has something
// to demonstrate; e1 is still Pending and isn't reviewable yet.
export const familyReviews: FamilyReview[] = [
  {
    id: "fr1",
    bookingId: "e3",
    familyName: "Adwoa Darko",
    rating: 5,
    comment: "Lovely family, clear instructions, and flexible when the shift ran a little long.",
    date: "14 Jul 2026",
  },
]

export function getFamilyReviewForBooking(bookingId: string) {
  return familyReviews.find((review) => review.bookingId === bookingId)
}
