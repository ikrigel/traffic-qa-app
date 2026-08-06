export type ProviderErrorCode = 'INVALID_KEY' | 'RATE_LIMITED' | 'PROVIDER_UNREACHABLE' | 'UNSUPPORTED' | 'UNKNOWN';

export interface TestKeyResult {
  ok: boolean;
  errorCode?: ProviderErrorCode;
  errorMessage?: string;
}

export interface GenerationProvider {
  generate(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string>;
  testKey(apiKey: string): Promise<TestKeyResult>;
}
