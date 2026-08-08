import { ProviderCallError } from './errors';
import type { GenerationProvider, TestKeyResult } from './types';

const groqProvider: GenerationProvider = {
  async generate(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
    try {
      const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${userPrompt}` : userPrompt;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: fullPrompt }],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        if (response.status === 401 || response.status === 403) {
          throw new ProviderCallError('INVALID_KEY', 'Invalid API key');
        }
        if (response.status === 429) {
          throw new ProviderCallError('RATE_LIMITED', 'Rate limit exceeded');
        }
        throw new ProviderCallError('UNKNOWN', error);
      }

      const data = await response.json() as any;
      const text = data.choices?.[0]?.message?.content;
      if (!text) throw new Error('No text in response');

      return text;
    } catch (error) {
      if (error instanceof ProviderCallError) throw error;
      const message = error instanceof Error ? error.message : 'Generation failed';
      throw new ProviderCallError('UNKNOWN', message);
    }
  },

  async testKey(apiKey: string): Promise<TestKeyResult> {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          return { ok: false, errorCode: 'INVALID_KEY', errorMessage: 'Invalid API key' };
        }
        if (response.status === 429) {
          return { ok: false, errorCode: 'RATE_LIMITED', errorMessage: 'Rate limit exceeded' };
        }
        return { ok: false, errorCode: 'UNKNOWN', errorMessage: `HTTP ${response.status}` };
      }

      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Test failed';
      return { ok: false, errorCode: 'PROVIDER_UNREACHABLE', errorMessage: message };
    }
  },
};

export default groqProvider;
