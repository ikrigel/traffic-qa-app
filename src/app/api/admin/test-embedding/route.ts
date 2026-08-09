import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { embedWithFallback } from '@/lib/embeddings';
import { apiError } from '@/lib/apiErrors';
import { appLog, logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user || user.role !== 'super_admin') {
      await logError({ source: 'test-embedding', message: 'Unauthorized access attempt', level: 'warn' });
      return apiError('UNAUTHORIZED_KEY_ACCESS', 'Only super_admin can test embeddings', 403);
    }

    const body = await request.json() as { text?: string };
    const text = body.text || 'Test embedding with traffic laws content';

    await appLog({ source: 'test-embedding', message: '🧪 Testing embedding fallback chain', context: { textLength: text.length } });

    const result = await embedWithFallback(text);

    if (!result) {
      await logError({ source: 'test-embedding', message: '❌ All embedding providers failed', level: 'error', context: { textLength: text.length } });
      return NextResponse.json(
        {
          success: false,
          message: 'All embedding providers failed',
          details: 'Check admin logs for detailed error messages',
        },
        { status: 502 }
      );
    }

    await appLog({ source: 'test-embedding', message: `✅ Embedding successful via ${result.provider}`, context: { dimensions: result.dimensions, provider: result.provider } });

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
    await logError({ source: 'test-embedding', message: `❌ Test embedding error: ${message}`, level: 'error' });
    return apiError('INTERNAL_ERROR', message, 500);
  }
}
