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

// Cleared: notifications will come from the backend once built.
export const notifications: AppNotification[] = []
