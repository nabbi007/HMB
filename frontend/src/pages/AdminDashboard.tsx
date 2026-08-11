import { useCallback, useEffect, useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { Logo } from "@/components/layout/Logo"
import { LogoutIcon } from "@/lib/icons"
import { api, mediaUrl } from "@/lib/api"
import { useRole } from "@/lib/role-context"
import { cn } from "@/lib/utils"

type Status = "pending" | "verified" | "rejected"

interface AdminNurse {
  user_id: string
  full_name: string
  email: string | null
  phone: string
  community: string | null
  languages: string[]
  bio: string | null
  daily_rate: number | string | null
  verification_status: string
  verification_reason: string | null
  profile_photo_url: string | null
  passport_photo_url: string | null
  nmc_pin_photo_url: string | null
}

function initials(name: string): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "?"
  )
}

const TABS: Status[] = ["pending", "verified", "rejected"]

export default function AdminDashboard() {
  const { isAdmin, token, logout } = useRole()
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<Status>("pending")
  const [nurses, setNurses] = useState<AdminNurse[]>([])
  const [loading, setLoading] = useState(true)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [reason, setReason] = useState("")
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(() => {
    if (!token) return
    setLoading(true)
    api<AdminNurse[]>(`/api/v1/admin/nurses?status=${statusFilter}`, { token })
      .then(setNurses)
      .catch(() => setNurses([]))
      .finally(() => setLoading(false))
  }, [token, statusFilter])

  useEffect(() => {
    load()
  }, [load])

  if (!isAdmin) return <Navigate to="/" replace />

  async function verify(id: string) {
    setBusy(id)
    try {
      await api(`/api/v1/admin/nurses/${id}/verify`, { method: "POST", token: token ?? undefined })
      load()
    } finally {
      setBusy(null)
    }
  }

  async function reject(id: string) {
    if (!reason.trim()) return
    setBusy(id)
    try {
      await api(`/api/v1/admin/nurses/${id}/reject`, {
        method: "POST",
        body: { reason: reason.trim() },
        token: token ?? undefined,
      })
      setRejectingId(null)
      setReason("")
      load()
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="min-h-svh bg-background-offwhite">
      <header className="flex items-center justify-between border-b border-neutral-border bg-background-white px-6 py-4">
        <div className="flex items-center gap-3">
          <Logo className="h-7" />
          <span className="rounded-full bg-text-charcoal px-2 py-0.5 text-xs font-semibold text-white">
            Admin
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            logout()
            navigate("/login", { replace: true })
          }}
          className="flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text-charcoal"
        >
          <LogoutIcon className="size-4" />
          Log out
        </button>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="text-xl font-bold text-text-charcoal md:text-2xl">Nurse verification</h1>
        <p className="mt-1 text-sm text-text-muted">
          Review each nurse's identity and NMC PIN, then approve or reject.
        </p>

        <div className="mt-5 flex gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setStatusFilter(t)}
              className={cn(
                "rounded-pill border px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                statusFilter === t
                  ? "border-brand-red bg-brand-red text-white"
                  : "border-neutral-border bg-background-white text-text-charcoal hover:bg-neutral-surface"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-4">
          {loading ? (
            <p className="text-sm text-text-muted">Loading…</p>
          ) : nurses.length === 0 ? (
            <p className="rounded-card bg-background-white p-6 text-sm text-text-muted">
              No {statusFilter} nurses.
            </p>
          ) : (
            nurses.map((n) => {
              const photo = mediaUrl(n.profile_photo_url)
              const idDoc = mediaUrl(n.passport_photo_url)
              const nmcDoc = mediaUrl(n.nmc_pin_photo_url)
              return (
                <div key={n.user_id} className="rounded-card bg-background-white p-6">
                  <div className="flex items-start gap-4">
                    {photo ? (
                      <img
                        src={photo}
                        alt={n.full_name}
                        className="size-14 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-brand-red font-bold text-white">
                        {initials(n.full_name)}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-text-charcoal">{n.full_name}</p>
                      <p className="text-sm text-text-muted">
                        Caregiver{n.community ? ` · ${n.community}` : ""}
                      </p>
                      <p className="text-xs text-text-muted">
                        {n.email ?? "no email"} · {n.phone}
                      </p>
                    </div>
                  </div>

                  <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
                    <Field
                      label="NMC PIN photo"
                      value={nmcDoc ? "View" : "— not submitted —"}
                      href={nmcDoc}
                    />
                    <Field label="Languages" value={n.languages.join(", ") || "—"} />
                    <Field
                      label="Rate"
                      value={n.daily_rate != null ? `GHS ${Number(n.daily_rate)}/day` : "—"}
                    />
                    <Field
                      label="ID document"
                      value={idDoc ? "View" : "— not submitted —"}
                      href={idDoc}
                    />
                  </dl>
                  {n.bio ? <p className="mt-3 text-sm text-text-muted">{n.bio}</p> : null}
                  {n.verification_reason ? (
                    <p className="mt-3 rounded-panel bg-brand-red-tint px-3 py-2 text-sm text-brand-red">
                      Rejected: {n.verification_reason}
                    </p>
                  ) : null}

                  {statusFilter === "pending" ? (
                    rejectingId === n.user_id ? (
                      <div className="mt-4 flex flex-col gap-2">
                        <textarea
                          autoFocus
                          rows={2}
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="Reason for rejection (emailed to the nurse)"
                          className="rounded-panel border border-neutral-border bg-neutral-surface px-3 py-2 text-sm text-text-charcoal placeholder:text-text-muted focus:border-brand-red focus:ring-brand-red focus:outline-none"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={!reason.trim() || busy === n.user_id}
                            onClick={() => reject(n.user_id)}
                            className="rounded-panel bg-brand-red px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                          >
                            Confirm reject
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRejectingId(null)
                              setReason("")
                            }}
                            className="rounded-panel border border-neutral-border px-4 py-2 text-sm font-medium text-text-charcoal hover:bg-neutral-surface"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          disabled={busy === n.user_id}
                          onClick={() => verify(n.user_id)}
                          className="rounded-panel bg-verify-green px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                        >
                          Verify
                        </button>
                        <button
                          type="button"
                          onClick={() => setRejectingId(n.user_id)}
                          className="rounded-panel border border-neutral-border px-4 py-2 text-sm font-semibold text-text-charcoal hover:bg-neutral-surface"
                        >
                          Reject
                        </button>
                      </div>
                    )
                  ) : null}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  mono,
  href,
}: {
  label: string
  value: string
  mono?: boolean
  href?: string
}) {
  return (
    <div className="flex justify-between gap-3 border-b border-neutral-border py-1.5 last:border-0">
      <dt className="text-sm text-text-muted">{label}</dt>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium text-brand-red hover:underline"
        >
          {value}
        </a>
      ) : (
        <dd className={cn("text-sm font-medium text-text-charcoal", mono && "font-mono")}>
          {value}
        </dd>
      )}
    </div>
  )
}
