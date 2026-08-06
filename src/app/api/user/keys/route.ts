import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { addApiKey, listUserApiKeys } from '@/lib/apiKeys';
import { apiError } from '@/lib/apiErrors';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return apiError('NOT_AUTHENTICATED', 'Not authenticated', 401);
    }

    const keys = await listUserApiKeys(user.id);
    return NextResponse.json({ keys });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch keys';
    console.error('[API_KEYS] GET error:', msg);
    return apiError('INTERNAL_ERROR', msg, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return apiError('NOT_AUTHENTICATED', 'Not authenticated', 401);
    }

    const { provider, apiKey, displayName } = await request.json();

    if (!provider || !apiKey) {
      return apiError('MISSING_FIELDS', 'Missing provider or API key', 400);
    }

    const keyId = await addApiKey(user.id, provider, apiKey, displayName);

    if (!keyId) {
      throw new Error('Failed to save API key');
    }

    return NextResponse.json({
      success: true,
      keyId,
      message: 'API key added successfully',
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to add API key';
    console.error('[API_KEYS] POST error:', msg);

    if (msg.includes('already in use')) {
      return apiError('KEY_ALREADY_EXISTS', msg, 409);
    }

    return apiError('INTERNAL_ERROR', msg, 500);
  }
}
