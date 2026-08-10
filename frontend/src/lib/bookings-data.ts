export type BookingStatus = "Active" | "Upcoming" | "Completed" | "Cancelled"

export interface Booking {
  id: string
  caregiverId: string
  status: BookingStatus
  date: string
  time: string
  durationHours: number
  totalPriceGhs: number
  notes?: string
}

// Cleared: bookings now come from the backend bookings endpoints (HMB-40+).
export const bookings: Booking[] = []

export function getBooking(id: string) {
  return bookings.find((b) => b.id === id)
}
