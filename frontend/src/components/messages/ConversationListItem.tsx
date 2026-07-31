import { NavLink } from "react-router-dom"
import { cn } from "@/lib/utils"
import { getCaregiver } from "@/lib/mock-data"
import type { Conversation } from "@/lib/messages-data"

const tierRing = {
  green: "ring-verify-green",
  gold: "ring-verify-gold",
} as const

export function ConversationListItem({ conversation }: { conversation: Conversation }) {
  const caregiver = getCaregiver(conversation.caregiverId)
  if (!caregiver) return null

  const lastMessage = conversation.messages[conversation.messages.length - 1]

  return (
    <NavLink
      to={`/messages/${caregiver.id}`}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-xl p-3 transition-colors",
          isActive ? "bg-brand-red-tint" : "hover:bg-neutral-surface"
        )
      }
    >
      <img
        src={caregiver.avatarUrl}
        alt={caregiver.name}
        className={cn(
          "size-11 shrink-0 rounded-full object-cover ring-2 ring-offset-2 ring-offset-background-white",
          tierRing[caregiver.verificationTier]
        )}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-semibold text-text-charcoal">{caregiver.name}</span>
          <span className="shrink-0 text-xs text-text-muted">{lastMessage?.sentAt}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm text-text-muted">{lastMessage?.text}</span>
          {conversation.unreadCount > 0 ? (
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-red text-[10px] font-bold text-white">
              {conversation.unreadCount}
            </span>
          ) : null}
        </div>
      </div>
    </NavLink>
  )
}
