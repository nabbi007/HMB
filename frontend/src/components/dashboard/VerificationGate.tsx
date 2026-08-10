import { Link } from "react-router-dom"
import { ArrowRightIcon, WarningIcon } from "@/lib/icons"

/**
 * Shown on the caregiver dashboard while the account is pending HMB verification.
 * The caregiver can still reach this screen and the verification flow, but every
 * task (requests, availability, earnings, messaging) is locked until approved.
 */
export function VerificationGate({ name }: { name?: string }) {
  return (
    <div className="mt-6 rounded-card bg-background-white p-6 text-center md:p-10">
      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-verify-gold-bg">
        <WarningIcon className="size-7 text-verify-gold" />
      </span>

      <span className="mt-4 inline-block rounded-[10px] bg-verify-gold-bg px-2.5 py-1 text-xs font-medium text-verify-gold">
        Pending HMB verification
      </span>

      <h2 className="mt-3 text-lg font-bold text-text-charcoal md:text-xl">
        {name ? `Welcome, ${name}! ` : ""}Your account is under review
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-text-muted">
        Welcome to HelloMama! Before you can receive bookings, appear in search, or
        message families, HMB needs to verify your identity and your Nursing &amp;
        Midwifery Council PIN. You can set up the rest of your profile in the meantime.
      </p>

      <Link
        to="/verification"
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-panel bg-brand-red px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        Complete verification
        <ArrowRightIcon className="size-4" />
      </Link>
    </div>
  )
}
