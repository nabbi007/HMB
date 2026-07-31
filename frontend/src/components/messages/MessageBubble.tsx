import { cn } from "@/lib/utils"
import type { ChatMessage } from "@/lib/messages-data"

export function MessageBubble({
  message,
  avatarUrl,
  avatarAlt,
}: {
  message: ChatMessage
  avatarUrl: string
  avatarAlt: string
}) {
  const isMe = message.sender === "me"

  return (
    <div className={cn("flex items-end gap-2", isMe && "flex-row-reverse")}>
      {!isMe ? (
        <img src={avatarUrl} alt={avatarAlt} className="size-7 shrink-0 rounded-full object-cover" />
      ) : null}
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
          isMe
            ? "rounded-br-sm bg-brand-red text-white"
            : "rounded-bl-sm bg-neutral-surface text-text-charcoal"
        )}
      >
        <p className="whitespace-pre-wrap">{message.text}</p>
        <p className={cn("mt-1 text-[10px]", isMe ? "text-white/70" : "text-text-muted")}>{message.sentAt}</p>
      </div>
    </div>
  )
}
