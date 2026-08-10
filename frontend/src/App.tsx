import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { AppShell } from "@/components/layout/AppShell"
import { RoleProvider } from "@/lib/role-context"
import Onboarding from "@/pages/Onboarding"
import Login from "@/pages/Login"
import Signup from "@/pages/Signup"
import Home from "@/pages/Home"
import Bookings from "@/pages/Bookings"
import Profile from "@/pages/Profile"
import CaregiverProfile from "@/pages/CaregiverProfile"
import Booking from "@/pages/Booking"
import BookingConfirmation from "@/pages/BookingConfirmation"
import ActiveShift from "@/pages/ActiveShift"
import Chat from "@/pages/Chat"
import CaregiverDashboard from "@/pages/CaregiverDashboard"
import VerificationUpload from "@/pages/VerificationUpload"
import WriteReview from "@/pages/WriteReview"
import WriteFamilyReview from "@/pages/WriteFamilyReview"
import VerifyOtp from "@/pages/VerifyOtp"
import ForgotPassword from "@/pages/ForgotPassword"
import OnboardingSetup from "@/pages/OnboardingSetup"
import AdminDashboard from "@/pages/AdminDashboard"
import {
  RequireAuth,
  RequireParent,
  RequireVerifiedCaregiver,
  RequireVerifiedContact,
} from "@/components/auth/guards"

export default function App() {
  return (
    <RoleProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route element={<RequireAuth />}>
          {/* Logged in but contact not yet OTP-verified: only the OTP screen is reachable */}
          <Route path="/verify-otp" element={<VerifyOtp />} />
          {/* Admin console (standalone; the page itself guards on isAdmin) */}
          <Route path="/admin" element={<AdminDashboard />} />

          <Route element={<RequireVerifiedContact />}>
          {/* First-time profile setup (standalone, no app nav) */}
          <Route path="/onboarding/setup" element={<OnboardingSetup />} />

          <Route element={<AppShell />}>
            {/* Parent-only: the caregiver-search map */}
            <Route element={<RequireParent />}>
              <Route path="/" element={<Home />} />
            </Route>

            <Route path="/bookings" element={<Bookings />} />
            <Route path="/bookings/:id" element={<Booking />} />
            <Route path="/bookings/:id/confirmation" element={<BookingConfirmation />} />
            <Route path="/bookings/:id/review" element={<WriteReview />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/caregivers/:id" element={<CaregiverProfile />} />
            <Route path="/dashboard" element={<CaregiverDashboard />} />
            <Route path="/verification" element={<VerificationUpload />} />

            {/* Caregiver tasks — locked until HMB verification is complete */}
            <Route element={<RequireVerifiedCaregiver />}>
              <Route path="/bookings/:id/shift" element={<ActiveShift />} />
              <Route path="/messages" element={<Chat />} />
              <Route path="/messages/:id" element={<Chat />} />
              <Route path="/dashboard/reviews/:id" element={<WriteFamilyReview />} />
            </Route>
          </Route>
          </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </RoleProvider>
  )
}
