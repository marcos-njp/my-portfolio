import { NextRequest, NextResponse } from 'next/server';
import { logChatInteraction } from '@/lib/analytics-logger';

// Use Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Log to database
    await logChatInteraction(data);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Analytics API] Failed to log:', error);
    return NextResponse.json({ success: false, error: 'Logging failed' }, { status: 500 });
  }
}
