/* eslint-disable no-console */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logError } from './logger';

let cachedClient: GoogleGenerativeAI | null = null;

const getGeminiClient = (): GoogleGenerativeAI => {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Missing GEMINI_API_KEY');
  cachedClient = new GoogleGenerativeAI(apiKey);
  return cachedClient;
};

export const embedText = async (text: string): Promise<number[]> => {
  try {
    console.log('[GEMINI] Embedding text, length:', text.length);
    const client = getGeminiClient();
    const model = client.getGenerativeModel({ model: 'embedding-001' });
    const result = await model.embedContent(text);
    console.log('[GEMINI] Embedding successful, dimensions:', result.embedding.values.length);
    return result.embedding.values;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Embedding failed';
    console.error('[GEMINI] Embedding error:', message, error);
    await logError({ source: 'gemini.embedText', message });
    throw error;
  }
};
