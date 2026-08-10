import { useState } from "react"
import { Button, Label, TextInput } from "flowbite-react"
import { Link, useNavigate } from "react-router-dom"
import { AuthLayout } from "@/components/auth/AuthLayout"
import { PasswordChecklist } from "@/components/auth/PasswordChecklist"
import { PasswordField } from "@/components/auth/PasswordField"
import { ApiError, useRole } from "@/lib/role-context"
import { passwordValid } from "@/lib/password"

const fieldClassName =
  "[&_input]:rounded-panel [&_input]:border-neutral-border [&_input]:bg-neutral-surface [&_input]:text-text-charcoal [&_input]:focus:border-brand-red [&_input]:focus:ring-brand-red"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Ghana numbers: +233 followed by 9 digits, or 0 followed by 9 digits.
const GH_PHONE_RE = /^(\+233|0)\d{9}$/

export default function Signup() {
  const navigate = useNavigate()
  const { role, signup } = useRole()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [pwFocused, setPwFocused] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [attempted, setAttempted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const roleLabel = role === "caregiver" ? "caregiver" : "parent"

  const errors: Record<string, string> = {
    firstName: firstName.trim() ? "" : "First name is required.",
    lastName: lastName.trim() ? "" : "Last name is required.",
    phone: GH_PHONE_RE.test(phone.replace(/\s/g, ""))
      ? ""
      : "Enter a valid Ghana number (+233… or 0…).",
    email: EMAIL_RE.test(email.trim()) ? "" : "Enter a valid email address.",
    password: passwordValid(password) ? "" : "Password doesn't meet the requirements.",
    confirm:
      confirm.length === 0
        ? "Please confirm your password."
        : password !== confirm
          ? "Passwords don't match."
          : "",
  }
  const isValid = !Object.values(errors).some(Boolean)

  function markTouched(field: string) {
    setTouched((t) => ({ ...t, [field]: true }))
  }
  const errText = (field: string) =>
    (touched[field] || attempted) && errors[field] ? (
      <p className="mt-1 text-xs text-brand-red">{errors[field]}</p>
    ) : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!isValid) {
      setAttempted(true)
      return
    }
    setSubmitting(true)
    try {
      const { role: created, phoneVerified } = await signup({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.replace(/\s/g, ""),
        email: email.trim(),
        password,
        role,
      })
      if (!phoneVerified) navigate("/verify-otp")
      else navigate(created === "caregiver" ? "/dashboard" : "/")
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle={`Signing up as a ${roleLabel}. Find trusted, verified care in minutes.`}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {error ? (
          <p className="rounded-panel bg-brand-red-tint px-3 py-2 text-sm text-brand-red">
            {error}
          </p>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="first-name">First name</Label>
            <TextInput
              id="first-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              onBlur={() => markTouched("firstName")}
              placeholder="Ama"
              className={`mt-1.5 ${fieldClassName}`}
            />
            {errText("firstName")}
          </div>
          <div>
            <Label htmlFor="last-name">Last name</Label>
            <TextInput
              id="last-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              onBlur={() => markTouched("lastName")}
              placeholder="Boateng"
              className={`mt-1.5 ${fieldClassName}`}
            />
            {errText("lastName")}
          </div>
        </div>

        <div>
          <Label htmlFor="phone">Phone number</Label>
          <TextInput
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onBlur={() => markTouched("phone")}
            placeholder="+233 20 000 0000"
            className={`mt-1.5 ${fieldClassName}`}
          />
          {errText("phone")}
        </div>

        <div>
          <Label htmlFor="signup-email">Email</Label>
          <TextInput
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => markTouched("email")}
            placeholder="you@example.com"
            className={`mt-1.5 ${fieldClassName}`}
          />
          {errText("email")}
        </div>

        <div>
          <Label htmlFor="signup-password">Password</Label>
          <PasswordField
            id="signup-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setPwFocused(true)}
            onBlur={() => {
              setPwFocused(false)
              markTouched("password")
            }}
            placeholder="Choose a password"
          />
          {pwFocused ? <PasswordChecklist password={password} /> : errText("password")}
        </div>

        <div>
          <Label htmlFor="confirm-password">Confirm password</Label>
          <PasswordField
            id="confirm-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onBlur={() => markTouched("confirm")}
            placeholder="Re-enter your password"
          />
          {errText("confirm")}
        </div>

        <Button
          type="submit"
          color="default"
          fullSized
          className="mt-2"
          disabled={submitting || !isValid}
        >
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-muted">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-brand-red hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
