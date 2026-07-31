import { useState } from "react"
import { Link } from "react-router-dom"
import { BackIcon, SendIcon } from "@/lib/icons"
import { getCaregiver } from "@/lib/mock-data"
import { getConversation, type ChatMessage } from "@/lib/messages-data"
import { MessageBubble } from "./MessageBubble"

export function ChatThread({ caregiverId }: { caregiverId: string }) {
  const caregiver = getCaregiver(caregiverId)
  const [messages, setMessages] = useState<ChatMessage[]>(() => getConversation(caregiverId)?.messages ?? [])
  const [draft, setDraft] = useState("")

  if (!caregiver) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-text-muted">
        Conversation not found.
      </div>
    )
  }

  function sendMessage() {
    const text = draft.trim()
    if (!text) return
    setMessages((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, sender: "me", text, sentAt: "Just now" },
    ])
    setDraft("")
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b border-neutral-border bg-background-white px-4 py-3 md:px-6">
        <Link to="/messages" aria-label="Back to messages" className="text-text-muted hover:text-text-charcoal md:hidden">
          <BackIcon className="size-5" />
        </Link>
        <img src={caregiver.avatarUrl} alt={caregiver.name} className="size-9 rounded-full object-cover" />
        <Link to={`/caregivers/${caregiver.id}`} className="min-w-0">
          <p className="truncate font-semibold text-text-charcoal hover:underline">{caregiver.name}</p>
          <p className="truncate text-xs text-text-muted">
            {caregiver.role} · {caregiver.specialty}
          </p>
        </Link>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4 md:px-6">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} avatarUrl={caregiver.avatarUrl} avatarAlt={caregiver.name} />
        ))}
      </div>

      <div className="flex shrink-0 items-center gap-2 border-t border-neutral-border bg-background-white p-3 md:p-4">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage()
          }}
          placeholder="Type a message…"
          className="w-full rounded-panel bg-neutral-surface px-4 py-2.5 text-sm text-text-charcoal placeholder:text-text-muted focus:outline-none"
        />
        <button
          type="button"
          onClick={sendMessage}
          aria-label="Send message"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-red text-white transition-colors hover:bg-brand-red-dark disabled:opacity-50"
          disabled={!draft.trim()}
        >
          <SendIcon className="size-4.5" />
        </button>
      </div>
    </div>
  )
}
