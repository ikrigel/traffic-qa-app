/* eslint-disable no-console */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SignJWT } from 'jose';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const JWT_SECRET = process.env.JWT_SECRET;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !JWT_SECRET) {
  throw new Error('Missing required environment variables for test auth setup');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface TestUser {
  email: string;
  id: string;
  role: 'user' | 'admin' | 'super_admin';
}

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Test endpoints not available in production' }, { status: 403 });
  }

  try {
    const body = await request.json() as TestUser;
    const { email, id, role } = body;

    if (!email || !id || !role) {
      return NextResponse.json({ error: 'Missing required fields: email, id, role' }, { status: 400 });
    }

    console.log(`[TEST-AUTH] Setting up test user: ${email} (${role})`);

    // Ensure user exists in database
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (!existingUser) {
      console.log(`[TEST-AUTH] Creating test user: ${email}`);
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id,
          email,
          role,
          name: email.split('@')[0],
          country: 'IL',
          city: 'Test City',
        });

      if (insertError) {
        console.error(`[TEST-AUTH] Failed to create user:`, insertError);
        return NextResponse.json({ error: 'Failed to create test user' }, { status: 500 });
      }
    } else if (existingUser.id !== id) {
      // Update role if user exists with different ID
      await supabase
        .from('users')
        .update({ id, role })
        .eq('email', email);
    }

    // Create JWT token
    const secret = new TextEncoder().encode(JWT_SECRET);
    const token = await new SignJWT({ userId: id, email })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('90d')
      .sign(secret);

    // Store session in database
    const deviceId = `test-device-${id}`;
    await supabase
      .from('sessions')
      .upsert(
        {
          user_id: id,
          device_id: deviceId,
          token,
          expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        },
        { onConflict: 'user_id,device_id' }
      );

    console.log(`[TEST-AUTH] ✅ Test user setup complete: ${email}`);

    const response = NextResponse.json({ success: true, token, email, role });

    // Set httpOnly cookie
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 90 * 24 * 60 * 60, // 90 days
    });

    return response;
  } catch (error) {
    console.error('[TEST-AUTH] Setup failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Setup failed' },
      { status: 500 }
    );
  }
}
