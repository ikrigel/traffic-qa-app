import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, SessionUser } from './session';
import type { Role } from '@/types';

type RequireRoleResult =
  | { authorized: true; user: SessionUser }
  | { authorized: false; response: NextResponse };

export const requireRole = async (
  request: NextRequest,
  allowedRoles: Role[]
): Promise<RequireRoleResult> => {
  const user = await getSessionUser(request);

  if (!user) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }),
    };
  }

  if (!allowedRoles.includes(user.role)) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  return { authorized: true, user };
};
