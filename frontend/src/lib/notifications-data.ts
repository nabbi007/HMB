export type NotificationType = "booking" | "message" | "verification"

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  body: string
  timeAgo: string
  read: boolean
  to: string
}

export const notifications: AppNotification[] = [
  {
    id: "n1",
    type: "booking",
    title: "Shift starting soon",
    body: "Zainab Iddrisu checks in for tonight's overnight shift at 8:00 PM.",
    timeAgo: "12m ago",
    read: false,
    to: "/bookings/zainab-iddrisu/shift",
  },
  {
    id: "n2",
    type: "message",
    title: "New message from Ama Boateng",
    body: "Perfect, see you then 😊",
    timeAgo: "1h ago",
    read: false,
    to: "/messages/ama-boateng",
  },
  {
    id: "n3",
    type: "verification",
    title: "Background check renewed",
    body: "Efua Mensah completed her annual re-verification.",
    timeAgo: "Yesterday",
    read: true,
    to: "/caregivers/efua-mensah",
  },
  {
    id: "n4",
    type: "booking",
    title: "Upcoming booking",
    body: "Abena Asante is booked for Mon, 28 Jul, 1:00 PM – 4:00 PM.",
    timeAgo: "2 days ago",
    read: true,
    to: "/bookings/abena-asante/shift",
  },
  {
    id: "n5",
    type: "booking",
    title: "Booking completed",
    body: "Your shift with Grace Tetteh has ended — leave a review?",
    timeAgo: "3 days ago",
    read: true,
    to: "/caregivers/grace-tetteh",
  },
]
