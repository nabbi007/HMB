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

// Cleared: reviews now come from the backend reviews endpoints (HMB-60+).
export const caregiverReviews: CaregiverReview[] = []

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

export const familyReviews: FamilyReview[] = []

export function getFamilyReviewForBooking(bookingId: string) {
  return familyReviews.find((review) => review.bookingId === bookingId)
}
