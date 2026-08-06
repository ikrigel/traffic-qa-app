import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { addApiKey, listUserApiKeys } from '@/lib/apiKeysService';

export const dynamic = 'force-dynamic';

// GET /api/user/keys - List user's API keys
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const keys = await listUserApiKeys(user.id);
    return NextResponse.json({ keys });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch keys';
    console.error('[API_KEYS] GET error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/user/keys - Add new API key
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { provider, apiKey, displayName } = await request.json();

    if (!provider || !apiKey) {
      return NextResponse.json(
        { error: 'Missing provider or API key' },
        { status: 400 }
      );
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
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
