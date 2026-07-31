import { useParams } from "react-router-dom"
import { cn } from "@/lib/utils"
import { ChatThread } from "@/components/messages/ChatThread"
import { ConversationListItem } from "@/components/messages/ConversationListItem"
import { conversations } from "@/lib/messages-data"

export default function Chat() {
  const { id } = useParams()

  return (
    <div className="flex h-full">
      {/* Conversation list — full width on mobile until a thread is opened, a fixed
          side column on desktop where both list and thread show at once. */}
      <div
        className={cn(
          "w-full shrink-0 overflow-y-auto border-r border-neutral-border bg-background-white md:block md:w-[340px]",
          id && "hidden md:block"
        )}
      >
        <h1 className="p-5 pb-3 text-xl font-bold text-text-charcoal">Messages</h1>
        <div className="flex flex-col gap-1 px-3 pb-3">
          {conversations.map((conversation) => (
            <ConversationListItem key={conversation.caregiverId} conversation={conversation} />
          ))}
        </div>
      </div>

      <div className={cn("min-w-0 flex-1 flex-col", id ? "flex" : "hidden md:flex")}>
        {id ? (
          <ChatThread key={id} caregiverId={id} />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-text-muted">
            Select a conversation to start chatting.
          </div>
        )}
      </div>
    </div>
  )
}
