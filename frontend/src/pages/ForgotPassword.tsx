import { useState } from "react"
import { Button, Label, TextInput } from "flowbite-react"
import { Link, useNavigate } from "react-router-dom"
import { AuthLayout } from "@/components/auth/AuthLayout"
import { PasswordChecklist } from "@/components/auth/PasswordChecklist"
import { PasswordField } from "@/components/auth/PasswordField"
import { api, ApiError } from "@/lib/api"
import { passwordValid } from "@/lib/password"

const fieldClassName =
  "[&_input]:rounded-panel [&_input]:border-neutral-border [&_input]:bg-neutral-surface [&_input]:text-text-charcoal [&_input]:focus:border-brand-red [&_input]:focus:ring-brand-red"

type Step = "request" | "code" | "password"

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>("request")
  const [identifier, setIdentifier] = useState("")
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [pwFocused, setPwFocused] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const passwordsMatch = password.length > 0 && password === confirm
  const canReset = passwordValid(password) && passwordsMatch

  async function requestCode(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await api("/api/v1/auth/password/forgot", { method: "POST", body: { identifier } })
      setInfo("If an account exists, a reset code was emailed. (Dev: read it in Mailpit.)")
      setStep("code")
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  function continueToPassword(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!code.trim()) return
    setInfo(null)
    setStep("password")
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!canReset) return
    setSubmitting(true)
    try {
      await api("/api/v1/auth/password/reset", {
        method: "POST",
        body: { identifier, code: code.trim(), new_password: password },
      })
      navigate("/login", { replace: true })
    } catch (err) {
      // A bad/expired code surfaces here — let them step back to fix it.
      setError(err instanceof ApiError ? err.detail : "Something went wrong. Please try again.")
      if (err instanceof ApiError && err.status === 400) setStep("code")
    } finally {
      setSubmitting(false)
    }
  }

  const subtitle =
    step === "request"
      ? "Enter your phone or email and we'll send a reset code."
      : step === "code"
        ? "Enter the reset code we emailed you."
        : "Choose a new password."

  return (
    <AuthLayout title="Reset your password" subtitle={subtitle}>
      {error ? (
        <p className="mb-4 rounded-panel bg-brand-red-tint px-3 py-2 text-sm text-brand-red">
          {error}
        </p>
      ) : null}
      {info && step !== "password" ? (
        <p className="mb-4 rounded-panel bg-verify-green-bg px-3 py-2 text-sm text-verify-green">
          {info}
        </p>
      ) : null}

      {step === "request" ? (
        <form onSubmit={requestCode} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="identifier">Phone or email</Label>
            <TextInput
              id="identifier"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="+233… or you@example.com"
              className={`mt-1.5 ${fieldClassName}`}
            />
          </div>
          <Button type="submit" color="default" fullSized disabled={submitting}>
            {submitting ? "Sending…" : "Send reset code"}
          </Button>
        </form>
      ) : step === "code" ? (
        <form onSubmit={continueToPassword} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="code">Reset code</Label>
            <TextInput
              id="code"
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              className={`mt-1.5 ${fieldClassName}`}
            />
          </div>
          <Button type="submit" color="default" fullSized disabled={!code.trim()}>
            Continue
          </Button>
          <button
            type="button"
            onClick={() => setStep("request")}
            className="text-center text-sm text-text-muted hover:underline"
          >
            Use a different phone/email
          </button>
        </form>
      ) : (
        <form onSubmit={resetPassword} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="new-password">New password</Label>
            <PasswordField
              id="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPwFocused(true)}
              onBlur={() => setPwFocused(false)}
              placeholder="New password"
            />
            {pwFocused ? <PasswordChecklist password={password} /> : null}
          </div>
          <div>
            <Label htmlFor="confirm-password">Confirm password</Label>
            <PasswordField
              id="confirm-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter new password"
            />
            {confirm.length > 0 && !passwordsMatch ? (
              <p className="mt-1 text-xs text-brand-red">Passwords don't match.</p>
            ) : null}
          </div>
          <Button type="submit" color="default" fullSized disabled={submitting || !canReset}>
            {submitting ? "Resetting…" : "Reset password"}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-text-muted">
        Remembered it?{" "}
        <Link to="/login" className="font-medium text-brand-red hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
