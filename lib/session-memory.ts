/**
 * Session Memory System with Upstash Redis
 * Maintains conversation history for context-aware responses.
 *
 * Resilient by design: if Redis is unconfigured, unreachable, or slow, every
 * operation fails fast and the chat keeps working without it. A small circuit
 * breaker avoids re-hitting a dead host on every request (which otherwise adds
 * ~5s of DNS/connect timeout per call).
 */

import { Redis } from '@upstash/redis';
import { FeedbackPreferences } from './feedback-detector';

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = REDIS_URL && REDIS_TOKEN ? new Redis({ url: REDIS_URL, token: REDIS_TOKEN }) : null;

if (!redis) {
  console.warn('[Redis] UPSTASH_REDIS_REST_URL/TOKEN not set — session memory disabled.');
}

// Circuit breaker: after a failure, skip Redis for this long instead of timing out repeatedly.
const FAIL_COOLDOWN_MS = 30_000;
const OP_TIMEOUT_MS = 1500;
let circuitOpenUntil = 0;

/**
 * Run a Redis op with a hard timeout + circuit breaker. Returns `fallback`
 * (never throws) if Redis is missing, the circuit is open, the op fails, or it
 * exceeds OP_TIMEOUT_MS.
 */
async function withRedis<T>(label: string, op: () => Promise<T>, fallback: T): Promise<T> {
  if (!redis) return fallback;
  if (Date.now() < circuitOpenUntil) return fallback;

  let timer: ReturnType<typeof setTimeout> | undefined;
  const opPromise = op();
  // Swallow a late rejection if the timeout wins the race (avoids unhandled rejection).
  opPromise.catch(() => {});

  try {
    return await Promise.race([
      opPromise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`timeout after ${OP_TIMEOUT_MS}ms`)), OP_TIMEOUT_MS);
      }),
    ]);
  } catch (error) {
    circuitOpenUntil = Date.now() + FAIL_COOLDOWN_MS;
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[Redis] ${label} unavailable, skipping for ${FAIL_COOLDOWN_MS / 1000}s (${message})`);
    return fallback;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export interface SessionMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  mood?: string;
}

export interface SessionData {
  messages: SessionMessage[];
  sessionId: string;
  createdAt: number;
  lastActive: number;
  mood: string;
  feedbackPreferences?: FeedbackPreferences;
}

const MAX_SESSION_MEMORY = 8; // Keep last 8 messages for AI context
const SESSION_TTL = 3600; // 1 hour
const CHAT_HISTORY_TTL = 3600; // 1 hour

/**
 * Save conversation history to Redis (session memory + complete history).
 */
export async function saveConversationHistory(
  sessionId: string,
  messages: SessionMessage[],
  mood: string = 'professional',
  feedbackPreferences?: FeedbackPreferences
): Promise<void> {
  const sessionMemory = messages.slice(-MAX_SESSION_MEMORY);
  const now = Date.now();

  const sessionData: SessionData = {
    messages: sessionMemory,
    sessionId,
    createdAt: now,
    lastActive: now,
    mood,
    feedbackPreferences,
  };

  await withRedis(
    'save',
    async () => {
      await redis!.setex(`chat_session:${sessionId}`, SESSION_TTL, JSON.stringify(sessionData));
      await redis!.setex(
        `chat_history:${sessionId}`,
        CHAT_HISTORY_TTL,
        JSON.stringify({ messages, sessionId, createdAt: now, lastActive: now })
      );
    },
    undefined
  );
}

/**
 * Load session data (messages + feedback preferences).
 */
export async function loadSessionData(
  sessionId: string
): Promise<{ messages: SessionMessage[]; feedbackPreferences: FeedbackPreferences | null }> {
  const fallback = { messages: [] as SessionMessage[], feedbackPreferences: null as FeedbackPreferences | null };
  return withRedis(
    'load',
    async () => {
      const sessionData = await redis!.get<SessionData>(`chat_session:${sessionId}`);
      if (!sessionData) return fallback;
      return {
        messages: sessionData.messages,
        feedbackPreferences: sessionData.feedbackPreferences || null,
      };
    },
    fallback
  );
}

/**
 * Load complete chat history (for the History view).
 */
export async function loadChatHistory(sessionId: string): Promise<SessionMessage[]> {
  return withRedis(
    'history',
    async () => {
      const historyData = await redis!.get<{ messages: SessionMessage[] }>(`chat_history:${sessionId}`);
      return historyData?.messages ?? [];
    },
    []
  );
}

/**
 * Clear both session memory and chat history.
 */
export async function clearSessionHistory(sessionId: string): Promise<void> {
  await withRedis(
    'clear',
    async () => {
      await redis!.del(`chat_session:${sessionId}`);
      await redis!.del(`chat_history:${sessionId}`);
    },
    undefined
  );
}

/**
 * Build a compact conversation context string for the system prompt.
 */
export function buildConversationContext(messages: SessionMessage[]): string {
  if (messages.length === 0) return '';

  const recentMessages = messages.slice(-MAX_SESSION_MEMORY);
  let context = '\n\n=== HISTORY ===\n';
  recentMessages.forEach((msg) => {
    const speaker = msg.role === 'user' ? 'U' : 'A';
    context += `${speaker}: ${msg.content}\n`;
  });
  context += '=== END ===\n\nFOLLOW-UPS: "it"/"them"/"that" = what YOU just said. Check last Assistant message.\n';
  return context;
}
