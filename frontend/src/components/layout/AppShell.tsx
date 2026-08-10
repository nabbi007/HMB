import { Link, Outlet } from "react-router-dom"
import { useRole } from "@/lib/role-context"
import { UnreadProvider } from "@/lib/unread-context"
import { Sidebar } from "./Sidebar"
import { MobileTopBar } from "./MobileTopBar"
import { BottomTabBar } from "./BottomTabBar"

export function AppShell() {
  const { role, verificationStatus } = useRole()
  const showPendingBanner = role === "caregiver" && verificationStatus !== "verified"

  return (
    <UnreadProvider>
      <div className="flex h-svh bg-background-offwhite">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <MobileTopBar />
          {showPendingBanner ? (
            <Link
              to="/verification"
              className="flex shrink-0 items-center justify-center gap-1.5 bg-verify-gold-bg px-4 py-2 text-center text-xs font-medium text-verify-gold hover:underline"
            >
              ⏳ Your account is pending HMB verification — complete your documents
            </Link>
          ) : null}
          <main className="relative min-h-0 flex-1 overflow-hidden">
            <Outlet />
          </main>
          <BottomTabBar />
        </div>
      </div>
    </UnreadProvider>
  )
}
