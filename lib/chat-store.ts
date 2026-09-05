/**
 * Chat Store
 *
 * Local, durable storage for chat sessions. Redis holds the AI context window
 * (1 hour TTL, server side); this holds what the UI needs to survive a reload:
 * every session, every prompt and reply in it, the mood it was using, and the
 * unsent draft the visitor was typing.
 *
 * All reads and writes are guarded: server rendering, disabled storage and
 * quota errors degrade to an empty in-memory state instead of throwing.
 */

export type ChatRole = "user" | "assistant"

export interface StoredMessage {
  id: string
  role: ChatRole
  content: string
  createdAt: number
}

export interface ChatSession {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  mood: string
  draft: string
  messages: StoredMessage[]
}

export interface ChatState {
  version: number
  activeSessionId: string
  sessions: ChatSession[]
}

const STORAGE_KEY = "nm_chat_state_v1"
const STATE_VERSION = 1

/** Caps keep localStorage well under quota even after heavy use. */
const MAX_SESSIONS = 20
const MAX_MESSAGES_PER_SESSION = 200
const TITLE_MAX_LENGTH = 48

export const NEW_SESSION_TITLE = "New chat"

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

function randomId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
}

export function createMessage(role: ChatRole, content: string): StoredMessage {
  return { id: randomId("msg"), role, content, createdAt: Date.now() }
}

export function createSession(mood = "professional"): ChatSession {
  const now = Date.now()
  return {
    id: `session_${now}_${Math.random().toString(36).slice(2, 9)}`,
    title: NEW_SESSION_TITLE,
    createdAt: now,
    updatedAt: now,
    mood,
    draft: "",
    messages: [],
  }
}

/** First prompt becomes the session name, trimmed at a word boundary. */
export function deriveTitle(prompt: string): string {
  const clean = prompt.replace(/\s+/g, " ").trim()
  if (!clean) return NEW_SESSION_TITLE
  if (clean.length <= TITLE_MAX_LENGTH) return clean
  const cut = clean.slice(0, TITLE_MAX_LENGTH)
  const lastSpace = cut.lastIndexOf(" ")
  return `${(lastSpace > 24 ? cut.slice(0, lastSpace) : cut).trim()}...`
}

function isValidMessage(value: unknown): value is StoredMessage {
  if (!value || typeof value !== "object") return false
  const m = value as Partial<StoredMessage>
  return typeof m.id === "string" && (m.role === "user" || m.role === "assistant") && typeof m.content === "string"
}

/** Rebuilds a session from unknown JSON, filling anything missing or malformed. */
function normalizeSession(value: unknown): ChatSession | null {
  if (!value || typeof value !== "object") return null
  const s = value as Partial<ChatSession>
  if (typeof s.id !== "string" || !s.id) return null

  const messages = Array.isArray(s.messages)
    ? s.messages.filter(isValidMessage).slice(-MAX_MESSAGES_PER_SESSION)
    : []

  return {
    id: s.id,
    title: typeof s.title === "string" && s.title.trim() ? s.title : NEW_SESSION_TITLE,
    createdAt: typeof s.createdAt === "number" ? s.createdAt : Date.now(),
    updatedAt: typeof s.updatedAt === "number" ? s.updatedAt : Date.now(),
    mood: typeof s.mood === "string" ? s.mood : "professional",
    draft: typeof s.draft === "string" ? s.draft : "",
    messages,
  }
}

export function emptyState(): ChatState {
  const session = createSession()
  return { version: STATE_VERSION, activeSessionId: session.id, sessions: [session] }
}

export function loadChatState(): ChatState {
  if (!isBrowser()) return emptyState()

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyState()

    const parsed = JSON.parse(raw) as Partial<ChatState>
    const sessions = Array.isArray(parsed.sessions)
      ? (parsed.sessions.map(normalizeSession).filter(Boolean) as ChatSession[])
      : []

    if (sessions.length === 0) return emptyState()

    sessions.sort((a, b) => b.updatedAt - a.updatedAt)
    const trimmed = sessions.slice(0, MAX_SESSIONS)
    const activeExists = trimmed.some((s) => s.id === parsed.activeSessionId)

    return {
      version: STATE_VERSION,
      activeSessionId: activeExists ? (parsed.activeSessionId as string) : trimmed[0].id,
      sessions: trimmed,
    }
  } catch {
    return emptyState()
  }
}

export function saveChatState(state: ChatState): void {
  if (!isBrowser()) return
  try {
    const payload: ChatState = {
      version: STATE_VERSION,
      activeSessionId: state.activeSessionId,
      sessions: state.sessions.slice(0, MAX_SESSIONS).map((s) => ({
        ...s,
        messages: s.messages.slice(-MAX_MESSAGES_PER_SESSION),
      })),
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Quota or private-mode failure: the session still works for this visit.
  }
}

export function getActiveSession(state: ChatState): ChatSession {
  return state.sessions.find((s) => s.id === state.activeSessionId) ?? state.sessions[0]
}

/** Applies a change to one session and re-sorts so the newest sits on top. */
export function updateSession(
  state: ChatState,
  sessionId: string,
  change: (session: ChatSession) => ChatSession
): ChatState {
  const sessions = state.sessions.map((s) => (s.id === sessionId ? change(s) : s))
  sessions.sort((a, b) => b.updatedAt - a.updatedAt)
  return { ...state, sessions }
}

export function addSession(state: ChatState, session: ChatSession): ChatState {
  return {
    ...state,
    activeSessionId: session.id,
    sessions: [session, ...state.sessions].slice(0, MAX_SESSIONS),
  }
}

export function removeSession(state: ChatState, sessionId: string): ChatState {
  const sessions = state.sessions.filter((s) => s.id !== sessionId)
  if (sessions.length === 0) return emptyState()
  return {
    ...state,
    activeSessionId: state.activeSessionId === sessionId ? sessions[0].id : state.activeSessionId,
    sessions,
  }
}

/** Short relative stamp for the session list, for example "3m ago". */
export function formatTimestamp(timestamp: number): string {
  const diff = Date.now() - timestamp
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) return "just now"
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`
  if (diff < day) return `${Math.floor(diff / hour)}h ago`
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`
  return new Date(timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" })
}
