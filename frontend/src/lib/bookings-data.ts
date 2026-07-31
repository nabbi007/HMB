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

export const bookings: Booking[] = [
  {
    id: "bk-1041",
    caregiverId: "zainab-iddrisu",
    status: "Active",
    date: "Today, 24 Jul",
    time: "8:00 PM – 6:00 AM",
    durationHours: 10,
    totalPriceGhs: 950,
    notes: "Overnight care — baby wakes around 2am for feeding.",
  },
  {
    id: "bk-1040",
    caregiverId: "ama-boateng",
    status: "Upcoming",
    date: "Sat, 26 Jul",
    time: "9:00 AM – 5:00 PM",
    durationHours: 8,
    totalPriceGhs: 680,
  },
  {
    id: "bk-1039",
    caregiverId: "abena-asante",
    status: "Upcoming",
    date: "Mon, 28 Jul",
    time: "1:00 PM – 4:00 PM",
    durationHours: 3,
    totalPriceGhs: 240,
  },
  {
    id: "bk-1032",
    caregiverId: "efua-mensah",
    status: "Completed",
    date: "Wed, 16 Jul",
    time: "10:00 AM – 2:00 PM",
    durationHours: 4,
    totalPriceGhs: 180,
  },
  {
    id: "bk-1028",
    caregiverId: "grace-tetteh",
    status: "Completed",
    date: "Fri, 11 Jul",
    time: "9:00 PM – 7:00 AM",
    durationHours: 10,
    totalPriceGhs: 950,
  },
  {
    id: "bk-1019",
    caregiverId: "linda-owusu",
    status: "Cancelled",
    date: "Sun, 6 Jul",
    time: "9:00 AM – 1:00 PM",
    durationHours: 4,
    totalPriceGhs: 280,
  },
]

export function getBooking(id: string) {
  return bookings.find((b) => b.id === id)
}
