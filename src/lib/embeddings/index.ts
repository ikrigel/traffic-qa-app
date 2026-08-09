/* eslint-disable no-console */
import { claudeEmbed } from './claude';
import type { EmbeddingResult } from './types';

// Import Gemini embedText but wrap it
const geminiEmbedText = async (text: string): Promise<number[]> => {
  // Dynamically require to avoid circular dependencies
  // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
  const { embedText } = require('../gemini');
  return embedText(text);
};

export async function embedWithFallback(text: string): Promise<EmbeddingResult | null> {
  console.log('[EMBED-DISPATCHER] 🔄 Starting embedding with fallback chain...');
  console.log('[EMBED-DISPATCHER] 📝 Text length:', text.length);

  // Try Claude first (best quality, user has paid access)
  console.log('[EMBED-DISPATCHER] 🎯 Attempting Claude embeddings (primary)...');
  try {
    const result = await claudeEmbed(text);
    console.log('[EMBED-DISPATCHER] ✅ Claude embedding successful');
    return result;
  } catch (claudeError) {
    console.warn('[EMBED-DISPATCHER] ⚠️ Claude embedding failed:', claudeError instanceof Error ? claudeError.message : String(claudeError));
  }

  // Fallback to Gemini
  console.log('[EMBED-DISPATCHER] 🔄 Falling back to Gemini embeddings...');
  try {
    const embedding = await geminiEmbedText(text);
    console.log('[EMBED-DISPATCHER] ✅ Gemini embedding successful');
    return {
      embedding,
      dimensions: embedding.length,
      provider: 'gemini',
      model: 'text-embedding-004',
    };
  } catch (geminiError) {
    console.warn('[EMBED-DISPATCHER] ⚠️ Gemini embedding failed:', geminiError instanceof Error ? geminiError.message : String(geminiError));
  }

  // All providers failed
  console.error('[EMBED-DISPATCHER] ❌ All embedding providers failed');
  return null;
}

// Export direct functions for backward compatibility
export async function embedText(text: string): Promise<number[]> {
  const result = await embedWithFallback(text);
  if (!result) {
    throw new Error('All embedding providers failed - unable to generate embeddings');
  }
  return result.embedding;
}
