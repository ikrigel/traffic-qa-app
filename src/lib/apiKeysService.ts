/* eslint-disable no-console */
import { getServiceSupabase } from './supabase';
import { encryptAndPackageKey, decryptPackagedKey, hashApiKey } from './encryption';
import { logError } from './logger';
import type { APIKey, AIProvider } from '@/types';

// Get user's active API key for a provider
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

// Get admin fallback key from environment
export function getAdminApiKey(provider: AIProvider): string | null {
  const key = process.env[`${provider.toUpperCase()}_API_KEY`];
  if (key) {
    console.log(`[API_KEYS] Using admin ${provider} key from environment`);
  }
  return key || null;
}

// Get API key (user's or admin's fallback)
export async function getApiKey(
  userId: string,
  provider: AIProvider
): Promise<string | null> {
  // Try user's key first
  const userKey = await getUserApiKey(userId, provider);
  if (userKey) {
    console.log(`[API_KEYS] Using user's ${provider} key`);
    return userKey;
  }

  // Fall back to admin key
  const adminKey = getAdminApiKey(provider);
  if (adminKey) {
    console.log(`[API_KEYS] No user key, using admin fallback for ${provider}`);
    return adminKey;
  }

  console.error(`[API_KEYS] No API key available for ${provider}`);
  return null;
}

// Add new API key for user
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

    // Check for duplicate
    const { data: existing } = await supabase
      .from('api_keys')
      .select('id')
      .eq('key_hash', hash)
      .single();

    if (existing) {
      throw new Error('This API key is already in use');
    }

    // Set as default if it's the first key for this provider
    const { data: existingKeys } = await supabase
      .from('api_keys')
      .select('id')
      .eq('user_id', userId)
      .eq('provider', provider);

    const isDefault = !existingKeys || existingKeys.length === 0;

    // Add key
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

// Delete API key
export async function deleteApiKey(keyId: string, userId: string): Promise<boolean> {
  try {
    const supabase = getServiceSupabase();

    // Verify ownership
    const { data: key, error: fetchError } = await supabase
      .from('api_keys')
      .select('user_id')
      .eq('id', keyId)
      .single();

    if (fetchError || !key || key.user_id !== userId) {
      throw new Error('Unauthorized');
    }

    // Delete
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

// Set key as default
export async function setDefaultApiKey(
  keyId: string,
  userId: string
): Promise<boolean> {
  try {
    const supabase = getServiceSupabase();

    // Get the key to find its provider
    const { data: key, error: fetchError } = await supabase
      .from('api_keys')
      .select('provider, user_id')
      .eq('id', keyId)
      .single();

    if (fetchError || !key || key.user_id !== userId) {
      throw new Error('Unauthorized');
    }

    // Unset all other defaults for this provider
    await supabase
      .from('api_keys')
      .update({ is_default: false })
      .eq('user_id', userId)
      .eq('provider', key.provider);

    // Set this one as default
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

// List user's API keys (without revealing the actual keys)
export async function listUserApiKeys(userId: string): Promise<APIKey[]> {
  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('api_keys')
      .select('id, user_id, provider, display_name, is_active, is_default, created_at, last_used_at, rotated_at')
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
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list API keys';
    console.error('[API_KEYS] Error:', message);
    await logError({ source: 'apiKeysService.listUserApiKeys', message });
    return [];
  }
}

// Track API key usage
export async function trackApiKeyUsage(
  apiKeyId: string,
  userId: string,
  provider: AIProvider,
  operation: 'embedding' | 'generation' | 'grading',
  tokensUsed?: number,
  success: boolean = true,
  errorMessage?: string
): Promise<void> {
  try {
    const supabase = getServiceSupabase();
    await supabase.from('api_key_usage').insert({
      api_key_id: apiKeyId,
      user_id: userId,
      provider,
      operation,
      tokens_used: tokensUsed,
      success,
      error_message: errorMessage,
    });

    // Update last_used_at
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', apiKeyId);
  } catch (error) {
    console.error('[API_KEYS] Failed to track usage:', error);
    // Don't throw - usage tracking shouldn't break the main operation
  }
}
