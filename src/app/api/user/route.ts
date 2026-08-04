import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { APP_VERSION } from '@/lib/constants';

export const dynamic = 'force-dynamic';

const BUILD_ID = `v${APP_VERSION}-${new Date().toISOString().split('T')[0]}`;

export async function GET(request: NextRequest) {
  try {
    const allCookies = request.cookies.getAll();
    const authTokenCookie = request.cookies.get('auth_token');
    const cookieExists = !!authTokenCookie?.value;

    console.log(`[API BUILD ${BUILD_ID}] === /api/user request ===`);
    console.log(`[API BUILD ${BUILD_ID}] Request URL:`, request.url);
    console.log(`[API BUILD ${BUILD_ID}] All cookies received:`, allCookies.map(c => c.name));
    console.log(`[API BUILD ${BUILD_ID}] Cookie count: ${allCookies.length}`);
    console.log(`[API BUILD ${BUILD_ID}] auth_token exists: ${cookieExists}`);

    if (!cookieExists) {
      console.log(`[API BUILD ${BUILD_ID}] ❌ No auth_token cookie found`);
      return NextResponse.json(
        { error: 'Not authenticated', reason: 'no_cookie', buildId: BUILD_ID, receivedCookies: allCookies.map(c => c.name) },
        { status: 401 }
      );
    }

    console.log(`[API BUILD ${BUILD_ID}] ✓ auth_token cookie found, length: ${authTokenCookie?.value.length}`);
    console.log(`[API BUILD ${BUILD_ID}] Verifying session user...`);
    const user = await getSessionUser(request);

    if (!user) {
      console.log(`[API BUILD ${BUILD_ID}] ❌ getSessionUser returned null - JWT or DB lookup failed`);
      return NextResponse.json(
        { error: 'Not authenticated', reason: 'verification_failed', buildId: BUILD_ID },
        { status: 401 }
      );
    }

    console.log(`[API BUILD ${BUILD_ID}] ✅ User authenticated: ${user.email} (role: ${user.role})`);
    return NextResponse.json({ id: user.id, email: user.email, role: user.role, buildId: BUILD_ID });
  } catch (error) {
    console.error(`[API BUILD ${BUILD_ID}] ❌ User fetch error:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch user', buildId: BUILD_ID, details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
