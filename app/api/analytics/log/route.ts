import { NextRequest, NextResponse } from 'next/server';
import { logChatInteraction } from '@/lib/analytics';

// Use Node.js runtime for Prisma (Edge runtime doesn't support Prisma)
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Log to Neon Postgres
    await logChatInteraction(data);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Analytics API] Error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
