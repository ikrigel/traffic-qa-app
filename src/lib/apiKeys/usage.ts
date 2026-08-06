import { getServiceSupabase } from '@/lib/supabase';
import type { AIProvider } from '@/types';

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

    if (success) {
      await supabase
        .from('api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', apiKeyId);
    }
  } catch (error) {
    console.error('[API_KEYS] Failed to track usage:', error);
  }
}
