"use client"

import type { ChatRole } from "@/lib/chat-store"

interface ChatMessageProps {
  role: ChatRole
  content: string
  /** Assistant placeholder while the first token is still in flight. */
  pending?: boolean
}

export function ChatMessage({ role, content, pending }: ChatMessageProps) {
  const isUser = role === "user"

  return (
    <div className={`flex flex-col gap-1.5 ${isUser ? "items-end" : "items-start"}`}>
      <span className="nm-label-sm px-0.5">{isUser ? "You" : "Digital Niño"}</span>
      <div
        className={`max-w-[85%] px-3.5 py-2.5 rounded-sm text-sm leading-relaxed whitespace-pre-wrap ${
          isUser ? "bg-foreground text-background" : "border border-border bg-card text-foreground"
        }`}
      >
        {pending ? (
          <span className="inline-flex gap-1 items-center py-0.5" aria-label="Thinking">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.25s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.12s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" />
          </span>
        ) : (
          content
        )}
      </div>
    </div>
  )
}
