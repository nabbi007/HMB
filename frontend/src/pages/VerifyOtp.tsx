import { useEffect, useRef, useState } from "react"
import { Button, Label, TextInput } from "flowbite-react"
import { useNavigate } from "react-router-dom"
import { AuthLayout } from "@/components/auth/AuthLayout"
import { ApiError, useRole } from "@/lib/role-context"

const fieldClassName =
  "[&_input]:rounded-panel [&_input]:border-neutral-border [&_input]:bg-neutral-surface [&_input]:text-text-charcoal [&_input]:focus:border-brand-red [&_input]:focus:ring-brand-red"

export default function VerifyOtp() {
  const navigate = useNavigate()
  const { user, requestOtp, verifyOtp, logout } = useRole()
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Send a code once when the screen opens.
  const requestedRef = useRef(false)
  useEffect(() => {
    if (requestedRef.current) return
    requestedRef.current = true
    requestOtp()
      .then(() => setInfo("We emailed you a 6-digit code."))
      .catch((err) => setError(err instanceof ApiError ? err.detail : "Couldn't send the code."))
  }, [requestOtp])

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await verifyOtp(code.trim())
      // New, verified account → guided profile setup.
      navigate("/onboarding/setup", { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Verification failed. Try again.")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResend() {
    setError(null)
    setInfo(null)
    try {
      await requestOtp()
      setInfo("A new code is on its way.")
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Couldn't resend the code.")
    }
  }

  return (
    <AuthLayout
      title="Verify your account"
      subtitle={`Enter the code we sent to ${user?.email ?? "your email"}.`}
    >
      <form onSubmit={handleVerify} className="flex flex-col gap-4">
        {info ? (
          <p className="rounded-panel bg-verify-green-bg px-3 py-2 text-sm text-verify-green">
            {info}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-panel bg-brand-red-tint px-3 py-2 text-sm text-brand-red">
            {error}
          </p>
        ) : null}

        <div>
          <Label htmlFor="code">Verification code</Label>
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

        <Button type="submit" color="default" fullSized className="mt-2" disabled={submitting}>
          {submitting ? "Verifying…" : "Verify"}
        </Button>
      </form>

      <div className="mt-6 flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={handleResend}
          className="font-medium text-brand-red hover:underline"
        >
          Resend code
        </button>
        <button
          type="button"
          onClick={() => {
            logout()
            navigate("/login", { replace: true })
          }}
          className="text-text-muted hover:underline"
        >
          Use a different account
        </button>
      </div>

      <p className="mt-4 text-center text-xs text-text-muted">
        Dev tip: open Mailpit at http://localhost:8025 to read the code.
      </p>
    </AuthLayout>
  )
}
