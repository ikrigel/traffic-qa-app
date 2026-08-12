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

    const client = getGeminiClient();
    const models = ['text-embedding-004', 'embedding-001'];
    const errors: Record<string, string> = {};

    for (const modelName of models) {
      try {
        console.log(`[GEMINI] Trying model: ${modelName}...`);
        const model = client.getGenerativeModel({ model: modelName });
        const result = await model.embedContent(text);
        console.log(`[GEMINI] ✅ Embedding successful with ${modelName}, dimensions:`, result.embedding.values.length);
        return result.embedding.values;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        errors[modelName] = msg;
        console.log(`[GEMINI] ⚠️ Model ${modelName} failed:`, msg);
        console.log(`[GEMINI] Error details:`, error);
      }
    }

    const errorSummary = Object.entries(errors).map(([model, msg]) => `${model}: ${msg}`).join(' | ');
    const fullError = `All embedding models failed: ${errorSummary}`;
    console.error('[GEMINI] ❌ All models failed:', errors);
    throw new Error(fullError);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Embedding failed';
    console.error('[GEMINI] ❌ Final embedding error:', message);
    await logError({ source: 'gemini.embedText', message, context: { errorDetails: String(error) } });
    throw error;
  }
};
