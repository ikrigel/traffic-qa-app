import type { AIProvider } from '@/types';

export interface CandidateKey {
  keyId: string;
  apiKey: string;
  provider: AIProvider;
  source: 'user' | 'admin';
  priority?: number;
}
