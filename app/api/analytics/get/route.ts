import { NextRequest, NextResponse } from 'next/server';
import { getAnalytics } from '@/lib/analytics-logger';

export const runtime = 'nodejs';

// Secret admin key - set in .env.local
const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY;

export async function GET(req: NextRequest) {
  try {
    // Check authorization
    const authHeader = req.headers.get('authorization');
    const providedKey = authHeader?.replace('Bearer ', '');
    
    if (!ADMIN_SECRET || providedKey !== ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get analytics data
    const analytics = await getAnalytics(100);
    
    if (!analytics) {
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }
    
    return NextResponse.json(analytics);
  } catch (error) {
    console.error('[Analytics API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
