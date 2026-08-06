import { ProviderCallError } from './errors';
import type { GenerationProvider, TestKeyResult } from './types';

const huggingfaceProvider: GenerationProvider = {
  async generate(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
    try {
      const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${userPrompt}` : userPrompt;

      const response = await fetch(
        'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: fullPrompt,
            parameters: {
              max_length: 512,
              temperature: 0.7,
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        if (response.status === 401 || response.status === 403) {
          throw new ProviderCallError('INVALID_KEY', 'Invalid API key');
        }
        if (response.status === 429 || response.status === 503) {
          throw new ProviderCallError('RATE_LIMITED', 'Service busy or rate limited');
        }
        throw new ProviderCallError('UNKNOWN', error);
      }

      const data = await response.json() as any;
      const text = Array.isArray(data) ? data[0]?.generated_text : data.generated_text;
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
      const response = await fetch('https://huggingface.co/api/whoami-v2', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          return { ok: false, errorCode: 'INVALID_KEY', errorMessage: 'Invalid API token' };
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

export default huggingfaceProvider;
