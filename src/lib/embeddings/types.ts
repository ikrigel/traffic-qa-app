export type EmbeddingProvider = 'claude' | 'gemini' | 'openai' | 'huggingface' | 'textsearch' | 'perplexity';

export interface EmbeddingResult {
  embedding: number[];
  dimensions: number;
  provider: EmbeddingProvider;
  model: string;
}
