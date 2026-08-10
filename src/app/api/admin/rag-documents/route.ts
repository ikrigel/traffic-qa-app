import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { getServiceSupabase } from '@/lib/supabase';
import { embedText } from '@/lib/gemini';
import { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ['super_admin']);
  if (!auth.authorized) return auth.response;

  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('rag_documents')
      .select('id, title, source, content, metadata, created_by, created_at, embedding')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    return NextResponse.json({
      documents: (data || []).map(d => ({
        id: d.id,
        title: d.title,
        source: d.source,
        content: d.content,
        metadata: d.metadata,
        embedding: d.embedding ? true : false,
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

    if (content.length > 200000) {
      return NextResponse.json(
        { error: 'Content is too long (max 200,000 characters)' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();
    const { data: doc, error: insertError } = await supabase
      .from('rag_documents')
      .insert({
        title,
        source: source || null,
        content,
        created_by: auth.user.id,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    try {
      const embedding = await embedText(content);
      await supabase
        .from('rag_documents')
        .update({ embedding })
        .eq('id', doc.id);
    } catch (embeddingError) {
      await logError({
        source: 'admin/rag-documents',
        message: 'Failed to embed document content',
        context: { docId: doc.id },
      });
    }

    return NextResponse.json({
      document: {
        id: doc.id,
        title: doc.title,
        source: doc.source,
        content: doc.content,
        createdBy: doc.created_by,
        createdAt: doc.created_at,
      },
    });
  } catch (error) {
    console.error('RAG document creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    );
  }
}
