/* eslint-disable no-console */
import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { query } = await request.json();
    const testPrompt = query || 'Hello, this is a test.';

    console.log('[PROVIDER-TEST] Testing all generation providers...');

    const results: Record<string, any> = {};

    // Test Gemini
    console.log('[PROVIDER-TEST] Testing Gemini...');
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        results.gemini = { success: false, error: 'GEMINI_API_KEY not set' };
      } else {
        const client = new GoogleGenerativeAI(key);
        const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const response = await model.generateContent(testPrompt);
        results.gemini = { success: true, textLength: response.response.text().length };
      }
    } catch (error) {
      results.gemini = { success: false, error: error instanceof Error ? error.message : String(error) };
    }

    // Test Groq
    console.log('[PROVIDER-TEST] Testing Groq...');
    try {
      const key = process.env.GROQ_API_KEY;
      if (!key) {
        results.groq = { success: false, error: 'GROQ_API_KEY not set' };
      } else {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'mixtral-8x7b-32768',
            messages: [{ role: 'user', content: testPrompt }],
            max_tokens: 100,
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          results.groq = { success: false, error: data.error?.message || `HTTP ${response.status}` };
        } else {
          results.groq = { success: true, textLength: data.choices[0]?.message?.content?.length || 0 };
        }
      }
    } catch (error) {
      results.groq = { success: false, error: error instanceof Error ? error.message : String(error) };
    }

    // Test OpenAI
    console.log('[PROVIDER-TEST] Testing OpenAI...');
    try {
      const key = process.env.OPENAI_API_KEY;
      if (!key) {
        results.openai = { success: false, error: 'OPENAI_API_KEY not set' };
      } else {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: testPrompt }],
            max_tokens: 100,
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          results.openai = { success: false, error: data.error?.message || `HTTP ${response.status}` };
        } else {
          results.openai = { success: true, textLength: data.choices[0]?.message?.content?.length || 0 };
        }
      }
    } catch (error) {
      results.openai = { success: false, error: error instanceof Error ? error.message : String(error) };
    }

    const successful = Object.values(results).filter((r: any) => r.success).length;
    const failed = Object.values(results).filter((r: any) => !r.success).length;

    console.log(`[PROVIDER-TEST] Results: ${successful} successful, ${failed} failed`);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      successful,
      failed,
      results
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[PROVIDER-TEST] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
