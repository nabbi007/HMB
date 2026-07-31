import { useState } from "react"
import { Button, Label, TextInput } from "flowbite-react"
import { Link, useNavigate } from "react-router-dom"
import { AuthLayout } from "@/components/auth/AuthLayout"

const fieldClassName =
  "[&_input]:rounded-panel [&_input]:border-neutral-border [&_input]:bg-neutral-surface [&_input]:text-text-charcoal [&_input]:focus:border-brand-red [&_input]:focus:ring-brand-red"

export default function Signup() {
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // No real auth yet — creating an account moves straight to role selection.
    navigate("/onboarding")
  }

  return (
    <AuthLayout title="Create your account" subtitle="Find trusted, verified care in minutes.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="name">Full name</Label>
          <TextInput
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ama Boateng"
            className={`mt-1.5 ${fieldClassName}`}
          />
        </div>

        <div>
          <Label htmlFor="signup-email">Email</Label>
          <TextInput
            id="signup-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={`mt-1.5 ${fieldClassName}`}
          />
        </div>

        <div>
          <Label htmlFor="signup-password">Password</Label>
          <TextInput
            id="signup-password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className={`mt-1.5 ${fieldClassName}`}
          />
        </div>

        <Button type="submit" color="default" fullSized className="mt-2">
          Create account
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
