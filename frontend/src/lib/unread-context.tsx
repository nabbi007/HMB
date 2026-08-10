import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { api } from "@/lib/api"
import { useRole } from "@/lib/role-context"

interface Conversation {
  unread_count: number
}

interface UnreadContextValue {
  /** Total unread messages across all conversations. */
  unread: number
  /** Re-fetch now (e.g. right after opening a thread marks it read). */
  refreshUnread: () => void
}

const UnreadContext = createContext<UnreadContextValue>({ unread: 0, refreshUnread: () => {} })

export function UnreadProvider({ children }: { children: React.ReactNode }) {
  const { token } = useRole()
  const [unread, setUnread] = useState(0)

  const refreshUnread = useCallback(() => {
    if (!token) {
      setUnread(0)
      return
    }
    api<Conversation[]>("/api/v1/conversations", { token })
      .then((convos) => setUnread(convos.reduce((sum, c) => sum + (c.unread_count || 0), 0)))
      .catch(() => {})
  }, [token])

  // Poll so the badge stays roughly live without a manual refresh.
  useEffect(() => {
    refreshUnread()
    if (!token) return
    const t = setInterval(refreshUnread, 15000)
    return () => clearInterval(t)
  }, [token, refreshUnread])

  return (
    <UnreadContext.Provider value={{ unread, refreshUnread }}>{children}</UnreadContext.Provider>
  )
}

export function useUnread(): UnreadContextValue {
  return useContext(UnreadContext)
}
