/* eslint-disable no-console */
import { logError } from '../logger';
import type { DispatchResult, AttemptLog } from './types';

export async function generateWithFallback(
  userId: string,
  systemPrompt: string,
  userPrompt: string,
  operation: 'generation' | 'grading'
): Promise<DispatchResult> {
  console.log(`[GENERATION] Starting ${operation} for user ${userId}`);

  const attempts: AttemptLog[] = [];
  let apiKey: string | undefined;

  try {
    // Use Gemini for generation (simplest working path)
    console.log('[GENERATION] Attempting to generate with Gemini');

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error('[GENERATION] No GEMINI_API_KEY found');
      await logError({
        source: 'generation/dispatcher',
        message: 'No API key available for generation',
      });

      return {
        ok: false,
        code: 'NO_API_KEY',
        attempts,
      };
    }

    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${userPrompt}` : userPrompt;
    console.log('[GENERATION] Calling Gemini API with prompt length:', fullPrompt.length);

    let response;
    try {
      response = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      });
      console.log('[GENERATION] Gemini response received, status:', response.response.promptFeedback?.blockReason);
    } catch (apiError) {
      const apiMsg = apiError instanceof Error ? apiError.message : String(apiError);
      const apiStack = apiError instanceof Error ? apiError.stack : '';
      console.error('[GENERATION] Gemini API error:', apiMsg);
      console.error('[GENERATION] Stack:', apiStack);
      throw new Error(`Gemini API error: ${apiMsg}`);
    }

    console.log('[GENERATION] Response structure:', {
      hasResponse: !!response.response,
      blockReason: response.response.promptFeedback?.blockReason,
      candidatesCount: response.response.candidates?.length,
      firstCandidateStatus: response.response.candidates?.[0]?.finishReason,
    });

    const textContent = response.response.candidates?.[0]?.content?.parts?.[0] as { text?: string } | undefined;
    const text = textContent?.text;

    if (!text || !text.trim()) {
      console.error('[GENERATION] Empty response from Gemini - full response structure:', JSON.stringify(response.response, null, 2));
      throw new Error('Empty response from Gemini');
    }

    console.log('[GENERATION] ✅ Success with gemini, length:', text.length);

    return {
      ok: true,
      text,
      provider: 'gemini',
      keySource: 'admin',
      attempts: [
        {
          provider: 'gemini',
          source: 'admin',
        },
      ],
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const fullError = error instanceof Error ? error.stack : String(error);
    console.error('[GENERATION] ❌ Generation failed:', msg);
    console.error('[GENERATION] Full error stack:', fullError);
    console.error('[GENERATION] Error object:', error);

    // Try to extract more details from the error
    let errorDetails = '';
    if (error instanceof Error && 'cause' in error) {
      errorDetails = String((error as any).cause);
      console.error('[GENERATION] Error cause:', errorDetails);
    }

    attempts.push({
      provider: 'gemini',
      source: 'admin',
      errorMessage: msg,
    });

    await logError({
      source: 'generation/dispatcher',
      message: `Generation failed: ${msg}`,
      level: 'error',
      context: {
        operation,
        fullError: fullError,
        errorDetails: errorDetails,
        apiKeyExists: !!apiKey,
        apiKeyLength: apiKey?.length || 0,
        geminiModelUsed: 'gemini-1.5-flash',
      },
    });

    return {
      ok: false,
      code: 'ALL_KEYS_FAILED',
      attempts,
    };
  }
}
