import { Navigate, Outlet } from "react-router-dom"
import { useRole } from "@/lib/role-context"

/**
 * Requires a logged-in user. While the initial /auth/me check runs we show a
 * minimal splash so we don't flash the login page for already-authenticated users.
 */
export function RequireAuth() {
  const { user, loading } = useRole()
  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background-offwhite text-sm text-text-muted">
        Loading…
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

/**
 * Requires the user's contact (email/phone) to be OTP-verified. Both roles must
 * pass this before using the app. Unverified users are sent to the OTP screen.
 */
export function RequireVerifiedContact() {
  const { user } = useRole()
  if (user && !user.phone_verified) return <Navigate to="/verify-otp" replace />
  return <Outlet />
}

/**
 * The map / caregiver-search at "/" is the parent-facing home. Caregivers have
 * their own home (the dashboard), so send them there — this is what keeps
 * caregivers (verified or not) from seeing the parent map.
 */
export function RequireParent() {
  const { role } = useRole()
  if (role === "caregiver") return <Navigate to="/dashboard" replace />
  return <Outlet />
}

/**
 * Gates caregiver "tasks" (messaging families, active shifts, rating families)
 * behind HMB verification. Parents pass through untouched. An unverified
 * caregiver is sent back to their dashboard, where the gate explains what to do.
 */
export function RequireVerifiedCaregiver() {
  const { role, verificationStatus } = useRole()
  if (role === "caregiver" && verificationStatus !== "verified") {
    return <Navigate to="/dashboard" replace />
  }
  return <Outlet />
}
