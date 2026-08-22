import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { isLoggingEnabled, setLoggingEnabled } from '@/lib/loggingStatus';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ loggingEnabled: isLoggingEnabled() });
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ['admin', 'super_admin']);
  if (!auth.authorized) return auth.response;

  try {
    const { enabled } = await request.json();

    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Invalid enabled value' }, { status: 400 });
    }

    setLoggingEnabled(enabled);
    return NextResponse.json({ success: true, loggingEnabled: enabled });
  } catch (error) {
    console.error('Toggle logging error:', error);
    return NextResponse.json({ error: 'Failed to toggle logging' }, { status: 500 });
  }
}
