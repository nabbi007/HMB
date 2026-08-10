import { NavLink } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useRole } from "@/lib/role-context"
import { useUnread } from "@/lib/unread-context"
import { getNavLinks } from "./nav-links"

export function BottomTabBar() {
  const { role, isVerifiedCaregiver } = useRole()
  const { unread } = useUnread()
  const navLinks = getNavLinks(role, isVerifiedCaregiver)

  return (
    <nav className="z-20 flex h-[76px] w-full shrink-0 items-stretch justify-around border-t border-neutral-border bg-background-white pb-[env(safe-area-inset-bottom)] md:hidden">
      {navLinks.map(({ to, label, end, icon: Icon }) => {
        const count = to === "/messages" ? unread : 0
        return (
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
              {count > 0 ? (
                <span className="absolute -top-1.5 -right-2.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-brand-red px-1 text-[9px] font-bold text-white">
                  {count > 9 ? "9+" : count}
                </span>
              ) : null}
            </span>
            <span className="text-xs font-medium">{label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
