import { CalendarIcon, HomeIcon } from "flowbite-react/icons"
import { HiOutlineChatBubbleOvalLeft, HiOutlineUser } from "react-icons/hi2"
import type { ComponentType, SVGProps } from "react"

export const navLinks: {
  to: string
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  end: boolean
  badge?: number
}[] = [
  { to: "/", label: "Home", icon: HomeIcon, end: true },
  { to: "/bookings", label: "Bookings", icon: CalendarIcon, end: false },
  { to: "/messages", label: "Messages", icon: HiOutlineChatBubbleOvalLeft, end: false, badge: 2 },
  { to: "/profile", label: "Profile", icon: HiOutlineUser, end: false },
]
