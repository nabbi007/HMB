import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import { CalendarIcon, MessageIcon, NotificationIcon, VerifiedIcon } from "@/lib/icons"
import {
  notifications as initialNotifications,
  type AppNotification,
  type NotificationType,
} from "@/lib/notifications-data"

const typeIcon: Record<NotificationType, typeof NotificationIcon> = {
  booking: CalendarIcon,
  message: MessageIcon,
  verification: VerifiedIcon,
}

const typeColor: Record<NotificationType, string> = {
  booking: "bg-verify-gold-bg text-verify-gold",
  message: "bg-brand-red-tint text-brand-red",
  verification: "bg-verify-green-bg text-verify-green",
}

export function NotificationsPopover({
  buttonClassName,
  panelClassName,
}: {
  buttonClassName: string
  panelClassName: string
}) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<AppNotification[]>(initialNotifications)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  const unreadCount = items.filter((n) => !n.read).length

  function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  function openNotification(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        aria-expanded={open}
        className={cn("relative", buttonClassName)}
      >
        <NotificationIcon />
        {unreadCount > 0 ? (
          <span className="absolute top-1 right-1 flex size-[15px] items-center justify-center rounded-full bg-brand-red text-[9px] font-bold text-white">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className={cn(
            "absolute z-30 flex w-[min(340px,calc(100vw-2rem))] flex-col rounded-card border border-neutral-border bg-background-white shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16)]",
            panelClassName
          )}
        >
          <div className="flex items-center justify-between border-b border-neutral-border px-4 py-3">
            <p className="font-semibold text-text-charcoal">Notifications</p>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-medium text-brand-red hover:underline"
              >
                Mark all as read
              </button>
            ) : null}
          </div>

          <div className="flex max-h-[360px] flex-col gap-1 overflow-y-auto p-2">
            {items.map((n) => {
              const Icon = typeIcon[n.type]
              return (
                <Link
                  key={n.id}
                  to={n.to}
                  onClick={() => openNotification(n.id)}
                  className={cn(
                    "flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-neutral-surface",
                    !n.read && "bg-brand-red-tint/50"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full",
                      typeColor[n.type]
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-text-charcoal">{n.title}</span>
                      {!n.read ? <span className="size-1.5 shrink-0 rounded-full bg-brand-red" /> : null}
                    </span>
                    <span className="line-clamp-2 text-sm text-text-muted">{n.body}</span>
                    <span className="mt-0.5 block text-xs text-text-muted">{n.timeAgo}</span>
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
