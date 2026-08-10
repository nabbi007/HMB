import { useState } from "react"
import { Button, Label, TextInput } from "flowbite-react"
import { Link, useNavigate } from "react-router-dom"
import { AuthLayout } from "@/components/auth/AuthLayout"
import { PasswordField } from "@/components/auth/PasswordField"
import { ApiError, useRole } from "@/lib/role-context"

const fieldClassName =
  "[&_input]:rounded-panel [&_input]:border-neutral-border [&_input]:bg-neutral-surface [&_input]:text-text-charcoal [&_input]:focus:border-brand-red [&_input]:focus:ring-brand-red"

export default function Login() {
  const navigate = useNavigate()
  const { login } = useRole()
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const { role, phoneVerified, admin } = await login(identifier, password)
      if (admin) navigate("/admin")
      else if (!phoneVerified) navigate("/verify-otp")
      else navigate(role === "caregiver" ? "/dashboard" : "/")
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to find and book trusted care.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error ? (
          <p className="rounded-panel bg-brand-red-tint px-3 py-2 text-sm text-brand-red">
            {error}
          </p>
        ) : null}

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

        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-brand-red hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordField
            id="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <Button type="submit" color="default" fullSized className="mt-2" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-muted">
        Don&apos;t have an account?{" "}
        <Link to="/onboarding" className="font-medium text-brand-red hover:underline">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  )
}
