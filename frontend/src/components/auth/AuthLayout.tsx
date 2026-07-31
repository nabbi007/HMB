import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { Logo } from "@/components/layout/Logo"

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background-offwhite px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-5 text-center">
          <Link to="/">
            <Logo className="h-9" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-charcoal md:text-2xl">{title}</h1>
            <p className="mt-1 text-sm text-text-muted">{subtitle}</p>
          </div>
        </div>

        <div className="rounded-card bg-background-white p-6 shadow-sm md:p-8">{children}</div>
      </div>
    </div>
  )
}
