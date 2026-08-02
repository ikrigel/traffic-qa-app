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
  if (!secret) throw new Error('Missing JWT_SECRET');
  try {
    const decoded = jwt.verify(token, secret) as jwt.JwtPayload & Partial<SessionTokenPayload>;
    if (!decoded.userId || !decoded.email) return null;
    return { userId: decoded.userId, email: decoded.email };
  } catch {
    return null;
  }
};

export interface SessionUser {
  id: string;
  email: string;
  role: Role;
}

export const getSessionUser = async (request: NextRequest): Promise<SessionUser | null> => {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = verifySessionToken(token);
  if (!payload) return null;

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('users')
    .select('id, email, role')
    .eq('id', payload.userId)
    .single();

  if (error || !data) return null;

  const role: Role =
    data.email === SUPER_ADMIN_EMAIL ? 'super_admin' : ((data.role as Role) ?? 'user');

  return { id: data.id, email: data.email, role };
};
