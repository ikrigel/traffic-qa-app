import type { AIProvider } from '@/types';
import type { ProviderErrorCode } from '@/lib/providers';

export interface AttemptLog {
  provider: AIProvider;
  source: 'user' | 'admin';
  keyId?: string;
  errorCode?: ProviderErrorCode;
  errorMessage?: string;
}

export type DispatchResult =
  | {
      ok: true;
      text: string;
      provider: AIProvider;
      keySource: 'user' | 'admin';
      attempts: AttemptLog[];
    }
  | {
      ok: false;
      code: 'NO_API_KEY' | 'ALL_KEYS_FAILED';
      attempts: AttemptLog[];
    };
