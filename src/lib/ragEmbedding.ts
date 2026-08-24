'use server';

import { logError } from './logger';

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const message = lastError.message;

      // Check if it's a rate limit error (429)
      const isRateLimit = message.includes('429') || message.includes('RESOURCE_EXHAUSTED');

      if (!isRateLimit || attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`[RAG-EMBED] Rate limit hit, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
      await sleep(delay);
    }
  }

  throw lastError;
}

async function extractEmbedding(result: unknown, idx: number = 0): Promise<number[]> {
  // Handle different response formats from Pinecone SDK
  let embedding: number[] | undefined;
  const obj = result as any;

  // Try data property (most likely for Pinecone SDK)
  if (obj?.data && Array.isArray(obj.data) && obj.data.length > idx) {
    const item = obj.data[idx];
    if (item?.values && Array.isArray(item.values)) {
      embedding = item.values;
    } else if (Array.isArray(item)) {
      embedding = item;
    }
  }
  // Try embeddings property
  else if (obj?.embeddings && Array.isArray(obj.embeddings) && obj.embeddings.length > idx) {
    const item = obj.embeddings[idx];
    if (item?.values && Array.isArray(item.values)) {
      embedding = item.values;
    } else if (Array.isArray(item)) {
      embedding = item;
    }
  }
  // Try direct array access
  else if (Array.isArray(result) && result.length > idx) {
    const item = (result as any[])[idx];
    if (item?.values && Array.isArray(item.values)) {
      embedding = item.values;
    } else if (Array.isArray(item)) {
      embedding = item;
    }
  }
  // Try direct values property (fallback)
  else if (idx === 0 && obj?.values && Array.isArray(obj.values)) {
    embedding = obj.values;
  }

  if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
    throw new Error(`Failed to extract embedding at index ${idx}: got ${typeof embedding}, length: ${Array.isArray(embedding) ? embedding.length : 'N/A'}`);
  }

  return embedding;
}

export async function embedPassage(text: string): Promise<number[]> {
  try {
    return await withRetry(async () => {
      const { getPineconeClient } = await import('./pinecone');
      const pc = getPineconeClient();

      const result = await pc.inference.embed({
        model: 'multilingual-e5-large',
        inputs: [text],
        parameters: { input_type: 'passage', truncate: 'END' },
      }) as unknown;

      return extractEmbedding(result, 0);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[RAG-EMBED] embedPassage error:', message);
    await logError({ source: 'ragEmbedding.embedPassage', message });
    throw error;
  }
}

export async function embedQuery(text: string): Promise<number[]> {
  try {
    return await withRetry(async () => {
      const { getPineconeClient } = await import('./pinecone');
      const pc = getPineconeClient();

      const result = await pc.inference.embed({
        model: 'multilingual-e5-large',
        inputs: [text],
        parameters: { input_type: 'query', truncate: 'END' },
      }) as unknown;

      return extractEmbedding(result, 0);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[RAG-EMBED] embedQuery error:', message);
    await logError({ source: 'ragEmbedding.embedQuery', message });
    throw error;
  }
}

export async function embedPassagesBatch(texts: string[]): Promise<number[][]> {
  try {
    if (texts.length === 0) return [];

    return await withRetry(async () => {
      const { getPineconeClient } = await import('./pinecone');
      const pc = getPineconeClient();

      const result = await pc.inference.embed({
        model: 'multilingual-e5-large',
        inputs: texts,
        parameters: { input_type: 'passage', truncate: 'END' },
      }) as unknown;

      const embeddings: number[][] = [];
      for (let i = 0; i < texts.length; i++) {
        embeddings.push(await extractEmbedding(result, i));
      }

      return embeddings;
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[RAG-EMBED] embedPassagesBatch error:', message);
    await logError({ source: 'ragEmbedding.embedPassagesBatch', message });
    throw error;
  }
}
