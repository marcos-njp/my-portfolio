"use client"

import { Plus, Trash2 } from "lucide-react"
import { formatTimestamp, type ChatSession } from "@/lib/chat-store"

interface ChatHistoryPanelProps {
  sessions: ChatSession[]
  activeSessionId: string
  onSelect: (sessionId: string) => void
  onCreate: () => void
  onDelete: (sessionId: string) => void
}

/** Saved conversations, restored from local storage on every visit. */
export function ChatHistoryPanel({
  sessions,
  activeSessionId,
  onSelect,
  onCreate,
  onDelete,
}: ChatHistoryPanelProps) {
  const saved = sessions.filter((session) => session.messages.length > 0 || session.id === activeSessionId)

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="px-3 py-3 border-b border-border">
        <button
          type="button"
          onClick={onCreate}
          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-sm border border-border hover:border-foreground transition-colors nm-label text-foreground"
        >
          <Plus className="w-3.5 h-3.5" /> New chat
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
        <p className="nm-label-sm px-2 py-1">Saved conversations</p>

        {saved.map((session) => {
          const isActive = session.id === activeSessionId
          const preview = session.messages.find((message) => message.role === "user")?.content

          return (
            <div
              key={session.id}
              className={`group flex items-start gap-2 rounded-sm border px-2.5 py-2 transition-colors ${
                isActive
                  ? "border-border bg-secondary"
                  : "border-transparent hover:border-border hover:bg-secondary/60"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(session.id)}
                className="flex-1 min-w-0 text-left"
              >
                <p className={`text-sm truncate ${isActive ? "text-foreground" : "text-foreground/80"}`}>
                  {session.title}
                </p>
                <p className="nm-label-sm truncate mt-0.5">
                  {session.messages.length > 0
                    ? `${session.messages.length} messages, ${formatTimestamp(session.updatedAt)}`
                    : preview ?? "No messages yet"}
                </p>
              </button>

              <button
                type="button"
                onClick={() => onDelete(session.id)}
                aria-label={`Delete conversation ${session.title}`}
                className="shrink-0 mt-0.5 p-1 text-muted-foreground opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-primary transition-opacity"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
      </div>

      <p className="nm-label-sm px-4 py-3 border-t border-border">
        Saved on this device. They stay after a reload.
      </p>
    </div>
  )
}
