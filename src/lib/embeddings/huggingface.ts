/* eslint-disable no-console */
import type { EmbeddingResult } from './types';

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;

console.log('[HF-EMBED] Initializing HuggingFace embeddings');
console.log('[HF-EMBED] HUGGINGFACE_API_KEY available:', !!HF_API_KEY);

export const huggingfaceEmbed = async (text: string): Promise<EmbeddingResult> => {
  try {
    console.log('[HF-EMBED] 🔍 Starting HuggingFace embedding...');
    console.log('[HF-EMBED] 📊 Text length:', text.length);

    // Use sentence-transformers model via HuggingFace API
    const modelId = 'sentence-transformers/all-MiniLM-L6-v2';
    const apiUrl = `https://api-inference.huggingface.co/models/${modelId}`;

    console.log('[HF-EMBED] 🤖 Calling HuggingFace API...');

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(HF_API_KEY ? { Authorization: `Bearer ${HF_API_KEY}` } : {}),
      },
      body: JSON.stringify({
        inputs: text.substring(0, 512), // Limit to avoid truncation
        wait_for_model: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HuggingFace API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as any;

    // HuggingFace returns array of embeddings
    let embedding: number[] = [];
    if (Array.isArray(data) && data.length > 0) {
      embedding = data[0];
    } else if (data.embeddings) {
      embedding = data.embeddings;
    }

    if (!embedding || embedding.length === 0) {
      throw new Error('No embedding in response');
    }

    console.log('[HF-EMBED] ✅ Embedding successful');
    console.log('[HF-EMBED] 📈 Dimensions:', embedding.length);

    return {
      embedding,
      dimensions: embedding.length,
      provider: 'huggingface',
      model: modelId,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Embedding failed';
    console.error('[HF-EMBED] ❌ Error:', message);
    throw new Error(`HuggingFace embedding failed: ${message}`);
  }
};
