import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, getUserInfo } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/supabase';
import { signSessionToken } from '@/lib/session';
import { logError } from '@/lib/logger';
import { getLocationFromRequest } from '@/lib/geo';
import { SUPER_ADMIN_EMAIL } from '@/lib/constants';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL(`/?error=${error}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/?error=no_code', request.url)
      );
    }

    const tokens = await exchangeCodeForToken(code);
    const userInfo = getUserInfo(tokens.id_token);
    const googleLocale = (userInfo as any).locale || '';
    const location = getLocationFromRequest(request, googleLocale);

    const supabase = getServiceSupabase();
    const { data: user, error: userError } = await supabase
      .from('users')
      .upsert({
        email: userInfo.email,
        name: userInfo.name,
        last_login: new Date(),
        location: location.location,
        country: location.country,
        city: location.city,
      }, { onConflict: 'email' })
      .select()
      .single();

    if (userError) throw userError;

    // Self-heal super_admin role if needed
    if (user.email === SUPER_ADMIN_EMAIL && user.role !== 'super_admin') {
      const { error: roleError } = await supabase
        .from('users')
        .update({ role: 'super_admin' })
        .eq('id', user.id);
      if (roleError) {
        await logError({
          source: 'auth/callback',
          message: 'Failed to self-heal super_admin role',
          context: { error: roleError.message, userId: user.id },
        });
      }
    }

    const sessionToken = signSessionToken({ userId: user.id, email: user.email });

    const response = NextResponse.redirect(
      new URL('/', request.url)
    );

    response.cookies.set('auth_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 90,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown auth callback error';
    console.error('Auth callback error:', error);
    await logError({ source: 'auth/callback', message });
    return NextResponse.redirect(
      new URL('/?error=auth_failed', request.url)
    );
  }
}
