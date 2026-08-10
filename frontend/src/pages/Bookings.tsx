import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { api, mediaUrl } from "@/lib/api"
import { useRole } from "@/lib/role-context"
import { cn } from "@/lib/utils"

interface Booking {
  id: string
  status: string
  care_date: string
  start_time: string
  hours: number
  estimated_amount: number | string | null
  nurse_user_id: string
  nurse_name: string
  nurse_photo_url: string | null
  payment_status: string | null
  hmb_fee: number | string | null
  nurse_payout: number | string | null
  child_name: string | null
}

const statusStyle: Record<string, string> = {
  requested: "bg-verify-gold-bg text-verify-gold",
  accepted: "bg-verify-green-bg text-verify-green",
  confirmed: "bg-verify-green-bg text-verify-green",
  completed: "bg-verify-green-bg text-verify-green",
  declined: "bg-neutral-surface text-text-muted",
  cancelled: "bg-neutral-surface text-text-muted",
}

const statusLabel: Record<string, string> = {
  confirmed: "paid",
}

function initials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?"
}

export default function Bookings() {
  const navigate = useNavigate()
  const { token } = useRole()
  const [items, setItems] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(() => {
    if (!token) return
    setLoading(true)
    api<Booking[]>("/api/v1/bookings", { token })
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  async function cancel(id: string) {
    setBusy(id)
    try {
      await api(`/api/v1/bookings/${id}/cancel`, { method: "POST", token: token ?? undefined })
      load()
    } finally {
      setBusy(null)
    }
  }

  async function pay(id: string) {
    setBusy(id)
    try {
      await api(`/api/v1/bookings/${id}/pay`, { method: "POST", token: token ?? undefined })
      load()
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-background-offwhite">
      <div className="mx-auto max-w-3xl px-6 py-8 md:px-10 md:py-10">
        <h1 className="text-xl font-bold text-text-charcoal md:text-2xl">Bookings</h1>

        <div className="mt-6 flex flex-col gap-3">
          {loading ? (
            <p className="text-sm text-text-muted">Loading…</p>
          ) : items.length === 0 ? (
            <p className="rounded-2xl bg-neutral-surface p-4 text-sm text-text-muted">
              No bookings yet — find a caregiver and send a request.
            </p>
          ) : (
            items.map((b) => {
              const photo = mediaUrl(b.nurse_photo_url)
              return (
                <div key={b.id} className="rounded-card bg-background-white p-4">
                  <div className="flex items-center gap-3.5">
                    {photo ? (
                      <img
                        src={photo}
                        alt={b.nurse_name}
                        className="size-12 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-red font-bold text-white">
                        {initials(b.nurse_name)}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-text-charcoal">{b.nurse_name}</p>
                      <p className="text-sm text-text-muted">
                        {b.care_date} · {b.start_time} · {b.hours}h
                        {b.estimated_amount != null ? ` · GHS ${Number(b.estimated_amount)}` : ""}
                      </p>
                      {b.child_name ? (
                        <p className="text-sm text-text-muted">For {b.child_name}</p>
                      ) : null}
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-[10px] px-2.5 py-1 text-xs font-medium capitalize",
                        statusStyle[b.status] ?? "bg-neutral-surface text-text-muted"
                      )}
                    >
                      {statusLabel[b.status] ?? b.status}
                    </span>
                  </div>
                  {b.status === "confirmed" && b.hmb_fee != null ? (
                    <p className="mt-2 text-xs text-text-muted">
                      Paid · held securely until the visit is complete
                    </p>
                  ) : null}
                  <div className="mt-3 flex gap-4">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/messages/${b.nurse_user_id}`, { state: { name: b.nurse_name } })
                      }
                      className="text-sm font-medium text-text-charcoal hover:underline"
                    >
                      Message
                    </button>
                    {b.status === "accepted" ? (
                      <button
                        type="button"
                        onClick={() => pay(b.id)}
                        disabled={busy === b.id}
                        className="text-sm font-semibold text-verify-green hover:underline disabled:opacity-50"
                      >
                        {busy === b.id
                          ? "Processing…"
                          : `Pay${b.estimated_amount != null ? ` GHS ${Number(b.estimated_amount)}` : ""}`}
                      </button>
                    ) : null}
                    {b.status === "requested" ||
                    b.status === "accepted" ||
                    b.status === "confirmed" ? (
                      <button
                        type="button"
                        onClick={() => cancel(b.id)}
                        disabled={busy === b.id}
                        className="text-sm font-medium text-brand-red hover:underline disabled:opacity-50"
                      >
                        {b.status === "confirmed" ? "Cancel & refund" : "Cancel booking"}
                      </button>
                    ) : null}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
