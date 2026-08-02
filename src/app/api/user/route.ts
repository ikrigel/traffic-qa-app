import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json({ id: user.id, email: user.email, role: user.role });
  } catch (error) {
    console.error('User fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 400 });
  }
}
