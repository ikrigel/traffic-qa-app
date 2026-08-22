import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { getServiceSupabase } from '@/lib/supabase';
import { getPineconeIndex } from '@/lib/pinecone';
import { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['super_admin']);
    if (!auth.authorized) return auth.response;

    const body = await request.json();
    if (body.confirm !== 'DELETE ALL RAG DOCUMENTS') {
      return NextResponse.json(
        { error: 'Missing or incorrect confirmation. Pass { confirm: "DELETE ALL RAG DOCUMENTS" }' },
        { status: 400 }
      );
    }

    console.log('[DELETE-ALL] Starting bulk RAG document deletion...');

    // Delete from Pinecone
    console.log('[DELETE-ALL] Clearing Pinecone index...');
    try {
      const index = getPineconeIndex();
      await index.deleteAll();
      console.log('[DELETE-ALL] ✅ Pinecone index cleared');
    } catch (pineconeError) {
      const msg = pineconeError instanceof Error ? pineconeError.message : String(pineconeError);
      console.error('[DELETE-ALL] Pinecone deletion error:', msg);
      await logError({ source: 'deleteAllRagDocuments.pinecone', message: msg });
    }

    // Delete from Supabase
    console.log('[DELETE-ALL] Deleting all rows from rag_documents...');
    const supabase = getServiceSupabase();
    const { data: countResult } = await supabase
      .from('rag_documents')
      .select('id', { count: 'exact', head: true });

    const rowsBeforeDelete = countResult?.length || 0;

    const { error: deleteError, count } = await supabase
      .from('rag_documents')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Always-true filter to delete all rows

    if (deleteError) {
      const msg = `Failed to delete RAG documents: ${deleteError.message}`;
      console.error('[DELETE-ALL]', msg);
      await logError({ source: 'deleteAllRagDocuments.supabase', message: msg });
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    console.log(`[DELETE-ALL] ✅ Deleted ${count || rowsBeforeDelete} rows from Supabase`);
    await logError({
      source: 'deleteAllRagDocuments.complete',
      message: `Bulk RAG document deletion: ${count || rowsBeforeDelete} Supabase rows, Pinecone index cleared`,
    });

    return NextResponse.json({
      success: true,
      rowsDeleted: count || rowsBeforeDelete,
      pineconeCleared: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[DELETE-ALL] Error:', message);
    await logError({ source: 'deleteAllRagDocuments', message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
