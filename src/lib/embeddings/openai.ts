/* eslint-disable no-console */
import type { EmbeddingResult } from './types';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

console.log('[OPENAI-EMBED] Initializing OpenAI embeddings');
console.log('[OPENAI-EMBED] OPENAI_API_KEY available:', !!OPENAI_API_KEY);

export const openaiEmbed = async (text: string): Promise<EmbeddingResult> => {
  try {
    console.log('[OPENAI-EMBED] 🔍 Starting OpenAI embedding...');
    console.log('[OPENAI-EMBED] 📊 Text length:', text.length);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not found in environment');
    }

    console.log('[OPENAI-EMBED] 🤖 Calling OpenAI API...');

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: text.substring(0, 8000), // OpenAI has ~8k token limit
        model: 'text-embedding-3-small',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as any;

    if (!data.data || !data.data[0] || !data.data[0].embedding) {
      throw new Error('No embedding in response');
    }

    const embedding = data.data[0].embedding;

    console.log('[OPENAI-EMBED] ✅ Embedding successful');
    console.log('[OPENAI-EMBED] 📈 Dimensions:', embedding.length);

    return {
      embedding,
      dimensions: embedding.length,
      provider: 'openai',
      model: 'text-embedding-3-small',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Embedding failed';
    console.error('[OPENAI-EMBED] ❌ Error:', message);
    throw new Error(`OpenAI embedding failed: ${message}`);
  }
};
