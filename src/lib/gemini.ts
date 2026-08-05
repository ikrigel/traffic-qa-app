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

export const generateAnswer = async (
  systemPrompt: string,
  userPrompt: string
): Promise<string> => {
  try {
    console.log('[GEMINI] Generating answer...');
    const client = getGeminiClient();
    const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${userPrompt}` : userPrompt;
    console.log('[GEMINI] Prompt length:', fullPrompt.length);

    const response = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: fullPrompt }],
        },
      ],
    });

    console.log('[GEMINI] Got response, checking content...');
    const textContent = response.response.candidates?.[0]?.content?.parts?.[0] as {text?: string} | undefined;
    if (!textContent || !('text' in textContent)) {
      console.error('[GEMINI] No text response in:', response.response.candidates?.[0]?.content?.parts);
      throw new Error('No text response from Gemini');
    }

    const text = textContent.text || '';
    console.log('[GEMINI] Generated answer length:', text.length);
    return text;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Generation failed';
    console.error('[GEMINI] Generation error:', message, error);
    await logError({ source: 'gemini.generateAnswer', message });
    throw error;
  }
};
