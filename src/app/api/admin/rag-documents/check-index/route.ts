/* eslint-disable no-console */
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { getPineconeClient } from '@/lib/pinecone';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ['super_admin']);
  if (!auth.authorized) return auth.response;

  try {
    const client = getPineconeClient();
    const indexName = process.env.PINECONE_INDEX_NAME || 'traffic-rag';

    console.log('[INDEX-CHECK] Fetching index description...');
    const indexDescription = await client.describeIndex(indexName);

    console.log('[INDEX-CHECK] Index info:', indexDescription);

    return NextResponse.json({
      success: true,
      indexName,
      dimension: indexDescription.dimension,
      status: indexDescription.status,
      host: indexDescription.host,
      metric: indexDescription.metric,
      message: `✅ Index "${indexName}" is configured with ${indexDescription.dimension}D vectors`,
      needsRecreation: indexDescription.dimension !== 1024,
      instructions: indexDescription.dimension !== 1024
        ? `❌ Index has ${indexDescription.dimension}D but needs 1024D. Delete and recreate with dimension: 1024`
        : `✅ Index is correctly configured for 1024D vectors`,
    });
  } catch (error) {
    console.error('[INDEX-CHECK] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
