export interface BookingRequest {
  id: string
  parentName: string
  parentAvatarUrl: string
  date: string
  time: string
  durationHours: number
  offerGhs: number
  notes: string
}

// Cleared: requests now come from the backend bookings endpoints (HMB-40+).
export const incomingRequests: BookingRequest[] = []

export interface EarningsEntry {
  id: string
  parentName: string
  parentAvatarUrl: string
  date: string
  hours: number
  amountGhs: number
  status: "Paid" | "Pending"
}

export const earningsHistory: EarningsEntry[] = []

export const earningsSummary = {
  thisWeekGhs: 0,
  thisMonthGhs: 0,
  rating: 0,
  completedBookings: 0,
}
