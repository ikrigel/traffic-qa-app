import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { getServiceSupabase } from '@/lib/supabase';
import { logError } from '@/lib/logger';
import { getPineconeIndex } from '@/lib/pinecone';
import { ingestDocument } from '@/lib/ragIngest';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ['super_admin']);
  if (!auth.authorized) return auth.response;

  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('rag_documents')
      .select('id, title, source, content, metadata, created_by, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    const index = getPineconeIndex();
    const vectorIds = new Set<string>();

    // Batch check vectors in Pinecone (more efficient than individual fetches)
    if (data && data.length > 0) {
      try {
        const docIds = data.map(d => d.id);
        const result = await index.fetch({ ids: docIds });

        if (result.records) {
          Object.keys(result.records).forEach(id => {
            vectorIds.add(id);
          });
        }
      } catch (error) {
        console.error('[RAG-GET] Error fetching vectors from Pinecone:', error);
        // Fall back to empty set - all documents will show as pending
      }
    }

    return NextResponse.json({
      documents: (data || []).map(d => ({
        id: d.id,
        title: d.title,
        source: d.source,
        content: d.content,
        metadata: d.metadata,
        embedding: vectorIds.has(d.id),
        createdBy: d.created_by,
        createdAt: d.created_at,
      })),
    });
  } catch (error) {
    console.error('RAG documents fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ['super_admin']);
  if (!auth.authorized) return auth.response;

  try {
    const { title, source, content } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    if (content.length > 5000000) {
      return NextResponse.json(
        { error: 'Content is too long (max 5 million characters)' },
        { status: 400 }
      );
    }

    const result = await ingestDocument({
      title,
      source,
      content,
      createdBy: auth.user.id,
    });

    if (result.errors.length > 0) {
      console.warn('[RAG-POST] Ingest warnings:', result.errors);
    }

    return NextResponse.json({
      success: true,
      parentDocumentId: result.parentDocumentId,
      chunksCreated: result.chunksCreated,
      vectorsUpserted: result.vectorsUpserted,
      errors: result.errors,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[RAG-POST] Document ingestion error:', message);
    await logError({ source: 'admin/rag-documents/POST', message });
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
