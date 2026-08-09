export type EmbeddingProvider = 'claude' | 'gemini' | 'perplexity';

export interface EmbeddingResult {
  embedding: number[];
  dimensions: number;
  provider: EmbeddingProvider;
  model: string;
}
