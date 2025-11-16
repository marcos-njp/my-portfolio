/**
 * Clear Chat History API - Delete session from Redis
 */

import { NextRequest, NextResponse } from 'next/server';
import { clearSessionHistory } from '@/lib/session-memory';

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Clear from Redis
    await clearSessionHistory(sessionId);

    console.log(`[Clear History API] Cleared session ${sessionId}`);

    return NextResponse.json({
      success: true,
      message: 'Chat history cleared successfully',
    });
  } catch (error) {
    console.error('[Clear History API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to clear chat history' },
      { status: 500 }
    );
  }
}
