import { providers, ProviderCallError } from '@/lib/providers';
import { listCandidateKeys } from '@/lib/apiKeys';
import { trackApiKeyUsage } from '@/lib/apiKeys';
import { logError } from '@/lib/logger';
import type { DispatchResult, AttemptLog } from './types';

export async function generateWithFallback(
  userId: string,
  systemPrompt: string,
  userPrompt: string,
  operation: 'generation' | 'grading'
): Promise<DispatchResult> {
  const attempts: AttemptLog[] = [];

  try {
    const candidates = await listCandidateKeys(userId);

    if (candidates.length === 0) {
      return { ok: false, code: 'NO_API_KEY', attempts: [] };
    }

    for (const candidate of candidates) {
      try {
        const provider = providers[candidate.provider];
        if (!provider) {
          throw new Error(`Unknown provider: ${candidate.provider}`);
        }

        const text = await provider.generate(candidate.apiKey, systemPrompt, userPrompt);

        await trackApiKeyUsage(
          candidate.keyId,
          userId,
          candidate.provider,
          operation,
          undefined,
          true
        );

        return {
          ok: true,
          text,
          provider: candidate.provider,
          keySource: candidate.source,
          attempts,
        };
      } catch (error) {
        let errorCode: string = 'UNKNOWN';
        let errorMessage = 'Unknown error';

        if (error instanceof ProviderCallError) {
          errorCode = error.code;
          errorMessage = error.message;
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        attempts.push({
          provider: candidate.provider,
          source: candidate.source,
          keyId: candidate.keyId,
          errorCode: errorCode as any,
          errorMessage,
        });

        await trackApiKeyUsage(
          candidate.keyId,
          userId,
          candidate.provider,
          operation,
          undefined,
          false,
          errorMessage
        );
      }
    }

    await logError({
      source: 'dispatcher.generateWithFallback',
      message: `All fallback attempts failed for user ${userId}`,
      context: { attempts, operation },
    });

    return { ok: false, code: 'ALL_KEYS_FAILED', attempts };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Dispatch failed';
    await logError({
      source: 'dispatcher.generateWithFallback',
      message,
      context: { operation },
    });

    return { ok: false, code: 'ALL_KEYS_FAILED', attempts };
  }
}
