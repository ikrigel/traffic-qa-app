/* eslint-disable no-console */
import { claudeEmbed } from './claude';
import { openaiEmbed } from './openai';
import { huggingfaceEmbed } from './huggingface';
import { textSearchEmbed } from './textsearch';
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

  // 1. Try Claude first (best quality, user has paid access)
  console.log('[EMBED-DISPATCHER] 1️⃣ Attempting Claude embeddings (primary)...');
  try {
    const result = await claudeEmbed(text);
    console.log('[EMBED-DISPATCHER] ✅ Claude embedding successful');
    return result;
  } catch (error) {
    console.warn('[EMBED-DISPATCHER] ⚠️ Claude failed:', error instanceof Error ? error.message : String(error));
  }

  // 2. Fallback to Gemini
  console.log('[EMBED-DISPATCHER] 2️⃣ Falling back to Gemini embeddings...');
  try {
    const embedding = await geminiEmbedText(text);
    console.log('[EMBED-DISPATCHER] ✅ Gemini embedding successful');
    return {
      embedding,
      dimensions: embedding.length,
      provider: 'gemini',
      model: 'text-embedding-004',
    };
  } catch (error) {
    console.warn('[EMBED-DISPATCHER] ⚠️ Gemini failed:', error instanceof Error ? error.message : String(error));
  }

  // 3. Fallback to OpenAI
  console.log('[EMBED-DISPATCHER] 3️⃣ Falling back to OpenAI embeddings...');
  try {
    const result = await openaiEmbed(text);
    console.log('[EMBED-DISPATCHER] ✅ OpenAI embedding successful');
    return result;
  } catch (error) {
    console.warn('[EMBED-DISPATCHER] ⚠️ OpenAI failed:', error instanceof Error ? error.message : String(error));
  }

  // 4. Fallback to HuggingFace (free API)
  console.log('[EMBED-DISPATCHER] 4️⃣ Falling back to HuggingFace embeddings (free)...');
  try {
    const result = await huggingfaceEmbed(text);
    console.log('[EMBED-DISPATCHER] ✅ HuggingFace embedding successful');
    return result;
  } catch (error) {
    console.warn('[EMBED-DISPATCHER] ⚠️ HuggingFace failed:', error instanceof Error ? error.message : String(error));
  }

  // 5. Last resort: Text-based keyword search (always works!)
  console.log('[EMBED-DISPATCHER] 5️⃣ Using text-based keyword search (fallback)...');
  try {
    const result = await textSearchEmbed(text);
    console.log('[EMBED-DISPATCHER] ✅ Text search embedding successful');
    return result;
  } catch (error) {
    console.error('[EMBED-DISPATCHER] ❌ Text search failed:', error instanceof Error ? error.message : String(error));
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
