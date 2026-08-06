import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { getServiceSupabase } from '@/lib/supabase';
import { decryptPackagedKey } from '@/lib/encryption';
import { recordKeyValidation } from '@/lib/apiKeys';
import { providers } from '@/lib/providers';
import { apiError } from '@/lib/apiErrors';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return apiError('NOT_AUTHENTICATED', 'Not authenticated', 401);
    }

    const { id } = params;
    const supabase = getServiceSupabase();

    const { data: key, error: fetchError } = await supabase
      .from('api_keys')
      .select('id, user_id, provider, key_encrypted, validation_status')
      .eq('id', id)
      .single();

    if (fetchError || !key) {
      return apiError('KEY_NOT_FOUND', 'API key not found', 404);
    }

    if (key.user_id !== user.id) {
      return apiError('UNAUTHORIZED_KEY_ACCESS', 'Unauthorized', 403);
    }

    try {
      const decrypted = decryptPackagedKey(key.key_encrypted);
      const provider = providers[key.provider as keyof typeof providers];

      if (!provider) {
        return apiError('INVALID_PROVIDER', `Provider ${key.provider} not supported`, 400);
      }

      const result = await provider.testKey(decrypted);

      if (result.ok) {
        await recordKeyValidation(key.id, 'valid');
        return NextResponse.json({
          valid: true,
          provider: key.provider,
          testedAt: new Date().toISOString(),
        });
      } else {
        await recordKeyValidation(key.id, 'invalid', result.errorMessage);
        return NextResponse.json({
          valid: false,
          provider: key.provider,
          testedAt: new Date().toISOString(),
          error: {
            code: result.errorCode || 'UNKNOWN',
            message: result.errorMessage || 'Validation failed',
          },
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Validation failed';
      await recordKeyValidation(key.id, 'invalid', message);
      return apiError('VALIDATION_FAILED', message, 500);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to test API key';
    console.error('[TEST_KEY] Error:', message);
    return apiError('INTERNAL_ERROR', message, 500);
  }
}
