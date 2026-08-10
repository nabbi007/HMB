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
//
// An UNVERIFIED caregiver only gets Home (their dashboard, which shows the
// verification gate) — task tabs like Messages stay hidden until HMB approves
// them, matching the route guards.
export function getNavLinks(role: Role, caregiverVerified = false): NavLinkItem[] {
  if (role === "caregiver") {
    const links: NavLinkItem[] = [{ to: "/dashboard", label: "Home", icon: HomeIcon, end: true }]
    if (caregiverVerified) {
      links.push({ to: "/messages", label: "Messages", icon: MessageIcon, end: false })
    }
    return links
  }

  return [
    { to: "/", label: "Home", icon: HomeIcon, end: true },
    { to: "/bookings", label: "Bookings", icon: CalendarIcon, end: false },
    { to: "/messages", label: "Messages", icon: MessageIcon, end: false },
  ]
}
