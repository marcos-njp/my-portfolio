"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useTheme } from "next-themes"
import { type AIMood, getPersonaResponse } from "@/lib/ai-moods"
import { ChatFeaturesModal } from "@/components/modals/chat-features-modal"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { ArrowUpRight, CornerDownLeft, MessageSquare } from "lucide-react"
import Link from "next/link"
import { SectionHeader } from "@/components/sections/section-header"
import { DigitalNino } from "@/components/digital-nino"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

const WELCOME = "Hey, I'm Niño's digital twin. Ask me anything about my work, projects, or experience."

const SUGGESTED = [
  "What are you building right now?",
  "Tell me about your tech stack",
  "What competitions have you joined?",
]

const IDLE_DIALOGUES = [
  "I'm Digital Niño, how can I help?",
  "Ask me anything about Niño.",
  "Curious what he's been building?",
  "I can walk you through his stack.",
  "Wanna know about his experience?",
  "Go ahead, start a conversation.",
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export default function AiChatSection() {
  const { resolvedTheme } = useTheme()
  const robotTheme: "dark" | "light" = resolvedTheme === "light" ? "light" : "dark"

  const [chatOpen, setChatOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([{ id: "welcome", role: "assistant", content: WELCOME }])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentMood, setCurrentMood] = useState<AIMood>("professional")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Idle dialogue for the companion (when NOT loading; "Thinking…" is derived from isLoading)
  const [companionDialogue, setCompanionDialogue] = useState("I'm Digital Niño, how can I help?")
  const afterReplyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevLoadingRef = useRef(false)
  const hasReactedToTyping = useRef(false)

  // Trigger-card idle dialogue cycles
  const [triggerDialogue, setTriggerDialogue] = useState(IDLE_DIALOGUES[0])
  useEffect(() => {
    const t = setInterval(() => setTriggerDialogue(pick(IDLE_DIALOGUES)), 4000)
    return () => clearInterval(t)
  }, [])

  const [sessionId] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("ai_chat_session_id")
      if (stored) return stored
    }
    const newId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`
    if (typeof window !== "undefined") localStorage.setItem("ai_chat_session_id", newId)
    return newId
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`
  }, [])

  // Light reaction while typing a question (not per keystroke)
  useEffect(() => {
    if (isLoading) return
    if (input.trim().length > 3 && !hasReactedToTyping.current) {
      hasReactedToTyping.current = true
      setCompanionDialogue("Good question, let me think.")
    }
    if (input.trim().length === 0) hasReactedToTyping.current = false
  }, [input, isLoading])

  // When a reply finishes, acknowledge then return to idle
  useEffect(() => {
    const wasLoading = prevLoadingRef.current
    prevLoadingRef.current = isLoading
    if (afterReplyTimer.current) clearTimeout(afterReplyTimer.current)

    if (isLoading) hasReactedToTyping.current = false
    if (!isLoading && wasLoading) {
      setCompanionDialogue("Hope that helps!")
      afterReplyTimer.current = setTimeout(() => setCompanionDialogue("Ask me anything else."), 4000)
    }
    return () => {
      if (afterReplyTimer.current) clearTimeout(afterReplyTimer.current)
    }
  }, [isLoading])

  useEffect(() => {
    if (chatOpen) {
      setCompanionDialogue("I'm Digital Niño, how can I help?")
      hasReactedToTyping.current = false
    }
  }, [chatOpen])

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })
      if (!res.ok) return
      const data = await res.json()
      if (Array.isArray(data.messages) && data.messages.length > 0) {
        setMessages(
          data.messages.map((m: { role: "user" | "assistant"; content: string }, i: number) => ({
            id: `hist_${i}`,
            role: m.role,
            content: m.content,
          }))
        )
        setCompanionDialogue("Loaded your previous chat.")
      } else {
        setCompanionDialogue("No past conversation yet.")
      }
    } catch {
      setCompanionDialogue("Couldn't load history.")
    }
  }, [sessionId])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    resizeTextarea()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || isLoading) return

    const submissionMood = currentMood
    const userMessage: Message = { id: Date.now().toString(), role: "user", content: input.trim() }

    setMessages((prev) => [...prev, userMessage, { id: (Date.now() + 1).toString(), role: "assistant", content: "" }])
    setInput("")
    if (textareaRef.current) textareaRef.current.style.height = "auto"
    setIsLoading(true)

    const controller = new AbortController()
    const abortTimeout = setTimeout(() => {
      controller.abort()
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { id: Date.now().toString(), role: "assistant", content: getPersonaResponse("error", submissionMood) },
      ])
      setIsLoading(false)
    }, 30000)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({ role: m.role, content: m.content })),
          mood: submissionMood,
          sessionId,
        }),
        signal: controller.signal,
      })

      clearTimeout(abortTimeout)

      if (response.status === 400) {
        const errorData = await response.json()
        setMessages((prev) => {
          const newMessages = [...prev]
          const lastMessage = newMessages[newMessages.length - 1]
          if (lastMessage.role === "assistant")
            lastMessage.content = errorData.message || "Please ask about my background, skills, or projects."
          return newMessages
        })
        setIsLoading(false)
        return
      }

      if (!response.ok) throw new Error(`API returned ${response.status}`)

      const reader = response.body?.getReader()
      if (!reader) throw new Error("No reader")

      const decoder = new TextDecoder()
      let streamedContent = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        streamedContent += chunk
        setMessages((prev) => {
          const newMessages = [...prev]
          const lastMessage = newMessages[newMessages.length - 1]
          if (lastMessage.role === "assistant") lastMessage.content = streamedContent
          return [...newMessages]
        })
      }
    } catch (err) {
      clearTimeout(abortTimeout)
      if ((err as Error).name !== "AbortError") {
        setMessages((prev) => {
          const newMessages = [...prev]
          const lastMessage = newMessages[newMessages.length - 1]
          if (lastMessage.role === "assistant") lastMessage.content = getPersonaResponse("error", submissionMood)
          return newMessages
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section id="ai-chat" className="py-14 md:py-20 border-t border-border">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader index="00" title="AI Digital Twin" subtitle="Chat with an AI trained on my background." />

        {/* Trigger card */}
        <button
          onClick={() => setChatOpen(true)}
          className="w-full nm-panel nm-hover relative overflow-hidden text-center p-8 group"
        >
          <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none" />
          <div className="relative flex flex-col items-center gap-3">
            <div className="flex flex-col items-center pointer-events-none">
              <div className="relative mb-1">
                <div className="bg-background/60 border border-border rounded-xl px-4 py-2 text-sm text-muted-foreground backdrop-blur-sm font-ntype">
                  {triggerDialogue}
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 -bottom-[7px] w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[7px] border-t-border" />
              </div>
              <DigitalNino size={84} mood="normal" isTalking={false} theme={robotTheme} />
            </div>

            <div>
              <h3 className="text-xl font-medium">Meet Digital Niño</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">Ask about my work, projects, and experience.</p>
            </div>
            <span className="nm-link nm-link-accent">
              <MessageSquare className="w-3.5 h-3.5" /> Start chat <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </button>

        {/* Action row */}
        <div className="flex flex-wrap gap-3 mt-6 justify-center">
          <ChatFeaturesModal />
          <Link href="/docs" className="nm-link nm-hover">
            How I built it <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Chat modal */}
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="w-[calc(100vw-1.5rem)] sm:w-full max-w-2xl max-h-[90vh] p-0 overflow-hidden gap-0 border border-border flex flex-col">
          <DialogTitle className="sr-only">Niño&apos;s AI Digital Twin Chat</DialogTitle>

          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border pr-12 shrink-0">
            <span className="nm-led nm-led-blink" />
            <span className="text-sm font-medium flex-1">Digital Niño</span>
            <button
              type="button"
              onClick={loadHistory}
              className="nm-label-sm hover:text-foreground transition-colors"
            >
              History
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 bg-background">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-lg text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user" ? "bg-foreground text-background" : "border border-border bg-card text-foreground"
                  }`}
                >
                  {msg.role === "assistant" && msg.content === "" ? (
                    <span className="inline-flex gap-1 items-center py-0.5" aria-label="Thinking">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.25s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.12s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" />
                    </span>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested questions */}
          {messages.length <= 2 && (
            <div className="px-4 py-3 border-t border-border flex flex-wrap gap-2 shrink-0">
              {SUGGESTED.map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setInput(q)
                    requestAnimationFrame(resizeTextarea)
                  }}
                  className="text-xs border border-border rounded-full px-3 py-1.5 hover:border-foreground hover:bg-secondary transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Companion + thoughts — just above the input, synced to loading */}
          <div className="flex items-center gap-2 px-4 pt-3 border-t border-border shrink-0">
            <div className="shrink-0 -my-3">
              <DigitalNino size={26} mood="normal" isTalking={isLoading} theme={robotTheme} />
            </div>
            <span className="text-xs text-muted-foreground truncate">
              {isLoading ? "Thinking…" : companionDialogue}
            </span>
          </div>

          {/* Mood + Input */}
          <div className="px-3 pb-3 pt-2 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="nm-label-sm">{currentMood === "professional" ? "Professional" : "Casual"} voice</span>
              <button
                type="button"
                onClick={() => setCurrentMood(currentMood === "professional" ? "genz" : "professional")}
                className="nm-label-sm border border-border rounded-full px-2.5 py-1 hover:border-foreground transition-colors"
              >
                Switch to {currentMood === "professional" ? "casual" : "professional"}
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything…"
                rows={1}
                disabled={isLoading}
                className="flex-1 resize-none max-h-32 overflow-y-auto px-3.5 py-2.5 rounded-md border border-border bg-background text-sm leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                aria-label="Send message"
                className="h-10 w-10 shrink-0 rounded-md bg-foreground text-background inline-flex items-center justify-center hover:bg-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <CornerDownLeft className="w-4 h-4" />
              </button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}
