/* eslint-disable no-console */
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { getPineconeIndex } from '@/lib/pinecone';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ['super_admin']);
  if (!auth.authorized) return auth.response;

  try {
    console.log('[PINECONE-TEST] Testing Pinecone connection...');

    const index = getPineconeIndex();
    const indexName = process.env.PINECONE_INDEX_NAME || 'traffic-rag';
    const apiKey = process.env.PINECONE_API_KEY;

    console.log('[PINECONE-TEST] Configuration:', {
      indexName,
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length,
    });

    // Test 1: Get index stats
    console.log('[PINECONE-TEST] Attempting describeIndexStats...');
    const stats = await index.describeIndexStats();
    console.log('[PINECONE-TEST] ✅ describeIndexStats successful:', stats);

    // Test 2: Try a simple query
    console.log('[PINECONE-TEST] Attempting test query with dummy vector...');
    const testVector = new Array(768).fill(0.1);
    const queryResult = await index.query({
      vector: testVector,
      topK: 1,
      includeMetadata: true,
    });
    console.log('[PINECONE-TEST] ✅ Query successful, found:', queryResult.matches?.length || 0, 'matches');

    // Test 3: Try upsert
    console.log('[PINECONE-TEST] Attempting test upsert...');
    const testId = `test-${Date.now()}`;
    await index.upsert({
      records: [
        {
          id: testId,
          values: testVector,
          metadata: { test: true, timestamp: new Date().toISOString() },
        },
      ],
    });
    console.log('[PINECONE-TEST] ✅ Upsert successful');

    // Test 4: Delete test vector
    console.log('[PINECONE-TEST] Cleaning up test vector...');
    await index.deleteMany({ ids: [testId] });
    console.log('[PINECONE-TEST] ✅ Cleanup successful');

    return NextResponse.json({
      success: true,
      message: '✅ Pinecone connection is working!',
      config: {
        indexName,
        endpoint: 'https://traffic-rag-84g61ip.svc.aped-4627-b74a.pinecone.io',
      },
      tests: {
        describeIndexStats: '✅ Pass',
        query: '✅ Pass',
        upsert: '✅ Pass',
        delete: '✅ Pass',
      },
      stats,
    });
  } catch (error) {
    console.error('[PINECONE-TEST] ❌ Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        details: {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack',
        },
      },
      { status: 500 }
    );
  }
}
