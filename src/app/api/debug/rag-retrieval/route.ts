import { NextRequest, NextResponse } from 'next/server';
import { embedQuery } from '@/lib/ragEmbedding';
import { queryVectors } from '@/lib/pinecone';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    console.log('[DEBUG-RAG] Query:', query);

    // Embed query
    const queryEmbedding = await embedQuery(query);
    console.log('[DEBUG-RAG] Query embedded, dims:', queryEmbedding.length);

    // Query Pinecone
    const matches = await queryVectors(queryEmbedding, 10);
    console.log('[DEBUG-RAG] Pinecone matches:', matches.length);

    if (matches.length === 0) {
      return NextResponse.json({ message: 'No matches found in Pinecone', matches: [] });
    }

    // Fetch full documents
    const docIds = matches.map(m => m.id);
    const supabase = getServiceSupabase();
    const { data: docs, error } = await supabase
      .from('rag_documents')
      .select('id, title, content, source, chunk_index, parent_document_id, regulation_numbers')
      .in('id', docIds);

    if (error) throw error;

    const results = matches.map((match, idx) => {
      const doc = docs.find((d: any) => d.id === match.id);
      return {
        rank: idx + 1,
        similarity: match.score,
        document: {
          id: doc?.id,
          title: doc?.title,
          chunk_index: doc?.chunk_index,
          regulation_numbers: doc?.regulation_numbers,
          content_preview: doc?.content ? doc.content.substring(0, 200) + '...' : 'N/A',
          content_full: doc?.content,
          source: doc?.source,
        },
      };
    });

    return NextResponse.json({
      query,
      query_embedding_dims: queryEmbedding.length,
      total_matches: matches.length,
      results,
    });
  } catch (error) {
    console.error('[DEBUG-RAG] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Debug failed' },
      { status: 500 }
    );
  }
}
