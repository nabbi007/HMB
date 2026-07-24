import { Outlet } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { MobileTopBar } from "./MobileTopBar"
import { BottomTabBar } from "./BottomTabBar"

export function AppShell() {
  return (
    <div className="flex h-svh bg-background-offwhite">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar />
        <main className="relative min-h-0 flex-1 overflow-hidden">
          <Outlet />
        </main>
        <BottomTabBar />
      </div>
    </div>
  )
}
