export type AIProvider = 'gemini' | 'groq' | 'openai' | 'huggingface';

export interface AttemptLog {
  provider: AIProvider;
  source: 'user' | 'admin';
  keyId?: string;
  errorCode?: string;
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
