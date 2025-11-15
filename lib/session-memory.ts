/**
 * ROBUST Session Memory System with Upstash Redis
 * Maintains conversation history for context-aware responses
 * Minimum 8-prompt memory with automatic cleanup
 * NOW WITH ADAPTIVE FEEDBACK LEARNING
 */

import { Redis } from '@upstash/redis';
import { FeedbackPreferences } from './feedback-detector';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export interface SessionMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  mood?: string; // Track mood for each message
}

export interface SessionData {
  messages: SessionMessage[];
  sessionId: string;
  createdAt: number;
  lastActive: number;
  mood: string; // Current session mood
  feedbackPreferences?: FeedbackPreferences; // NEW: User preferences learned from feedback
}

const MAX_HISTORY = 16; // Keep last 16 messages (8 exchanges) for robust context
const SESSION_TTL = 3600; // 1 hour TTL

/**
 * Generate session ID from browser fingerprint or create new one
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Save conversation history to Redis WITH feedback preferences
 */
export async function saveConversationHistory(
  sessionId: string,
  messages: SessionMessage[],
  mood: string = 'professional',
  feedbackPreferences?: FeedbackPreferences
): Promise<void> {
  try {
    // Keep only the last MAX_HISTORY messages
    const trimmedMessages = messages.slice(-MAX_HISTORY);
    
    const sessionData: SessionData = {
      messages: trimmedMessages,
      sessionId,
      createdAt: Date.now(),
      lastActive: Date.now(),
      mood,
      feedbackPreferences, // Store user preferences
    };

    // Save to Redis with TTL
    await redis.setex(
      `chat_session:${sessionId}`,
      SESSION_TTL,
      JSON.stringify(sessionData)
    );

    console.log(`[Session Memory] Saved ${trimmedMessages.length} messages for session ${sessionId}`);
    if (feedbackPreferences) {
      console.log(`[Adaptive Feedback] Saved preferences:`, feedbackPreferences);
    }
  } catch (error) {
    console.error('[Session Memory] Failed to save:', error);
    // Non-blocking: continue even if Redis fails
  }
}

/**
 * Load conversation history from Redis
 */
export async function loadConversationHistory(
  sessionId: string
): Promise<SessionMessage[]> {
  try {
    const sessionData = await redis.get<SessionData>(`chat_session:${sessionId}`);
    
    if (!sessionData) {
      console.log(`[Session Memory] No history found for session ${sessionId}`);
      return [];
    }

    console.log(`[Session Memory] Loaded ${sessionData.messages.length} messages for session ${sessionId}`);
    
    return sessionData.messages;
  } catch (error) {
    console.error('[Session Memory] Failed to load:', error);
    return [];
  }
}

/**
 * Load feedback preferences from Redis (NEW)
 */
export async function loadFeedbackPreferences(
  sessionId: string
): Promise<FeedbackPreferences | null> {
  try {
    const sessionData = await redis.get<SessionData>(`chat_session:${sessionId}`);
    
    if (!sessionData) return null;

    return sessionData.feedbackPreferences || null;
  } catch (error) {
    console.error('[Adaptive Feedback] Failed to load preferences:', error);
    return null;
  }
}

/**
 * Clear session history
 */
export async function clearSessionHistory(sessionId: string): Promise<void> {
  try {
    await redis.del(`chat_session:${sessionId}`);
    console.log(`[Session Memory] Cleared session ${sessionId}`);
  } catch (error) {
    console.error('[Session Memory] Failed to clear:', error);
  }
}

/**
 * Get session mood
 */
export async function getSessionMood(sessionId: string): Promise<string> {
  try {
    const sessionData = await redis.get<SessionData>(`chat_session:${sessionId}`);
    
    if (!sessionData) return 'professional';

    return sessionData.mood || 'professional';
  } catch (error) {
    console.error('[Session Memory] Failed to get mood:', error);
    return 'professional';
  }
}

/**
 * Build context from conversation history
 */
export function buildConversationContext(messages: SessionMessage[]): string {
  if (messages.length === 0) return '';

  // Get last 8 exchanges (16 messages) for robust context
  const recentMessages = messages.slice(-MAX_HISTORY);
  
  let context = '\n\n=== CONVERSATION HISTORY ===\n';
  
  recentMessages.forEach((msg) => {
    const speaker = msg.role === 'user' ? 'User' : 'Assistant';
    context += `${speaker}: ${msg.content}\n`;
  });
  
  context += '=== END HISTORY ===\n\n';
  context += `CRITICAL FOLLOW-UP RULES:
1. When user says "the tech stacks", "more about it", "yes", "sure", "tell me more" - they're referring to the LAST thing YOU mentioned
2. Look at the most recent Assistant message to understand what "it" or "them" refers to
3. For pronouns (it, them, that, those), always check conversation history first
4. If user asks a vague question, it's likely a follow-up to your previous response

EXAMPLE:
Assistant: "I built AI-Powered Portfolio, Person Search app, and Modern Portfolio. Want details?"
User: "the tech stacks of it" → They want tech stacks of ALL THREE projects you just mentioned
`;
  
  return context;
}
