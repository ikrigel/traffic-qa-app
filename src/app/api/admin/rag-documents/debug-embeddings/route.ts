/* eslint-disable no-console */
import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = getServiceSupabase();

    // Check total documents
    const { data: totalData, count: totalCount } = await supabase
      .from('rag_documents')
      .select('id', { count: 'exact' });

    console.log(`[DEBUG] Total documents: ${totalCount}`);

    // Check documents with embeddings
    const { data: withEmbedData, count: embeddedCount } = await supabase
      .from('rag_documents')
      .select('id', { count: 'exact' })
      .not('embedding', 'is', null);

    console.log(`[DEBUG] Documents with embeddings: ${embeddedCount}`);

    // Get a sample document with embedding to check structure
    const { data: sampleDocs } = await supabase
      .from('rag_documents')
      .select('id, title, embedding')
      .not('embedding', 'is', null)
      .limit(1);

    console.log(`[DEBUG] Sample document:`, sampleDocs?.[0]);

    // Check if embedding is an array
    if (sampleDocs && sampleDocs.length > 0) {
      const emb = sampleDocs[0].embedding;
      console.log(`[DEBUG] Embedding type: ${typeof emb}`);
      console.log(`[DEBUG] Is array: ${Array.isArray(emb)}`);
      if (Array.isArray(emb)) {
        console.log(`[DEBUG] Embedding length: ${emb.length}`);
        console.log(`[DEBUG] First 3 values: ${emb.slice(0, 3)}`);
      }
    }

    // Test RPC function manually
    console.log(`[DEBUG] Testing RPC function...`);
    const testEmbedding = new Array(768).fill(0.1);
    const { data: rpcResult, error: rpcError } = await supabase.rpc('match_rag_documents', {
      query_embedding: testEmbedding,
      match_count: 3,
    });

    console.log(`[DEBUG] RPC error:`, rpcError);
    console.log(`[DEBUG] RPC result count:`, rpcResult?.length);

    return NextResponse.json({
      totalDocuments: totalCount,
      documentsWithEmbedding: embeddedCount,
      documentsWithoutEmbedding: (totalCount || 0) - (embeddedCount || 0),
      sampleDocument: sampleDocs?.[0]
        ? {
            id: sampleDocs[0].id,
            title: sampleDocs[0].title,
            embeddingType: typeof sampleDocs[0].embedding,
            embeddingIsArray: Array.isArray(sampleDocs[0].embedding),
            embeddingLength: Array.isArray(sampleDocs[0].embedding)
              ? sampleDocs[0].embedding.length
              : null,
          }
        : null,
      rpcFunctionWorks: !rpcError && rpcResult?.length >= 0,
      rpcError: rpcError?.message,
      rpcResultCount: rpcResult?.length || 0,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[DEBUG] Error:', msg);
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
