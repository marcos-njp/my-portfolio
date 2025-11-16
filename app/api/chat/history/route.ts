/**
 * Chat History API - Load previous messages from Redis
 * Persists for 1 hour across browser refreshes
 */

import { NextRequest, NextResponse } from 'next/server';
import { loadConversationHistory } from '@/lib/session-memory';

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Load messages from Redis
    const messages = await loadConversationHistory(sessionId);

    console.log(`[Chat History API] Loaded ${messages.length} messages for session ${sessionId}`);

    return NextResponse.json({
      messages,
      sessionId,
      count: messages.length,
    });
  } catch (error) {
    console.error('[Chat History API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to load chat history' },
      { status: 500 }
    );
  }
}
