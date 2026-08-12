import { DarkThemeToggle, Avatar } from "flowbite-react"
import { NavLink } from "react-router-dom"
import { MoonIcon, SunIcon } from "@/lib/icons"
import { cn } from "@/lib/utils"
import { initialsAvatarTheme } from "@/lib/avatar-theme"
import { useRole } from "@/lib/role-context"
import { useUnread } from "@/lib/unread-context"
import { NotificationsPopover } from "./NotificationsPopover"
import { getNavLinks } from "./nav-links"

const railIconButtonClass =
  "flex size-11 items-center justify-center rounded-2xl text-white/50 transition-colors hover:bg-white/10 hover:text-white [&_svg]:size-5"

export function Sidebar() {
  const { role, isVerifiedCaregiver, user } = useRole()
  const { unread } = useUnread()
  const navLinks = getNavLinks(role, isVerifiedCaregiver)
  const homeTo = role === "caregiver" ? "/dashboard" : "/"
  const initial = user?.full_name?.[0]?.toUpperCase() ?? "?"

  return (
    <nav className="z-20 hidden w-[76px] shrink-0 flex-col items-center gap-2 bg-[#151517] py-5 md:flex">
      <NavLink to={homeTo} aria-label="HelloMamaBetter" className="mb-4">
        <img src="/HMB%20favicon.svg" alt="" className="size-10" />
      </NavLink>

      <div className="flex flex-col items-center gap-1">
        {navLinks.map(({ to, label, end, icon: Icon }) => {
          const count = to === "/messages" ? unread : 0
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              aria-label={count > 0 ? `${label} (${count} unread)` : label}
              className={({ isActive }) =>
                cn(
                  "relative flex w-[60px] flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white",
                  isActive && "bg-white/10 text-white hover:bg-white/10 hover:text-white"
                )
              }
            >
              <Icon className="size-5" />
              <span className="text-[10px] leading-none font-medium">{label}</span>
              {count > 0 ? (
                <span className="absolute top-0.5 right-2 flex min-w-[16px] items-center justify-center rounded-full bg-brand-red px-1 text-[9px] font-bold text-white ring-2 ring-[#151517]">
                  {count > 9 ? "9+" : count}
                </span>
              ) : null}
            </NavLink>
          )
        })}
      </div>

      <div className="flex-1" />

      <div className="flex flex-col items-center gap-2">
        <NotificationsPopover
          buttonClassName={railIconButtonClass}
          panelClassName="bottom-0 left-full ml-3"
        />

        <DarkThemeToggle className={railIconButtonClass} iconDark={SunIcon} iconLight={MoonIcon} />

        <div className="my-1 h-px w-8 bg-white/10" />

        <NavLink to="/profile" aria-label="Profile">
          <Avatar
            rounded
            size="sm"
            status="online"
            placeholderInitials={initial}
            theme={initialsAvatarTheme("bg-brand-red")}
          />
        </NavLink>
      </div>
    </nav>
  )
}
