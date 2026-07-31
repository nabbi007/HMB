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

export const incomingRequests: BookingRequest[] = [
  {
    id: "req-1",
    parentName: "Adwoa Darko",
    parentAvatarUrl: "https://i.pravatar.cc/150?img=32",
    date: "Fri, 1 Aug",
    time: "9:00 PM – 6:00 AM",
    durationHours: 9,
    offerGhs: 855,
    notes: "First-time overnight booking. Baby is 6 weeks old, feeds every 3 hours.",
  },
  {
    id: "req-2",
    parentName: "Yaa Asantewaa",
    parentAvatarUrl: "https://i.pravatar.cc/150?img=20",
    date: "Sun, 3 Aug",
    time: "8:00 AM – 12:00 PM",
    durationHours: 4,
    offerGhs: 380,
    notes: "Recurring weekend booking if it goes well — toddler, very active.",
  },
  {
    id: "req-3",
    parentName: "Naa Dedei",
    parentAvatarUrl: "https://i.pravatar.cc/150?img=21",
    date: "Tue, 5 Aug",
    time: "6:00 PM – 11:00 PM",
    durationHours: 5,
    offerGhs: 475,
    notes: "Evening care while parents attend an event.",
  },
]

export interface EarningsEntry {
  id: string
  parentName: string
  parentAvatarUrl: string
  date: string
  hours: number
  amountGhs: number
  status: "Paid" | "Pending"
}

export const earningsHistory: EarningsEntry[] = [
  {
    id: "e1",
    parentName: "Adwoa Darko",
    parentAvatarUrl: "https://i.pravatar.cc/150?img=32",
    date: "Today, 24 Jul",
    hours: 10,
    amountGhs: 950,
    status: "Pending",
  },
  {
    id: "e2",
    parentName: "Kukua Amissah",
    parentAvatarUrl: "https://i.pravatar.cc/150?img=23",
    date: "Fri, 18 Jul",
    hours: 9,
    amountGhs: 855,
    status: "Paid",
  },
  {
    id: "e3",
    parentName: "Adwoa Darko",
    parentAvatarUrl: "https://i.pravatar.cc/150?img=32",
    date: "Mon, 14 Jul",
    hours: 10,
    amountGhs: 950,
    status: "Paid",
  },
  {
    id: "e4",
    parentName: "Naa Dedei",
    parentAvatarUrl: "https://i.pravatar.cc/150?img=21",
    date: "Wed, 9 Jul",
    hours: 5,
    amountGhs: 475,
    status: "Paid",
  },
]

export const earningsSummary = {
  thisWeekGhs: 1900,
  thisMonthGhs: 6840,
  rating: 4.8,
  completedBookings: 62,
}
