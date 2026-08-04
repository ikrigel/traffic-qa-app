import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, getUserInfo } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/supabase';
import { signSessionToken } from '@/lib/session';
import { logError } from '@/lib/logger';
import { getLocationFromRequest } from '@/lib/geo';
import { SUPER_ADMIN_EMAIL, APP_VERSION } from '@/lib/constants';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

const BUILD_ID = `v${APP_VERSION}-${new Date().toISOString().split('T')[0]}`;

export async function GET(request: NextRequest) {
  try {
    console.log(`[AUTH CALLBACK BUILD ${BUILD_ID}] OAuth callback initiated`);
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    console.log(`[AUTH CALLBACK BUILD ${BUILD_ID}] Code received: ${code ? 'yes' : 'no'}, Error: ${error || 'none'}`);

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

    // Check for required env vars
    console.log(`[AUTH CALLBACK BUILD ${BUILD_ID}] Checking environment variables...`);
    if (!process.env.GOOGLE_CLIENT_SECRET) {
      throw new Error('GOOGLE_CLIENT_SECRET is not set');
    }
    console.log(`[AUTH CALLBACK BUILD ${BUILD_ID}] ✓ GOOGLE_CLIENT_SECRET present`);

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not set');
    }
    console.log(`[AUTH CALLBACK BUILD ${BUILD_ID}] ✓ JWT_SECRET present`);

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
    }
    console.log(`[AUTH CALLBACK BUILD ${BUILD_ID}] ✓ SUPABASE_SERVICE_ROLE_KEY present`);

    console.log(`[AUTH CALLBACK BUILD ${BUILD_ID}] Exchanging code for tokens...`);
    const tokens = await exchangeCodeForToken(code);
    console.log(`[AUTH CALLBACK BUILD ${BUILD_ID}] ✓ Tokens received`);

    console.log(`[AUTH CALLBACK BUILD ${BUILD_ID}] Extracting user info from ID token...`);
    const userInfo = getUserInfo(tokens.id_token);
    console.log(`[AUTH CALLBACK BUILD ${BUILD_ID}] ✓ User info extracted: ${userInfo.email}`);

    const googleLocale = (userInfo as any).locale || '';
    console.log(`[AUTH CALLBACK BUILD ${BUILD_ID}] Google locale: ${googleLocale}`);

    console.log(`[AUTH CALLBACK BUILD ${BUILD_ID}] Getting location from request...`);
    const location = getLocationFromRequest(request, googleLocale);
    console.log(`[AUTH CALLBACK BUILD ${BUILD_ID}] ✓ Location resolved: ${location.country}/${location.city}`);

    console.log(`[AUTH CALLBACK BUILD ${BUILD_ID}] Getting Supabase service client...`);
    const supabase = getServiceSupabase();
    console.log(`[AUTH CALLBACK BUILD ${BUILD_ID}] ✓ Supabase client ready`);

    console.log(`[AUTH CALLBACK BUILD ${BUILD_ID}] Upserting user to database...`);
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

    if (userError) {
      console.error(`[AUTH CALLBACK BUILD ${BUILD_ID}] ❌ Upsert error:`, userError);
      throw userError;
    }
    if (!user) {
      console.error(`[AUTH CALLBACK BUILD ${BUILD_ID}] ❌ User not returned from upsert`);
      throw new Error('User not returned from upsert');
    }
    console.log(`[AUTH CALLBACK BUILD ${BUILD_ID}] ✓ User upserted: ${user.email} (id: ${user.id}, role: ${user.role})`);

    // Self-heal super_admin role if needed
    if (user.email === SUPER_ADMIN_EMAIL && user.role !== 'super_admin') {
      console.log(`[AUTH CALLBACK BUILD ${BUILD_ID}] Self-healing super_admin role for ${SUPER_ADMIN_EMAIL}...`);
      const { error: roleError } = await supabase
        .from('users')
        .update({ role: 'super_admin' })
        .eq('id', user.id);
      if (roleError) {
        console.error(`[AUTH CALLBACK BUILD ${BUILD_ID}] ❌ Role self-heal error:`, roleError);
        await logError({
          source: 'auth/callback',
          message: 'Failed to self-heal super_admin role',
          context: { error: roleError.message, userId: user.id },
        });
      } else {
        console.log(`[AUTH CALLBACK BUILD ${BUILD_ID}] ✓ Role self-healed to super_admin`);
      }
    }

    console.log(`[AUTH CALLBACK BUILD ${BUILD_ID}] User created/updated: ${user.email} (id: ${user.id})`);

    const sessionToken = signSessionToken({ userId: user.id, email: user.email });
    console.log(`[AUTH CALLBACK BUILD ${BUILD_ID}] Session token signed, length: ${sessionToken.length}`);

    const response = NextResponse.redirect(
      new URL('/', request.url)
    );

    // On Vercel, ALWAYS use secure: true (Vercel is HTTPS)
    // On localhost, use secure: false (HTTP)
    const isLocalhost = request.url.includes('localhost');
    const useSecure = !isLocalhost;

    console.log(`[AUTH CALLBACK BUILD ${BUILD_ID}] Cookie config - isLocalhost: ${isLocalhost}, useSecure: ${useSecure}`);
    console.log(`[AUTH CALLBACK BUILD ${BUILD_ID}] Request URL: ${request.url}`);

    response.cookies.set('auth_token', sessionToken, {
      httpOnly: true,
      secure: useSecure,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 90,
      path: '/',
    });

    console.log(`[AUTH CALLBACK BUILD ${BUILD_ID}] ✅ Cookie set! (secure=${useSecure}, httpOnly=true, path=/)`);
    console.log(`[AUTH CALLBACK BUILD ${BUILD_ID}] Redirecting to /`);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown auth callback error';
    const stack = error instanceof Error ? error.stack : String(error);
    console.error(`[AUTH CALLBACK BUILD ${BUILD_ID}] ❌ CALLBACK FAILED:`, message);
    console.error(`[AUTH CALLBACK BUILD ${BUILD_ID}] Stack:`, stack);
    await logError({
      source: 'auth/callback',
      message,
      context: { stack, buildId: BUILD_ID }
    });
    return NextResponse.redirect(
      new URL('/?error=auth_failed', request.url)
    );
  }
}
