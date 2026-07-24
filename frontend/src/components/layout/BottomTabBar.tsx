import { NavLink } from "react-router-dom"
import { cn } from "@/lib/utils"
import { navLinks } from "./nav-links"

export function BottomTabBar() {
  return (
    <nav className="z-20 flex h-[76px] w-full shrink-0 items-stretch justify-around border-t border-neutral-border bg-background-white pb-[env(safe-area-inset-bottom)] md:hidden">
      {navLinks.map(({ to, label, end, icon: Icon, badge }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              "relative flex flex-1 flex-col items-center justify-center gap-1 text-text-muted",
              isActive && "text-brand-red"
            )
          }
        >
          <span className="relative">
            <Icon className="size-5" />
            {badge ? (
              <span className="absolute -top-1.5 -right-2 flex size-[15px] items-center justify-center rounded-full bg-brand-red text-[9px] font-bold text-white">
                {badge}
              </span>
            ) : null}
          </span>
          <span className="text-xs font-medium">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
