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

export default function App() {
  return (
    <RoleProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route element={<AppShell />}>
            <Route path="/" element={<Home />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/bookings/:id" element={<Booking />} />
            <Route path="/bookings/:id/confirmation" element={<BookingConfirmation />} />
            <Route path="/bookings/:id/shift" element={<ActiveShift />} />
            <Route path="/bookings/:id/review" element={<WriteReview />} />
            <Route path="/messages" element={<Chat />} />
            <Route path="/messages/:id" element={<Chat />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/caregivers/:id" element={<CaregiverProfile />} />
            <Route path="/dashboard" element={<CaregiverDashboard />} />
            <Route path="/dashboard/reviews/:id" element={<WriteFamilyReview />} />
            <Route path="/verification" element={<VerificationUpload />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </RoleProvider>
  )
}
