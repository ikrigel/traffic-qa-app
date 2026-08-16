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
    // Use Gemini API v1 directly (SDK v1beta doesn't have the models)
    console.log('[GENERATION] Attempting to generate with Gemini API v1');

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

    const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${userPrompt}` : userPrompt;
    console.log('[GENERATION] Calling Gemini API v1 with prompt length:', fullPrompt.length);

    const model = 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;

    let response;
    try {
      const fetchResponse = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        }),
      });

      if (!fetchResponse.ok) {
        const errorText = await fetchResponse.text();
        throw new Error(`API returned ${fetchResponse.status}: ${errorText}`);
      }

      response = await fetchResponse.json();
      console.log('[GENERATION] Gemini response received');
    } catch (apiError) {
      const apiMsg = apiError instanceof Error ? apiError.message : String(apiError);
      const apiStack = apiError instanceof Error ? apiError.stack : '';
      console.error('[GENERATION] Gemini API error:', apiMsg);
      console.error('[GENERATION] Stack:', apiStack);
      throw new Error(`Gemini API error: ${apiMsg}`);
    }

    console.log('[GENERATION] Response structure:', {
      hasContent: !!response.candidates?.[0]?.content,
      partsCount: response.candidates?.[0]?.content?.parts?.length,
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text || !text.trim()) {
      console.error('[GENERATION] Empty response from Gemini - full response:', JSON.stringify(response, null, 2));
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
        apiVersion: 'v1',
      },
    });

    return {
      ok: false,
      code: 'ALL_KEYS_FAILED',
      attempts,
    };
  }
}
