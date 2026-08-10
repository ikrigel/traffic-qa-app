/* eslint-disable no-console */
import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { retrieveRelevantDocuments } from '@/lib/rag';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { query } = await request.json();
    if (!query) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    console.log('[RAG-TEST] Testing retrieval for query:', query);

    // Get document stats
    const supabase = getServiceSupabase();
    const { data: allDocs, error: statsError } = await supabase
      .from('rag_documents')
      .select('id, title, embedding', { count: 'exact' });

    console.log('[RAG-TEST] Total documents:', allDocs?.length || 0);

    const withEmbedding = allDocs?.filter(d => d.embedding).length || 0;
    const withoutEmbedding = (allDocs?.length || 0) - withEmbedding;

    console.log('[RAG-TEST] With embedding:', withEmbedding);
    console.log('[RAG-TEST] Without embedding:', withoutEmbedding);

    // Try retrieval
    console.log('[RAG-TEST] Attempting retrieval...');
    const retrievedDocs = await retrieveRelevantDocuments(query, 5);

    console.log('[RAG-TEST] Retrieved documents:', retrievedDocs.length);
    retrievedDocs.forEach((doc, i) => {
      console.log(`[RAG-TEST] [${i}] ${doc.title} (similarity: ${doc.similarity?.toFixed(3)})`);
    });

    return NextResponse.json({
      query,
      stats: {
        totalDocuments: allDocs?.length || 0,
        withEmbedding,
        withoutEmbedding,
      },
      retrieved: retrievedDocs.map(d => ({
        id: d.id,
        title: d.title,
        similarity: d.similarity,
        contentLength: d.content.length,
      })),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[RAG-TEST] Error:', msg);
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
