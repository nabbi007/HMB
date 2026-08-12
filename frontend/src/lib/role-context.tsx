import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import { api, ApiError } from "@/lib/api"

export type Role = "parent" | "caregiver"
export type VerificationStatus = "pending" | "verified"

// Backend role <-> frontend persona.
type BackendRole = "nurse" | "mother" | "admin"
function personaFor(role: BackendRole): Role {
  return role === "nurse" ? "caregiver" : "parent"
}
export function backendRoleFor(persona: Role): "nurse" | "mother" {
  return persona === "caregiver" ? "nurse" : "mother"
}

interface BackendUser {
  id: string
  first_name: string
  last_name: string
  full_name: string
  phone: string
  email: string | null
  role: BackendRole
  is_active: boolean
  phone_verified: boolean
  verification_status: string | null
  profile_photo_url: string | null
}

export interface SignupInput {
  first_name: string
  last_name: string
  phone: string
  email?: string
  password: string
  role: Role
}

export interface AuthResult {
  role: Role
  phoneVerified: boolean
  admin: boolean
}

const ROLE_KEY = "hellomama-role"
const ACCESS_KEY = "hellomama-access-token"
const REFRESH_KEY = "hellomama-refresh-token"

interface Tokens {
  access_token: string
  refresh_token: string
}

interface RoleContextValue {
  // Persona + verification (drives shared chrome and the caregiver gate).
  role: Role
  setRole: (role: Role) => void
  verificationStatus: VerificationStatus
  setVerificationStatus: (status: VerificationStatus) => void
  isVerifiedCaregiver: boolean
  isAdmin: boolean
  // Auth
  user: BackendUser | null
  token: string | null
  loading: boolean
  login: (identifier: string, password: string) => Promise<AuthResult>
  signup: (input: SignupInput) => Promise<AuthResult>
  logout: () => void
  requestOtp: () => Promise<void>
  verifyOtp: (code: string) => Promise<void>
  refreshUser: () => Promise<void>
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined)

export function RoleProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<BackendUser | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(ACCESS_KEY))
  const [loading, setLoading] = useState(true)
  // Persona is derived from the user once logged in, but is also set during
  // onboarding (before an account exists) so signup knows which role to create.
  const [role, setRoleState] = useState<Role>(
    () => (localStorage.getItem(ROLE_KEY) as Role) || "parent"
  )
  const [verificationOverride, setVerificationOverride] = useState<VerificationStatus | null>(null)

  const applyUser = useCallback((u: BackendUser) => {
    setUser(u)
    const persona = personaFor(u.role)
    setRoleState(persona)
    localStorage.setItem(ROLE_KEY, persona)
    setVerificationOverride(null)
  }, [])

  // On first load, if we have a token, resolve the current user.
  useEffect(() => {
    const token = localStorage.getItem(ACCESS_KEY)
    if (!token) {
      setLoading(false)
      return
    }
    api<BackendUser>("/api/v1/auth/me", { token })
      .then(applyUser)
      .catch(() => {
        localStorage.removeItem(ACCESS_KEY)
        localStorage.removeItem(REFRESH_KEY)
      })
      .finally(() => setLoading(false))
  }, [applyUser])

  function storeTokens(t: Tokens) {
    localStorage.setItem(ACCESS_KEY, t.access_token)
    localStorage.setItem(REFRESH_KEY, t.refresh_token)
    setToken(t.access_token)
  }

  const setRole = useCallback((next: Role) => {
    setRoleState(next)
    localStorage.setItem(ROLE_KEY, next)
  }, [])

  const login = useCallback(
    async (identifier: string, password: string): Promise<AuthResult> => {
      const tokens = await api<Tokens>("/api/v1/auth/login", {
        method: "POST",
        body: { identifier, password },
      })
      storeTokens(tokens)
      const me = await api<BackendUser>("/api/v1/auth/me", { token: tokens.access_token })
      applyUser(me)
      return {
        role: personaFor(me.role),
        phoneVerified: me.phone_verified,
        admin: me.role === "admin",
      }
    },
    [applyUser]
  )

  const signup = useCallback(
    async (input: SignupInput): Promise<AuthResult> => {
      const tokens = await api<Tokens>("/api/v1/auth/signup", {
        method: "POST",
        body: {
          first_name: input.first_name,
          last_name: input.last_name,
          phone: input.phone,
          email: input.email || null,
          password: input.password,
          role: backendRoleFor(input.role),
        },
      })
      storeTokens(tokens)
      const me = await api<BackendUser>("/api/v1/auth/me", { token: tokens.access_token })
      applyUser(me)
      return {
        role: personaFor(me.role),
        phoneVerified: me.phone_verified,
        admin: me.role === "admin",
      }
    },
    [applyUser]
  )

  const logout = useCallback(() => {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
    setUser(null)
    setToken(null)
    setVerificationOverride(null)
  }, [])

  const requestOtp = useCallback(async () => {
    const token = localStorage.getItem(ACCESS_KEY) ?? undefined
    await api("/api/v1/auth/otp/request", { method: "POST", token })
  }, [])

  const verifyOtp = useCallback(
    async (code: string) => {
      const token = localStorage.getItem(ACCESS_KEY) ?? undefined
      await api("/api/v1/auth/otp/verify", { method: "POST", body: { code }, token })
      const me = await api<BackendUser>("/api/v1/auth/me", { token })
      applyUser(me)
    },
    [applyUser]
  )

  const refreshUser = useCallback(async () => {
    const t = localStorage.getItem(ACCESS_KEY)
    if (!t) return
    const me = await api<BackendUser>("/api/v1/auth/me", { token: t })
    applyUser(me)
  }, [applyUser])

  // Verification: real backend status when logged in as a nurse; a local override
  // exists only for the demo toggle until the admin-verify flow (HMB-70) is built.
  const backendVerification: VerificationStatus =
    user?.verification_status === "verified" ? "verified" : "pending"
  const verificationStatus = verificationOverride ?? backendVerification
  const isVerifiedCaregiver = role === "caregiver" && verificationStatus === "verified"
  const isAdmin = user?.role === "admin"

  return (
    <RoleContext.Provider
      value={{
        role,
        setRole,
        verificationStatus,
        setVerificationStatus: setVerificationOverride,
        isVerifiedCaregiver,
        isAdmin,
        user,
        token,
        loading,
        login,
        signup,
        logout,
        requestOtp,
        verifyOtp,
        refreshUser,
      }}
    >
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const ctx = useContext(RoleContext)
  if (!ctx) throw new Error("useRole must be used within a RoleProvider")
  return ctx
}

export { ApiError }
