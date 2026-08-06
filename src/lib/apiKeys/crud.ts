/* eslint-disable no-console */
import { getServiceSupabase } from '@/lib/supabase';
import { encryptAndPackageKey, hashApiKey } from '@/lib/encryption';
import { logError } from '@/lib/logger';
import type { APIKey, AIProvider } from '@/types';

export async function addApiKey(
  userId: string,
  provider: AIProvider,
  apiKey: string,
  displayName?: string
): Promise<string | null> {
  try {
    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('API key cannot be empty');
    }

    const encrypted = encryptAndPackageKey(apiKey);
    const hash = hashApiKey(apiKey);

    const supabase = getServiceSupabase();

    const { data: existing } = await supabase
      .from('api_keys')
      .select('id')
      .eq('user_id', userId)
      .eq('key_hash', hash)
      .single();

    if (existing) {
      throw new Error('This API key is already in use');
    }

    const { data: existingKeys } = await supabase
      .from('api_keys')
      .select('id')
      .eq('user_id', userId)
      .eq('provider', provider);

    const isDefault = !existingKeys || existingKeys.length === 0;

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: userId,
        provider,
        key_encrypted: encrypted,
        key_hash: hash,
        display_name: displayName || `${provider} key`,
        is_active: true,
        is_default: isDefault,
      })
      .select('id')
      .single();

    if (error) throw error;

    console.log(`[API_KEYS] Added ${provider} key for user ${userId}`);
    return data?.id || null;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add API key';
    console.error('[API_KEYS] Error:', message);
    await logError({ source: 'apiKeysService.addApiKey', message });
    throw error;
  }
}

export async function deleteApiKey(keyId: string, userId: string): Promise<boolean> {
  try {
    const supabase = getServiceSupabase();

    const { data: key, error: fetchError } = await supabase
      .from('api_keys')
      .select('user_id')
      .eq('id', keyId)
      .single();

    if (fetchError || !key || key.user_id !== userId) {
      throw new Error('Unauthorized');
    }

    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', keyId);

    if (error) throw error;

    console.log(`[API_KEYS] Deleted key ${keyId} for user ${userId}`);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete API key';
    console.error('[API_KEYS] Error:', message);
    await logError({ source: 'apiKeysService.deleteApiKey', message });
    throw error;
  }
}

export async function setDefaultApiKey(keyId: string, userId: string): Promise<boolean> {
  try {
    const supabase = getServiceSupabase();

    const { data: key, error: fetchError } = await supabase
      .from('api_keys')
      .select('provider, user_id')
      .eq('id', keyId)
      .single();

    if (fetchError || !key || key.user_id !== userId) {
      throw new Error('Unauthorized');
    }

    await supabase
      .from('api_keys')
      .update({ is_default: false })
      .eq('user_id', userId)
      .eq('provider', key.provider);

    const { error } = await supabase
      .from('api_keys')
      .update({ is_default: true })
      .eq('id', keyId);

    if (error) throw error;

    console.log(`[API_KEYS] Set key ${keyId} as default for user ${userId}`);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to set default API key';
    console.error('[API_KEYS] Error:', message);
    await logError({ source: 'apiKeysService.setDefaultApiKey', message });
    throw error;
  }
}

export async function updateKeyPriority(keyId: string, userId: string, priority: number): Promise<boolean> {
  try {
    const supabase = getServiceSupabase();

    const { data: key, error: fetchError } = await supabase
      .from('api_keys')
      .select('user_id')
      .eq('id', keyId)
      .single();

    if (fetchError || !key || key.user_id !== userId) {
      throw new Error('Unauthorized');
    }

    const { error } = await supabase
      .from('api_keys')
      .update({ priority })
      .eq('id', keyId);

    if (error) throw error;

    console.log(`[API_KEYS] Updated priority for key ${keyId}`);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update key priority';
    console.error('[API_KEYS] Error:', message);
    await logError({ source: 'apiKeysService.updateKeyPriority', message });
    throw error;
  }
}

export async function listUserApiKeys(userId: string): Promise<APIKey[]> {
  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('api_keys')
      .select(
        'id, user_id, provider, display_name, is_active, is_default, created_at, last_used_at, rotated_at, validation_status, last_validated_at, last_validation_error, priority'
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(key => ({
      id: key.id,
      userId: key.user_id,
      provider: key.provider,
      displayName: key.display_name,
      isActive: key.is_active,
      isDefault: key.is_default,
      createdAt: key.created_at,
      lastUsedAt: key.last_used_at,
      rotatedAt: key.rotated_at,
      validationStatus: key.validation_status,
      lastValidatedAt: key.last_validated_at,
      lastValidationError: key.last_validation_error,
      priority: key.priority,
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list API keys';
    console.error('[API_KEYS] Error:', message);
    await logError({ source: 'apiKeysService.listUserApiKeys', message });
    return [];
  }
}
