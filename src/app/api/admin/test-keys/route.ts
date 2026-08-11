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

    console.log('[TEST-KEYS] Checking API keys in environment...');

    const keys = {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? `✅ (${process.env.GEMINI_API_KEY.substring(0, 10)}...)` : '❌ Missing',
      GROQ_API_KEY: process.env.GROQ_API_KEY ? `✅ (${process.env.GROQ_API_KEY.substring(0, 10)}...)` : '❌ Missing',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? `✅ (${process.env.OPENAI_API_KEY.substring(0, 10)}...)` : '❌ Missing',
      HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY ? `✅ (${process.env.HUGGINGFACE_API_KEY.substring(0, 10)}...)` : '❌ Missing',
    };

    console.log('[TEST-KEYS] Keys status:', keys);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      keys
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
