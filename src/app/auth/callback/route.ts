import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, getUserInfo } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    const { data: user, error: userError } = await supabase
      .from('users')
      .upsert({
        email: userInfo.email,
        name: userInfo.name,
        last_login: new Date(),
      }, { onConflict: 'email' })
      .select()
      .single();

    if (userError) throw userError;

    const sessionToken = Buffer.from(
      JSON.stringify({
        userId: user.id,
        email: user.email,
        idToken: tokens.id_token,
      })
    ).toString('base64');

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
    console.error('Auth callback error:', error);
    return NextResponse.redirect(
      new URL('/?error=auth_failed', request.url)
    );
  }
}
