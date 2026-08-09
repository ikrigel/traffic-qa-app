/* eslint-disable no-console */
import type { EmbeddingResult } from './types';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

console.log('[CLAUDE-EMBED] Initializing Claude embeddings');
console.log('[CLAUDE-EMBED] ANTHROPIC_API_KEY available:', !!ANTHROPIC_API_KEY);

export const claudeEmbed = async (text: string): Promise<EmbeddingResult> => {
  try {
    console.log('[CLAUDE-EMBED] 🔍 Starting Claude embedding...');
    console.log('[CLAUDE-EMBED] 📊 Text length:', text.length);

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not found in environment');
    }

    console.log('[CLAUDE-EMBED] 🤖 Making API request to Anthropic embeddings...');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: text.substring(0, 8000), // Limit text to avoid token issues
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    // Since Anthropic doesn't have a dedicated embeddings API yet,
    // we'll use a fallback approach
    console.log('[CLAUDE-EMBED] ⚠️ Claude embeddings not directly available yet');
    console.log('[CLAUDE-EMBED] 💡 Falling back to alternative embedding strategy');

    // For now, throw to trigger fallback to Gemini
    throw new Error('Claude embeddings API not yet available in current SDK version');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Embedding failed';
    console.error('[CLAUDE-EMBED] ❌ Error:', message);
    throw new Error(`Claude embedding failed: ${message}`);
  }
};
