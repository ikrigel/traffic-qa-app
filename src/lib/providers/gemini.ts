import { GoogleGenerativeAI } from '@google/generative-ai';
import { ProviderCallError } from './errors';
import type { GenerationProvider, TestKeyResult } from './types';

const geminiProvider: GenerationProvider = {
  async generate(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
    try {
      const client = new GoogleGenerativeAI(apiKey);
      const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${userPrompt}` : userPrompt;

      const response = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      });

      const textContent = response.response.candidates?.[0]?.content?.parts?.[0] as { text?: string } | undefined;
      if (!textContent || !('text' in textContent) || !textContent.text) {
        throw new Error('No text response from Gemini');
      }

      return textContent.text;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Generation failed';
      if (message.includes('API key')) throw new ProviderCallError('INVALID_KEY', message);
      if (message.includes('quota') || message.includes('rate')) throw new ProviderCallError('RATE_LIMITED', message);
      throw new ProviderCallError('UNKNOWN', message);
    }
  },

  async testKey(apiKey: string): Promise<TestKeyResult> {
    try {
      const client = new GoogleGenerativeAI(apiKey);
      const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });

      await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: 'test' }] }],
      });

      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Test failed';
      if (message.includes('API key') || message.includes('401') || message.includes('403')) {
        return { ok: false, errorCode: 'INVALID_KEY', errorMessage: 'Invalid API key' };
      }
      if (message.includes('quota') || message.includes('rate') || message.includes('429')) {
        return { ok: false, errorCode: 'RATE_LIMITED', errorMessage: 'Rate limit exceeded' };
      }
      return { ok: false, errorCode: 'UNKNOWN', errorMessage: message };
    }
  },
};

export default geminiProvider;
