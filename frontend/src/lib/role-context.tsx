import { createContext, useContext, useState, type ReactNode } from "react"

export type Role = "parent" | "caregiver"

const STORAGE_KEY = "hellomama-role"

function readStoredRole(): Role {
  return localStorage.getItem(STORAGE_KEY) === "caregiver" ? "caregiver" : "parent"
}

const RoleContext = createContext<{ role: Role; setRole: (role: Role) => void } | undefined>(
  undefined
)

/**
 * Which persona is currently using the app — Parent or Caregiver. Set once at
 * Onboarding's role select and persisted, so shared chrome (the sidebar's Home
 * icon, in particular) can point somewhere that actually makes sense for
 * whoever is logged in, instead of always assuming the parent-facing home.
 */
export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(readStoredRole)

  function setRole(next: Role) {
    localStorage.setItem(STORAGE_KEY, next)
    setRoleState(next)
  }

  return <RoleContext.Provider value={{ role, setRole }}>{children}</RoleContext.Provider>
}

export function useRole() {
  const ctx = useContext(RoleContext)
  if (!ctx) throw new Error("useRole must be used within a RoleProvider")
  return ctx
}
