import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { getServiceSupabase } from './supabase';
import { SUPER_ADMIN_EMAIL } from './constants';
import type { Role } from '@/types';

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
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT_SECRET is not set!');
    throw new Error('Missing JWT_SECRET');
  }
  try {
    const decoded = jwt.verify(token, secret) as jwt.JwtPayload & Partial<SessionTokenPayload>;
    if (!decoded.userId || !decoded.email) {
      console.log('JWT decoded but missing userId or email');
      return null;
    }
    console.log('JWT verified successfully for user:', decoded.email);
    return { userId: decoded.userId, email: decoded.email };
  } catch (error) {
    console.error('JWT verification error:', error instanceof Error ? error.message : error);
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
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      console.log('No auth token in cookie');
      return null;
    }

    const payload = verifySessionToken(token);
    if (!payload) {
      console.log('Token verification failed');
      return null;
    }

    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', payload.userId)
      .single();

    if (error) {
      console.log('Supabase fetch error:', error.message);
      return null;
    }
    if (!data) {
      console.log('No user found in database');
      return null;
    }

    const role: Role =
      data.email === SUPER_ADMIN_EMAIL ? 'super_admin' : ((data.role as Role) ?? 'user');

    return { id: data.id, email: data.email, role };
  } catch (error) {
    console.error('getSessionUser error:', error);
    return null;
  }
};
