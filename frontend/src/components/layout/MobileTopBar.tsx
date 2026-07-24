import { Avatar, DarkThemeToggle } from "flowbite-react"
import { NavLink } from "react-router-dom"
import { HiOutlineBell } from "react-icons/hi2"
import { cn } from "@/lib/utils"
import { initialsAvatarTheme } from "@/lib/avatar-theme"
import { Logo } from "./Logo"
import { navIconButtonClass } from "./NavIconButton"

export function MobileTopBar() {
  return (
    <header className="z-20 flex h-[60px] w-full shrink-0 items-center justify-between border-b border-neutral-border bg-background-white px-5 md:hidden">
      <Logo className="h-6" />

      <div className="flex items-center gap-1">
        <DarkThemeToggle className={cn(navIconButtonClass, "size-8")} />

        <button
          type="button"
          aria-label="Notifications"
          className={cn("relative", navIconButtonClass, "size-8")}
        >
          <HiOutlineBell />
          <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-brand-red" />
        </button>

        <NavLink to="/profile" aria-label="Profile" className="ml-1">
          <Avatar rounded size="sm" placeholderInitials="A" theme={initialsAvatarTheme("bg-brand-red")} />
        </NavLink>
      </div>
    </header>
  )
}
