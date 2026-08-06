import { getServiceSupabase } from '@/lib/supabase';
import { decryptPackagedKey } from '@/lib/encryption';
import { logError } from '@/lib/logger';
import { PROVIDER_PRIORITY } from '@/lib/providers';
import type { AIProvider } from '@/types';
import type { CandidateKey } from './types';

export async function getUserApiKey(
  userId: string,
  provider: AIProvider
): Promise<string | null> {
  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('api_keys')
      .select('key_encrypted')
      .eq('user_id', userId)
      .eq('provider', provider)
      .eq('is_active', true)
      .eq('is_default', true)
      .single();

    if (error || !data) {
      console.log(`[API_KEYS] No default key for ${provider}`);
      return null;
    }

    try {
      const decrypted = decryptPackagedKey(data.key_encrypted);
      return decrypted;
    } catch (decryptError) {
      console.error('[API_KEYS] Failed to decrypt key:', decryptError);
      return null;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get API key';
    console.error('[API_KEYS] Error:', message);
    await logError({ source: 'apiKeysService.getUserApiKey', message });
    return null;
  }
}

export function getAdminApiKey(provider: AIProvider): string | null {
  const key = process.env[`${provider.toUpperCase()}_API_KEY`];
  if (key) {
    console.log(`[API_KEYS] Using admin ${provider} key from environment`);
  }
  return key || null;
}

export async function listCandidateKeys(userId: string): Promise<CandidateKey[]> {
  try {
    const supabase = getServiceSupabase();
    const { data: userKeys, error } = await supabase
      .from('api_keys')
      .select('id, provider, key_encrypted, is_active, created_at')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[API_KEYS] Query failed:', error);
      throw error;
    }

    console.log(`[API_KEYS] Fetched ${userKeys?.length || 0} keys for user ${userId}`);

    const candidates: CandidateKey[] = [];

    if (userKeys && userKeys.length > 0) {
      for (const key of userKeys) {
        try {
          const decrypted = decryptPackagedKey(key.key_encrypted);
          console.log(`[API_KEYS] Successfully decrypted ${key.provider} key ${key.id}`);
          candidates.push({
            keyId: key.id,
            apiKey: decrypted,
            provider: key.provider as AIProvider,
            source: 'user',
          });
        } catch (decryptError) {
          console.error(`[API_KEYS] Decrypt failed for key ${key.id}:`, decryptError);
        }
      }

      // Try to fetch priority values if the column exists
      try {
        const { data: priorityData } = await supabase
          .from('api_keys')
          .select('id, priority')
          .eq('user_id', userId)
          .eq('is_active', true);

        if (priorityData) {
          const priorityMap = new Map(priorityData.map(p => [p.id, p.priority]));
          candidates.forEach(c => {
            c.priority = priorityMap.get(c.keyId);
          });
        }
      } catch (priorityError) {
        console.log('[API_KEYS] Priority column not available, using default ordering');
      }

      candidates.sort((a, b) => {
        const aPriority = a.priority ?? Infinity;
        const bPriority = b.priority ?? Infinity;
        if (aPriority !== bPriority) return aPriority - bPriority;

        const aProviderOrder = PROVIDER_PRIORITY.indexOf(a.provider);
        const bProviderOrder = PROVIDER_PRIORITY.indexOf(b.provider);
        return aProviderOrder - bProviderOrder;
      });

      console.log(`[API_KEYS] Built ${candidates.length} candidates`, candidates.map(c => ({ provider: c.provider, priority: c.priority })));
    }

    if (candidates.length === 0) {
      for (const provider of PROVIDER_PRIORITY) {
        const adminKey = getAdminApiKey(provider);
        if (adminKey) {
          candidates.push({
            keyId: `admin-${provider}`,
            apiKey: adminKey,
            provider,
            source: 'admin',
          });
        }
      }
    }

    return candidates;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list candidate keys';
    console.error('[API_KEYS] Error:', message);
    await logError({ source: 'apiKeysService.listCandidateKeys', message });
    return [];
  }
}

export async function recordKeyValidation(
  keyId: string,
  status: 'valid' | 'invalid',
  errorMessage?: string
): Promise<void> {
  try {
    const supabase = getServiceSupabase();
    await supabase
      .from('api_keys')
      .update({
        validation_status: status,
        last_validated_at: new Date().toISOString(),
        last_validation_error: errorMessage || null,
      })
      .eq('id', keyId);
  } catch (error) {
    console.error('[API_KEYS] Failed to record validation:', error);
  }
}
