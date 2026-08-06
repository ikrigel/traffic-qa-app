import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST(_request: NextRequest) {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(AUTH_COOKIE_NAME);
  return response;
}

export async function GET(_request: NextRequest) {
  const response = NextResponse.redirect(new URL('/', 'https://traffic-qa-app.vercel.app/'));
  response.cookies.delete(AUTH_COOKIE_NAME);
  return response;
}
