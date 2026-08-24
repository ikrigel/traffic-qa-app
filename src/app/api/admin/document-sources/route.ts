import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { getServiceSupabase } from '@/lib/supabase';
import { ingestDocumentSource } from '@/lib/documentIngestion';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ['admin', 'super_admin']);
  if (!auth.authorized) return auth.response;

  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('document_sources')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ sources: data || [] });
  } catch (error) {
    console.error('Sources fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch sources' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ['admin', 'super_admin']);
  if (!auth.authorized) return auth.response;

  try {
    const { name, source_type, source_url, source_text, description } = await request.json();

    if (!name || !source_type) {
      return NextResponse.json({ error: 'Name and source_type required' }, { status: 400 });
    }

    if (source_type === 'url' && !source_url) {
      return NextResponse.json({ error: 'URL required for url source_type' }, { status: 400 });
    }

    if (source_type === 'text' && !source_text) {
      return NextResponse.json({ error: 'Text required for text source_type' }, { status: 400 });
    }

    // Ingest the document
    const result = await ingestDocumentSource(
      { name, source_type, source_url, source_text, description },
      auth.user?.id || ''
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Ingestion failed' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      chunks_created: result.chunks,
      tokens: result.tokens,
      message: `Successfully ingested ${result.chunks} chunks (${result.tokens} tokens)`,
    });
  } catch (error) {
    console.error('Source creation error:', error);
    let errorMsg = 'Failed to create source';
    if (error instanceof Error) {
      errorMsg = error.message;
    } else if (typeof error === 'object' && error !== null) {
      errorMsg = JSON.stringify(error);
    }
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
