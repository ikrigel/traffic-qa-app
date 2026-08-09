import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { embedWithFallback } from '@/lib/embeddings';
import { apiError } from '@/lib/apiErrors';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user || user.role !== 'super_admin') {
      return apiError('UNAUTHORIZED_KEY_ACCESS', 'Only super_admin can test embeddings', 403);
    }

    const body = await request.json() as { text?: string };
    const text = body.text || 'Test embedding with traffic laws content';

    console.log('[TEST-EMBED] Testing embedding fallback chain...');
    console.log('[TEST-EMBED] Input text length:', text.length);

    const result = await embedWithFallback(text);

    if (!result) {
      console.error('[TEST-EMBED] ❌ All providers failed');
      return NextResponse.json(
        {
          success: false,
          message: 'All embedding providers failed',
          details: 'Check admin logs for detailed error messages',
        },
        { status: 502 }
      );
    }

    console.log('[TEST-EMBED] ✅ Embedding successful via', result.provider);

    return NextResponse.json({
      success: true,
      provider: result.provider,
      model: result.model,
      dimensions: result.dimensions,
      embeddingLength: result.embedding.length,
      firstFiveValues: result.embedding.slice(0, 5),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[TEST-EMBED]', message);
    return apiError('INTERNAL_ERROR', message, 500);
  }
}
