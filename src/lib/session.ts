import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { getServiceSupabase } from './supabase';
import { SUPER_ADMIN_EMAIL, APP_VERSION } from './constants';
import type { Role } from '@/types';

const BUILD_ID = `v${APP_VERSION}-${new Date().toISOString().split('T')[0]}`;

export const AUTH_COOKIE_NAME = 'auth_token';
const SESSION_EXPIRY_SECONDS = 60 * 60 * 24 * 90; // 90 days

interface SessionTokenPayload {
  userId: string;
  email: string;
}

export const signSessionToken = (payload: SessionTokenPayload): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('Missing JWT_SECRET');
  return jwt.sign(payload, secret, { expiresIn: SESSION_EXPIRY_SECONDS });
};

export const verifySessionToken = (token: string): SessionTokenPayload | null => {
  console.log(`[SESSION BUILD ${BUILD_ID}] verifySessionToken called, token length: ${token.length}`);
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error(`[SESSION BUILD ${BUILD_ID}] ❌ JWT_SECRET is not set!`);
    throw new Error('Missing JWT_SECRET');
  }
  try {
    console.log(`[SESSION BUILD ${BUILD_ID}] Calling jwt.verify...`);
    const decoded = jwt.verify(token, secret) as jwt.JwtPayload & Partial<SessionTokenPayload>;
    console.log(`[SESSION BUILD ${BUILD_ID}] JWT decoded. userId=${decoded.userId}, email=${decoded.email}`);
    if (!decoded.userId || !decoded.email) {
      console.log(`[SESSION BUILD ${BUILD_ID}] ❌ JWT decoded but missing userId or email`);
      return null;
    }
    console.log(`[SESSION BUILD ${BUILD_ID}] ✅ JWT verified successfully for user: ${decoded.email}`);
    return { userId: decoded.userId, email: decoded.email };
  } catch (error) {
    console.error(`[SESSION BUILD ${BUILD_ID}] ❌ JWT verification error:`, error instanceof Error ? error.message : error);
    return null;
  }
};

export interface SessionUser {
  id: string;
  email: string;
  role: Role;
}

export const getSessionUser = async (request: NextRequest): Promise<SessionUser | null> => {
  try {
    console.log(`[SESSION BUILD ${BUILD_ID}] getSessionUser called`);
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    console.log(`[SESSION BUILD ${BUILD_ID}] auth_token cookie exists: ${!!token}`);
    if (!token) {
      console.log(`[SESSION BUILD ${BUILD_ID}] ❌ No auth_token cookie found`);
      return null;
    }

    console.log(`[SESSION BUILD ${BUILD_ID}] Token found, length: ${token.length}`);
    let payload: SessionTokenPayload | null;
    try {
      payload = verifySessionToken(token);
    } catch (jwtError) {
      console.error(`[SESSION BUILD ${BUILD_ID}] ❌ JWT verification threw error:`, jwtError instanceof Error ? jwtError.message : jwtError);
      return null;
    }

    if (!payload) {
      console.log(`[SESSION BUILD ${BUILD_ID}] ❌ Token verification failed - invalid or expired token`);
      return null;
    }

    console.log(`[SESSION BUILD ${BUILD_ID}] Payload verified. userId=${payload.userId}, email=${payload.email}`);
    console.log(`[SESSION BUILD ${BUILD_ID}] Fetching user from Supabase...`);
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', payload.userId)
      .single();

    if (error) {
      console.log(`[SESSION BUILD ${BUILD_ID}] ❌ Supabase fetch error: ${error.message}`);
      return null;
    }
    if (!data) {
      console.log(`[SESSION BUILD ${BUILD_ID}] ❌ No user found in database with id: ${payload.userId}`);
      return null;
    }

    console.log(`[SESSION BUILD ${BUILD_ID}] User found in DB: ${data.email}, stored role: ${data.role}`);
    const role: Role =
      data.email === SUPER_ADMIN_EMAIL ? 'super_admin' : ((data.role as Role) ?? 'user');

    console.log(`[SESSION BUILD ${BUILD_ID}] ✅ Final role: ${role}`);
    return { id: data.id, email: data.email, role };
  } catch (error) {
    console.error(`[SESSION BUILD ${BUILD_ID}] ❌ getSessionUser unexpected error:`, error);
    return null;
  }
};
