import { DarkThemeToggle, Avatar } from "flowbite-react"
import { NavLink } from "react-router-dom"
import { HiOutlineBell } from "react-icons/hi2"
import { cn } from "@/lib/utils"
import { initialsAvatarTheme } from "@/lib/avatar-theme"
import { navLinks } from "./nav-links"

const railIconButtonClass =
  "flex size-11 items-center justify-center rounded-2xl text-white/50 transition-colors hover:bg-white/10 hover:text-white [&_svg]:size-5"

export function Sidebar() {
  return (
    <nav className="z-20 hidden w-[76px] shrink-0 flex-col items-center gap-2 bg-[#151517] py-5 md:flex">
      <NavLink to="/" aria-label="HelloMama" className="mb-4">
        <img src="/HMB%20favicon.svg" alt="" className="size-10" />
      </NavLink>

      <div className="flex flex-col items-center gap-2">
        {navLinks.map(({ to, label, end, icon: Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            aria-label={label}
            title={label}
            className={({ isActive }) =>
              cn(
                "relative flex size-11 items-center justify-center rounded-2xl text-white/50 transition-colors hover:bg-white/10 hover:text-white [&_svg]:size-5",
                isActive && "bg-brand-red text-white hover:bg-brand-red hover:text-white"
              )
            }
          >
            <Icon />
            {badge ? (
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-brand-red ring-2 ring-[#151517]" />
            ) : null}
          </NavLink>
        ))}
      </div>

      <div className="flex-1" />

      <div className="flex flex-col items-center gap-2">
        <button type="button" aria-label="Notifications" className={cn("relative", railIconButtonClass)}>
          <HiOutlineBell />
          <span className="absolute top-2 right-2 size-1.5 rounded-full bg-brand-red" />
        </button>

        <DarkThemeToggle className={railIconButtonClass} />

        <div className="my-1 h-px w-8 bg-white/10" />

        <NavLink to="/profile" aria-label="Profile">
          <Avatar
            rounded
            size="sm"
            placeholderInitials="A"
            theme={initialsAvatarTheme("bg-brand-red")}
          />
        </NavLink>
      </div>
    </nav>
  )
}
