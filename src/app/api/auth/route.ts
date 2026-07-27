import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAuthUrl } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get('action');

  if (action === 'login') {
    const authUrl = getGoogleAuthUrl();
    return NextResponse.json({ url: authUrl });
  }

  if (action === 'logout') {
    const response = NextResponse.json({ success: true });
    response.cookies.set('auth_token', '', { maxAge: 0 });
    return response;
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
