"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useTheme } from "next-themes"
import { type AIMood, getPersonaResponse } from "@/lib/ai-moods"
import { ChatFeaturesModal } from "@/components/modals/chat-features-modal"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { ArrowUpRight, CornerDownLeft, History, MessageSquare } from "lucide-react"
import Link from "next/link"
import { SectionHeader } from "@/components/sections/section-header"
import { DigitalNino } from "@/components/digital-nino"
import { ChatMessage } from "@/components/ai-chat/chat-message"
import { ChatHistoryPanel } from "@/components/ai-chat/chat-history-panel"
import {
  addSession,
  createMessage,
  createSession,
  deriveTitle,
  getActiveSession,
  loadChatState,
  NEW_SESSION_TITLE,
  removeSession,
  saveChatState,
  updateSession,
  type ChatSession,
  type ChatState,
  type StoredMessage,
} from "@/lib/chat-store"

const WELCOME = "Hey, I am Niño's digital twin. Ask me anything about my work, projects, or experience."

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

const REQUEST_TIMEOUT_MS = 30_000

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export default function AiChatSection() {
  const { resolvedTheme } = useTheme()
  const robotTheme: "dark" | "light" = resolvedTheme === "light" ? "light" : "dark"

  const [chatOpen, setChatOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Conversations live in local storage, so a reload keeps every session,
  // every prompt, and the draft that was still being typed.
  const [state, setState] = useState<ChatState | null>(null)
  const stateRef = useRef<ChatState | null>(null)
  const restoredSessions = useRef<Set<string>>(new Set())

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [companionDialogue, setCompanionDialogue] = useState("I'm Digital Niño, how can I help?")
  const afterReplyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevLoadingRef = useRef(false)
  const hasReactedToTyping = useRef(false)

  const [triggerDialogue, setTriggerDialogue] = useState(IDLE_DIALOGUES[0])
  useEffect(() => {
    const t = setInterval(() => setTriggerDialogue(pick(IDLE_DIALOGUES)), 4000)
    return () => clearInterval(t)
  }, [])

  // Hydrate after mount so the server and client markup match.
  useEffect(() => {
    setState(loadChatState())
  }, [])

  // Persist on a short debounce; streaming updates collapse into one write.
  useEffect(() => {
    stateRef.current = state
    if (!state) return
    const t = setTimeout(() => saveChatState(state), 300)
    return () => clearTimeout(t)
  }, [state])

  // Flush anything still pending when the tab goes away.
  useEffect(() => {
    const flush = () => {
      if (stateRef.current) saveChatState(stateRef.current)
    }
    window.addEventListener("pagehide", flush)
    return () => {
      window.removeEventListener("pagehide", flush)
      flush()
    }
  }, [])

  const activeSession = state ? getActiveSession(state) : null
  const sessionId = activeSession?.id ?? ""
  const messages: StoredMessage[] = activeSession?.messages ?? []
  const input = activeSession?.draft ?? ""
  const currentMood: AIMood = activeSession?.mood === "genz" ? "genz" : "professional"

  const mutateSession = useCallback((id: string, change: (session: ChatSession) => ChatSession) => {
    setState((prev) => (prev ? updateSession(prev, id, change) : prev))
  }, [])

  const setDraft = useCallback(
    (value: string) => {
      if (!sessionId) return
      mutateSession(sessionId, (session) => ({ ...session, draft: value }))
    },
    [mutateSession, sessionId]
  )

  // Track the thread by length and by the tail content so streaming keeps the
  // view pinned to the bottom without re-running on every render.
  const messageCount = messages.length
  const lastMessage = messages[messageCount - 1]
  const lastContent = lastMessage?.content ?? ""

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messageCount, lastContent])

  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`
  }, [])

  // Restore the textarea height for a persisted draft when the chat reopens.
  useEffect(() => {
    if (chatOpen) requestAnimationFrame(resizeTextarea)
  }, [chatOpen, sessionId, resizeTextarea])

  useEffect(() => {
    if (isLoading) return
    if (input.trim().length > 3 && !hasReactedToTyping.current) {
      hasReactedToTyping.current = true
      setCompanionDialogue("Good question, let me think.")
    }
    if (input.trim().length === 0) hasReactedToTyping.current = false
  }, [input, isLoading])

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

  /**
   * A session that is empty locally may still exist on the server (Redis keeps
   * an hour of history), so pull it once before showing an empty thread.
   */
  const restoreFromServer = useCallback(async () => {
    if (!sessionId || messages.length > 0 || restoredSessions.current.has(sessionId)) return
    restoredSessions.current.add(sessionId)

    try {
      const res = await fetch("/api/chat/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })
      if (!res.ok) return

      const data = await res.json()
      if (!Array.isArray(data.messages) || data.messages.length === 0) return

      const restored: StoredMessage[] = data.messages.map((m: { role: "user" | "assistant"; content: string }) =>
        createMessage(m.role, m.content)
      )
      const firstPrompt = restored.find((m) => m.role === "user")?.content ?? ""

      mutateSession(sessionId, (session) => ({
        ...session,
        title: session.title === NEW_SESSION_TITLE ? deriveTitle(firstPrompt) : session.title,
        messages: restored,
        updatedAt: Date.now(),
      }))
      setCompanionDialogue("Picked up where we left off.")
    } catch {
      // Offline or server down: the local thread is still authoritative.
    }
  }, [messages.length, mutateSession, sessionId])

  useEffect(() => {
    if (chatOpen) restoreFromServer()
  }, [chatOpen, restoreFromServer])

  const handleNewSession = useCallback(() => {
    setState((prev) => (prev ? addSession(prev, createSession(currentMood)) : prev))
    setHistoryOpen(false)
    setCompanionDialogue("Fresh start. What do you want to know?")
  }, [currentMood])

  const handleSelectSession = useCallback((id: string) => {
    setState((prev) => (prev ? { ...prev, activeSessionId: id } : prev))
    setHistoryOpen(false)
  }, [])

  const handleDeleteSession = useCallback((id: string) => {
    setState((prev) => (prev ? removeSession(prev, id) : prev))
    // Drop the server-side context for that session too.
    fetch("/api/chat/clear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: id }),
    }).catch(() => {})
  }, [])

  const setMood = useCallback(
    (mood: AIMood) => {
      if (!sessionId) return
      mutateSession(sessionId, (session) => ({ ...session, mood }))
    },
    [mutateSession, sessionId]
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraft(e.target.value)
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
    if (!activeSession || !input.trim() || isLoading) return

    const submissionMood = currentMood
    const activeId = activeSession.id
    const prompt = input.trim()
    const history = [
      ...activeSession.messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: prompt },
    ]

    const userMessage = createMessage("user", prompt)
    const replyMessage = createMessage("assistant", "")

    mutateSession(activeId, (session) => ({
      ...session,
      title: session.title === NEW_SESSION_TITLE ? deriveTitle(prompt) : session.title,
      draft: "",
      messages: [...session.messages, userMessage, replyMessage],
      updatedAt: Date.now(),
    }))

    if (textareaRef.current) textareaRef.current.style.height = "auto"
    setIsLoading(true)

    const setReply = (content: string) =>
      mutateSession(activeId, (session) => ({
        ...session,
        messages: session.messages.map((m) => (m.id === replyMessage.id ? { ...m, content } : m)),
        updatedAt: Date.now(),
      }))

    const controller = new AbortController()
    const abortTimeout = setTimeout(() => {
      controller.abort()
      setReply(getPersonaResponse("error", submissionMood))
      setIsLoading(false)
    }, REQUEST_TIMEOUT_MS)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          mood: submissionMood,
          sessionId: activeId,
        }),
        signal: controller.signal,
      })

      clearTimeout(abortTimeout)

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        setReply(
          errorData?.message ||
            (response.status === 400
              ? "Please ask about my background, skills, or projects."
              : `Request failed (${response.status}). Please try again in a moment.`)
        )
        setIsLoading(false)
        return
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error("No reader")

      const decoder = new TextDecoder()
      let streamedContent = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        streamedContent += decoder.decode(value, { stream: true })
        setReply(streamedContent)
      }
    } catch (err) {
      clearTimeout(abortTimeout)
      if ((err as Error).name !== "AbortError") setReply(getPersonaResponse("error", submissionMood))
    } finally {
      setIsLoading(false)
    }
  }

  const isAwaitingReply = isLoading && lastMessage?.role === "assistant" && lastMessage.content === ""
  const showSuggestions = messageCount === 0 && !isLoading

  return (
    <section id="ai-chat" className="scroll-mt-16 py-14 md:py-20 border-t border-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10">
        <SectionHeader index="01" title="AI Digital Twin" />

        <div className="max-w-3xl">
          {/* Trigger card */}
          <button
            onClick={() => setChatOpen(true)}
            className="w-full nm-panel nm-hover relative overflow-hidden text-center p-8 group"
          >
            <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none" />
            <div className="relative flex flex-col items-center gap-3">
              <div className="flex flex-col items-center pointer-events-none">
                <div className="relative mb-1">
                  <div className="bg-background/60 border border-border rounded-sm px-4 py-2 text-sm text-muted-foreground backdrop-blur-sm font-ntype">
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
          <div className="flex flex-wrap gap-3 mt-6">
            <ChatFeaturesModal />
            <Link href="/docs" className="nm-link nm-hover">
              How I built it <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Chat modal */}
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="w-[calc(100vw-1.5rem)] sm:w-full max-w-3xl h-[42rem] max-h-[calc(100dvh-3rem)] p-0 overflow-hidden gap-0 border border-border rounded-sm flex flex-col">
          <DialogTitle className="sr-only">Niño&apos;s AI Digital Twin Chat</DialogTitle>
          <DialogDescription className="sr-only">
            Chat with Digital Niño about work, projects, skills, and experience.
          </DialogDescription>

          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border pr-12 shrink-0">
            <span className="nm-led nm-led-blink" />
            <span className="text-sm font-medium">Digital Niño</span>
            <span className="nm-label-sm truncate hidden sm:block flex-1 min-w-0">
              {activeSession?.title ?? NEW_SESSION_TITLE}
            </span>
            <button
              type="button"
              onClick={() => setHistoryOpen((value) => !value)}
              aria-pressed={historyOpen}
              className={`ml-auto sm:ml-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border transition-colors nm-label-sm ${
                historyOpen ? "border-border bg-secondary text-foreground" : "border-border hover:border-foreground"
              }`}
            >
              <History className="w-3.5 h-3.5" /> History
            </button>
          </div>

          <div className="flex-1 min-h-0 flex">
            {/* Saved sessions */}
            {historyOpen && state && (
              <div className="w-full sm:w-60 sm:shrink-0 border-r border-border min-h-0">
                <ChatHistoryPanel
                  sessions={state.sessions}
                  activeSessionId={state.activeSessionId}
                  onSelect={handleSelectSession}
                  onCreate={handleNewSession}
                  onDelete={handleDeleteSession}
                />
              </div>
            )}

            {/* Thread */}
            <div className={`flex-1 min-w-0 min-h-0 flex-col ${historyOpen ? "hidden sm:flex" : "flex"}`}>
              <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-background">
                <ChatMessage role="assistant" content={WELCOME} />
                {messages.map((message, index) => (
                  <ChatMessage
                    key={message.id}
                    role={message.role}
                    content={message.content}
                    pending={isAwaitingReply && index === messageCount - 1}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>

              {showSuggestions && (
                <div className="px-4 py-3 border-t border-border flex flex-wrap gap-2 shrink-0">
                  {SUGGESTED.map((q) => (
                    <button
                      key={q}
                      onClick={() => {
                        setDraft(q)
                        requestAnimationFrame(resizeTextarea)
                        textareaRef.current?.focus()
                      }}
                      className="text-xs border border-border rounded-sm px-3 py-1.5 hover:border-foreground hover:bg-secondary transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Companion status line */}
              <div className="flex items-center gap-2 px-4 pt-3 border-t border-border shrink-0">
                <div className="shrink-0 -my-3">
                  <DigitalNino size={26} mood="normal" isTalking={isLoading} theme={robotTheme} />
                </div>
                <span className="text-xs text-muted-foreground truncate">
                  {isLoading ? "Thinking..." : companionDialogue}
                </span>
              </div>

              {/* Mood + input */}
              <div className="px-3 pb-3 pt-2 shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="nm-label-sm">
                    {currentMood === "professional" ? "Professional" : "Casual"} voice
                  </span>
                  <button
                    type="button"
                    onClick={() => setMood(currentMood === "professional" ? "genz" : "professional")}
                    className="nm-label-sm border border-border rounded-sm px-2.5 py-1 hover:border-foreground transition-colors"
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
                    placeholder="Ask me anything..."
                    rows={1}
                    disabled={isLoading || !activeSession}
                    className="flex-1 resize-none max-h-32 overflow-y-auto px-3.5 py-2.5 rounded-sm border border-border bg-background text-sm leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    aria-label="Send message"
                    className="h-10 w-10 shrink-0 rounded-sm bg-foreground text-background inline-flex items-center justify-center hover:bg-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <CornerDownLeft className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}
