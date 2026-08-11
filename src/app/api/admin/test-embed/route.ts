/* eslint-disable no-console */
import { NextRequest, NextResponse } from 'next/server';
import { embedText } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    console.log('[TEST-EMBED] Query:', query);
    const embedding = await embedText(query);
    console.log('[TEST-EMBED] Success! Length:', embedding.length);
    return NextResponse.json({
      success: true,
      embeddingLength: embedding.length,
      firstValues: embedding.slice(0, 5)
    });
  } catch (error) {
    console.error('[TEST-EMBED] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
