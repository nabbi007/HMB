import { Avatar, DarkThemeToggle } from "flowbite-react"
import { NavLink } from "react-router-dom"
import { MoonIcon, SunIcon } from "@/lib/icons"
import { cn } from "@/lib/utils"
import { initialsAvatarTheme } from "@/lib/avatar-theme"
import { Logo } from "./Logo"
import { navIconButtonClass } from "./NavIconButton"
import { NotificationsPopover } from "./NotificationsPopover"

export function MobileTopBar() {
  return (
    <header className="z-20 flex h-[60px] w-full shrink-0 items-center justify-between border-b border-neutral-border bg-background-white px-5 md:hidden">
      <Logo className="h-6" />

      <div className="flex items-center gap-1">
        <DarkThemeToggle
          className={cn(navIconButtonClass, "size-8")}
          iconDark={SunIcon}
          iconLight={MoonIcon}
        />

        <NotificationsPopover
          buttonClassName={cn(navIconButtonClass, "size-8")}
          panelClassName="fixed top-[64px] right-4"
        />

        <NavLink to="/profile" aria-label="Profile" className="ml-1">
          <Avatar rounded size="sm" placeholderInitials="A" theme={initialsAvatarTheme("bg-brand-red")} />
        </NavLink>
      </div>
    </header>
  )
}
