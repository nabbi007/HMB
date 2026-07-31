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

export const conversations: Conversation[] = [
  {
    caregiverId: "zainab-iddrisu",
    unreadCount: 2,
    messages: [
      { id: "m1", sender: "them", text: "Hi! I'm all set for tonight's shift.", sentAt: "6:12 PM" },
      { id: "m2", sender: "me", text: "Great, thank you! She usually feeds around 2am.", sentAt: "6:15 PM" },
      { id: "m3", sender: "them", text: "Noted, I'll keep an eye on the time.", sentAt: "6:16 PM" },
      { id: "m4", sender: "them", text: "I've arrived and settled in. All good here.", sentAt: "8:05 PM" },
    ],
  },
  {
    caregiverId: "ama-boateng",
    unreadCount: 1,
    messages: [
      { id: "m1", sender: "me", text: "Hi Ama, looking forward to Saturday!", sentAt: "Yesterday" },
      { id: "m2", sender: "them", text: "Me too! Just to confirm — 9am to 5pm at your place?", sentAt: "Yesterday" },
      { id: "m3", sender: "me", text: "Yes exactly, I'll leave the spare key with the doorman.", sentAt: "Yesterday" },
      { id: "m4", sender: "them", text: "Perfect, see you then 😊", sentAt: "9:41 AM" },
    ],
  },
  {
    caregiverId: "abena-asante",
    unreadCount: 0,
    messages: [
      { id: "m1", sender: "them", text: "Hi! Happy to help with lactation support Monday.", sentAt: "Mon" },
      { id: "m2", sender: "me", text: "Thank you, really appreciate it.", sentAt: "Mon" },
    ],
  },
  {
    caregiverId: "efua-mensah",
    unreadCount: 0,
    messages: [
      { id: "m1", sender: "me", text: "Thanks again for last week, she loved you!", sentAt: "16 Jul" },
      { id: "m2", sender: "them", text: "Aww she's a joy to look after. Anytime!", sentAt: "16 Jul" },
    ],
  },
]

export function getConversation(caregiverId: string) {
  return conversations.find((c) => c.caregiverId === caregiverId)
}
