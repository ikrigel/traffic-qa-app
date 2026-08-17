import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { getServiceSupabase } from '@/lib/supabase';
import { embedText } from '@/lib/gemini';
import { upsertVectors } from '@/lib/pinecone';
import { appLog, logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['super_admin']);
    if (!auth.authorized) {
      return auth.response;
    }

    await appLog({
      source: 'rag-documents/reindex',
      message: '🔄 Starting document re-indexing',
    });

    // Fetch all documents from Supabase
    const supabase = getServiceSupabase();
    const { data: documents, error } = await supabase
      .from('rag_documents')
      .select('id, title, content, source')
      .order('created_at', { ascending: true });

    if (error || !documents) {
      throw new Error(`Failed to fetch documents: ${error?.message}`);
    }

    await appLog({
      source: 'rag-documents/reindex',
      message: `📚 Found ${documents.length} documents to re-index`,
    });

    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const doc of documents) {
      try {
        console.log(`[REINDEX] Processing: ${doc.title}`);

        // Generate embedding with valid Gemini key
        const embedding = await embedText(doc.content);

        // Upsert to Pinecone
        await upsertVectors([{
          id: doc.id,
          values: embedding,
          metadata: {
            title: doc.title,
            source: doc.source || 'unknown',
          },
        }]);

        successCount++;
        console.log(`[REINDEX] ✅ ${doc.title}`);
      } catch (docError) {
        failedCount++;
        const msg = docError instanceof Error ? docError.message : String(docError);
        errors.push(`${doc.title}: ${msg}`);
        console.error(`[REINDEX] ❌ ${doc.title}: ${msg}`);
      }
    }

    const summary = `Re-indexed ${successCount}/${documents.length} documents`;
    await appLog({
      source: 'rag-documents/reindex',
      message: `✅ ${summary}`,
      level: 'info',
      context: { successCount, failedCount, errors: errors.slice(0, 5) },
    });

    return NextResponse.json({
      success: true,
      summary,
      total: documents.length,
      succeeded: successCount,
      failed: failedCount,
      errors: failedCount > 0 ? errors : undefined,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    await logError({
      source: 'rag-documents/reindex',
      message: `Re-indexing failed: ${msg}`,
      level: 'error',
    });

    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
