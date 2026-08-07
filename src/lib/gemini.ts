/* eslint-disable no-console */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logError } from './logger';

const GEMINI_KEY = process.env.GEMINI_API_KEY;

console.log('[GEMINI-INIT] Module loading - checking GEMINI_API_KEY');
console.log('[GEMINI-INIT] process.env.GEMINI_API_KEY defined:', !!GEMINI_KEY);
if (GEMINI_KEY) {
  console.log('[GEMINI-INIT] Key length:', GEMINI_KEY.length, 'First 10 chars:', GEMINI_KEY.substring(0, 10));
} else {
  console.log('[GEMINI-INIT] ⚠️ GEMINI_API_KEY is UNDEFINED in process.env');
  console.log('[GEMINI-INIT] process.env keys:', Object.keys(process.env).filter(k => k.includes('GEMINI') || k.includes('google') || k.includes('API')));
}

let cachedClient: GoogleGenerativeAI | null = null;

const getGeminiClient = (): GoogleGenerativeAI => {
  if (cachedClient) {
    console.log('[GEMINI] Using cached client');
    return cachedClient;
  }
  console.log('[GEMINI] Creating new client - checking GEMINI_API_KEY');
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('[GEMINI] process.env.GEMINI_API_KEY defined:', !!apiKey);
  if (apiKey) {
    console.log('[GEMINI] Key found, length:', apiKey.length, 'First 10:', apiKey.substring(0, 10));
  } else {
    console.log('[GEMINI] ⚠️ GEMINI_API_KEY is undefined');
    console.log('[GEMINI] All env keys with GEMINI/API:', Object.keys(process.env).filter(k => k.toUpperCase().includes('GEMINI') || k.toUpperCase().includes('API_KEY')));
  }
  if (!apiKey) throw new Error(`Missing GEMINI_API_KEY - not found in process.env (checked ${Object.keys(process.env).length} env vars)`);
  cachedClient = new GoogleGenerativeAI(apiKey);
  console.log('[GEMINI] Client created successfully');
  return cachedClient;
};

export const embedText = async (text: string): Promise<number[]> => {
  try {
    console.log('[GEMINI] ===== embedText called =====');
    console.log('[GEMINI] Text length:', text.length);
    console.log('[GEMINI] GEMINI_KEY constant value:', !!GEMINI_KEY, GEMINI_KEY ? `(${GEMINI_KEY.length} chars)` : '(undefined)');

    console.log('[GEMINI] Getting client...');
    const client = getGeminiClient();
    console.log('[GEMINI] Client obtained, getting model...');

    console.log('[GEMINI] Getting embedding model (text-embedding-004)...');
    const model = client.getGenerativeModel({ model: 'text-embedding-004' });
    console.log('[GEMINI] Model obtained, calling embedContent...');

    const result = await model.embedContent(text);
    console.log('[GEMINI] ✅ Embedding successful, dimensions:', result.embedding.values.length);
    return result.embedding.values;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Embedding failed';
    console.error('[GEMINI] ❌ Embedding error:', message);
    console.error('[GEMINI] Error type:', error?.constructor?.name);
    console.error('[GEMINI] Full error:', error);
    await logError({ source: 'gemini.embedText', message, context: { errorType: error?.constructor?.name } });
    throw error;
  }
};
