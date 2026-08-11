import { useCallback, useEffect, useRef, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { SendIcon } from "@/lib/icons"
import { api, mediaUrl } from "@/lib/api"
import { useRole } from "@/lib/role-context"
import { useUnread } from "@/lib/unread-context"
import { cn } from "@/lib/utils"

interface Conversation {
  other_user_id: string
  other_name: string
  other_photo_url: string | null
  last_message: string
  last_at: string
  unread_count: number
}

interface Msg {
  id: string
  sender_user_id: string
  recipient_user_id: string
  body: string
  created_at: string
}

function initials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?"
}

function Avatar({ name, photo, size }: { name: string; photo: string | null; size: string }) {
  const url = mediaUrl(photo)
  return url ? (
    <img src={url} alt={name} className={cn("rounded-full object-cover", size)} />
  ) : (
    <span className={cn("flex items-center justify-center rounded-full bg-brand-red font-bold text-white", size)}>
      {initials(name)}
    </span>
  )
}

export default function Chat() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token, user } = useRole()
  const { refreshUnread } = useUnread()
  const headerNameFromNav = (useLocation().state as { name?: string } | null)?.name

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Msg[]>([])
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  const loadConversations = useCallback(() => {
    if (!token) return
    api<Conversation[]>("/api/v1/conversations", { token })
      .then(setConversations)
      .catch(() => {})
  }, [token])

  const loadThread = useCallback(() => {
    if (!token || !id) return
    api<Msg[]>(`/api/v1/conversations/${id}/messages`, { token })
      .then((msgs) => {
        setMessages(msgs)
        // Fetching a thread marks its messages read server-side — sync the nav badge.
        refreshUnread()
      })
      .catch(() => {})
  }, [token, id, refreshUnread])

  // Poll so replies show up without a manual refresh.
  useEffect(() => {
    loadConversations()
    const t = setInterval(loadConversations, 5000)
    return () => clearInterval(t)
  }, [loadConversations])

  useEffect(() => {
    setMessages([])
    if (!id) return
    loadThread()
    const t = setInterval(loadThread, 4000)
    return () => clearInterval(t)
  }, [id, loadThread])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.trim() || !id) return
    setError(null)
    setSending(true)
    try {
      await api(`/api/v1/conversations/${id}/messages`, {
        method: "POST",
        body: { body: draft.trim() },
        token: token ?? undefined,
      })
      setDraft("")
      loadThread()
      loadConversations()
    } catch {
      setError("Couldn't send. You can only message someone you have a booking with.")
    } finally {
      setSending(false)
    }
  }

  const headerName =
    headerNameFromNav ??
    conversations.find((c) => c.other_user_id === id)?.other_name ??
    "Conversation"

  // Show the person you just opened a chat with in the left list right away,
  // even before any message is exchanged (so it doesn't read "No conversations yet").
  const shownConversations =
    id && !conversations.some((c) => c.other_user_id === id)
      ? [
          {
            other_user_id: id,
            other_name: headerName,
            other_photo_url: null,
            last_message: "",
            last_at: "",
            unread_count: 0,
          },
          ...conversations,
        ]
      : conversations

  return (
    <div className="flex h-full">
      {/* Conversation list */}
      <div
        className={cn(
          "w-full shrink-0 overflow-y-auto border-r border-neutral-border bg-background-white md:block md:w-[340px]",
          id && "hidden md:block"
        )}
      >
        <h1 className="p-5 pb-3 text-xl font-bold text-text-charcoal">Messages</h1>
        <div className="flex flex-col gap-1 px-3 pb-3">
          {shownConversations.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-text-muted">No conversations yet.</p>
          ) : (
            shownConversations.map((c) => (
              <button
                key={c.other_user_id}
                type="button"
                onClick={() => navigate(`/messages/${c.other_user_id}`, { state: { name: c.other_name } })}
                className={cn(
                  "flex items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-neutral-surface",
                  id === c.other_user_id && "bg-neutral-surface"
                )}
              >
                <Avatar name={c.other_name} photo={c.other_photo_url} size="size-11 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-text-charcoal">{c.other_name}</p>
                  <p className="truncate text-sm text-text-muted">
                    {c.last_message || "No messages yet"}
                  </p>
                </div>
                {c.unread_count > 0 ? (
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-red text-[10px] font-bold text-white">
                    {c.unread_count}
                  </span>
                ) : null}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Thread */}
      <div className={cn("min-w-0 flex-1 flex-col", id ? "flex" : "hidden md:flex")}>
        {id ? (
          <>
            <div className="flex items-center gap-3 border-b border-neutral-border bg-background-white px-5 py-3">
              <button
                type="button"
                onClick={() => navigate("/messages")}
                className="text-sm text-text-muted hover:text-text-charcoal md:hidden"
              >
                ‹ Back
              </button>
              <p className="font-semibold text-text-charcoal">{headerName}</p>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto bg-background-offwhite p-5">
              {messages.length === 0 ? (
                <p className="text-center text-sm text-text-muted">
                  No messages yet — say hello.
                </p>
              ) : (
                messages.map((m) => {
                  const mine = m.sender_user_id === user?.id
                  return (
                    <div
                      key={m.id}
                      className={cn(
                        "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                        mine
                          ? "self-end bg-brand-red text-white"
                          : "self-start bg-background-white text-text-charcoal"
                      )}
                    >
                      {m.body}
                    </div>
                  )
                })
              )}
              <div ref={endRef} />
            </div>

            {error ? (
              <p className="bg-brand-red-tint px-5 py-2 text-xs text-brand-red">{error}</p>
            ) : null}
            <form onSubmit={send} className="flex items-center gap-2 border-t border-neutral-border bg-background-white p-3">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a message…"
                className="min-w-0 flex-1 rounded-panel border border-neutral-border bg-neutral-surface px-3 py-2.5 text-sm text-text-charcoal placeholder:text-text-muted focus:border-brand-red focus:ring-brand-red focus:outline-none"
              />
              <button
                type="submit"
                disabled={sending || !draft.trim()}
                aria-label="Send"
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-red text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <SendIcon className="size-4.5" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-text-muted">
            Select a conversation to start chatting.
          </div>
        )}
      </div>
    </div>
  )
}
