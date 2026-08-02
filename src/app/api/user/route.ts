import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const cookies = request.cookies.getAll();
    console.log('Cookies received:', cookies.map(c => c.name));

    const user = await getSessionUser(request);
    if (!user) {
      console.log('getSessionUser returned null');
      return NextResponse.json({ error: 'Not authenticated', cookies: cookies.map(c => c.name) }, { status: 401 });
    }
    return NextResponse.json({ id: user.id, email: user.email, role: user.role });
  } catch (error) {
    console.error('User fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch user', details: error instanceof Error ? error.message : 'Unknown' }, { status: 400 });
  }
}
