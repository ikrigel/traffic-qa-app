import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { getServiceSupabase } from '@/lib/supabase';
import { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['super_admin']);
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await request.json();
    const { title, source, content } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Missing title or content' },
        { status: 400 }
      );
    }

    // Simple upload - just store raw content without chunking
    const supabase = getServiceSupabase();

    try {
      console.log(`[UPLOAD] Storing: ${title} (${content.length} chars)`);

      const { data, error } = await supabase
        .from('rag_documents')
        .insert({
          title: title.trim(),
          source: source?.trim() || title,
          content: content.trim(),
        })
        .select('id')
        .single();

      if (error || !data) {
        throw new Error(`Database error: ${error?.message || 'No response'}`);
      }

      console.log(`[UPLOAD] ✅ Stored: ${data.id}`);
    } catch (dbError) {
      const msg = dbError instanceof Error ? dbError.message : String(dbError);
      console.error(`[UPLOAD] DB Error: ${msg}`);
      throw dbError;
    }

    return NextResponse.json({
      success: true,
      summary: `Document stored successfully (${content.length} chars)`,
      totalChunks: 1,
      uploaded: 1,
      failed: 0,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[UPLOAD] Error:', msg);

    await logError({
      source: 'rag-documents/upload-chunked',
      message: `Upload failed: ${msg}`,
      level: 'error',
    });

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
