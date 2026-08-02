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
    const client = getGeminiClient();
    const model = client.getGenerativeModel({ model: 'embedding-001' });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Embedding failed';
    await logError({ source: 'gemini.embedText', message });
    throw error;
  }
};

export const generateAnswer = async (
  systemPrompt: string,
  userPrompt: string
): Promise<string> => {
  try {
    const client = getGeminiClient();
    const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const response = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
        },
      ],
    });
    const textContent = response.response.candidates?.[0]?.content?.parts?.[0] as {text?: string} | undefined;
    if (!textContent || !('text' in textContent)) {
      throw new Error('No text response from Gemini');
    }
    return textContent.text || '';
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Generation failed';
    await logError({ source: 'gemini.generateAnswer', message });
    throw error;
  }
};
