import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const allCookies = request.cookies.getAll();
    const authTokenCookie = request.cookies.get('auth_token');
    const cookieExists = !!authTokenCookie?.value;

    console.log('=== /api/user request ===');
    console.log('All cookies received:', allCookies.map(c => c.name));
    console.log('auth_token exists:', cookieExists);

    if (!cookieExists) {
      console.log('❌ No auth_token cookie found - user not authenticated');
      return NextResponse.json(
        { error: 'Not authenticated', reason: 'no_cookie', receivedCookies: allCookies.map(c => c.name) },
        { status: 401 }
      );
    }

    console.log('auth_token cookie found, verifying...');
    const user = await getSessionUser(request);

    if (!user) {
      console.log('❌ getSessionUser returned null - check server logs for JWT error');
      return NextResponse.json(
        { error: 'Not authenticated', reason: 'verification_failed' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', user.email);
    return NextResponse.json({ id: user.id, email: user.email, role: user.role });
  } catch (error) {
    console.error('❌ User fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
