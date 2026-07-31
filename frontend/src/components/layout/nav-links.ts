import { CalendarIcon, HomeIcon, MessageIcon } from "@/lib/icons"
import type { Role } from "@/lib/role-context"
import type { ComponentType, SVGProps } from "react"

export interface NavLinkItem {
  to: string
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  end: boolean
  badge?: number
}

// "Home" points somewhere different depending on who's using the app — the
// parent-facing map search, or the caregiver's own dashboard. Caregivers don't
// get a separate "Bookings" tab since the dashboard's Requests/Earnings tabs
// already cover that ground.
export function getNavLinks(role: Role): NavLinkItem[] {
  if (role === "caregiver") {
    return [
      { to: "/dashboard", label: "Home", icon: HomeIcon, end: true },
      { to: "/messages", label: "Messages", icon: MessageIcon, end: false, badge: 2 },
    ]
  }

  return [
    { to: "/", label: "Home", icon: HomeIcon, end: true },
    { to: "/bookings", label: "Bookings", icon: CalendarIcon, end: false },
    { to: "/messages", label: "Messages", icon: MessageIcon, end: false, badge: 2 },
  ]
}
