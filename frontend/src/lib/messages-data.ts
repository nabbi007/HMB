export interface ChatMessage {
  id: string
  sender: "me" | "them"
  text: string
  sentAt: string
}

export interface Conversation {
  caregiverId: string
  unreadCount: number
  messages: ChatMessage[]
}

// Cleared: messaging will come from the backend once built (post-MVP).
export const conversations: Conversation[] = []

export function getConversation(caregiverId: string) {
  return conversations.find((c) => c.caregiverId === caregiverId)
}
