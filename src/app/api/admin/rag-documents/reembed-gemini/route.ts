/* eslint-disable no-console */
import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { getServiceSupabase } from '@/lib/supabase';
import { embedText } from '@/lib/gemini';
import { appLog, logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = getServiceSupabase();

    console.log('[REEMBED] Starting re-embedding all documents with Gemini...');
    await appLog({ source: 'reembed-gemini', message: '🔄 Starting re-embedding all documents with Gemini' });

    // Get all documents
    const { data: docs, error: docsError } = await supabase
      .from('rag_documents')
      .select('id, title, content')
      .limit(1000);

    if (docsError || !docs) {
      throw docsError || new Error('Failed to fetch documents');
    }

    console.log(`[REEMBED] Found ${docs.length} documents to re-embed`);

    const results = {
      total: docs.length,
      successful: 0,
      failed: 0,
      errors: [] as Array<{ docId: string; title: string; error: string }>
    };

    // Re-embed each document
    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      console.log(`[REEMBED] [${i + 1}/${docs.length}] Re-embedding: ${doc.title}`);

      try {
        // Generate Gemini embedding
        const embedding = await embedText(doc.content);
        console.log(`[REEMBED] ✅ Embedded ${doc.title} (${embedding.length}D)`);

        // Update document with new embedding
        const { error: updateError } = await supabase
          .from('rag_documents')
          .update({
            embedding: embedding,
            metadata: {
              reembeddedAt: new Date().toISOString(),
              provider: 'gemini',
              model: 'text-embedding-004'
            }
          })
          .eq('id', doc.id);

        if (updateError) {
          throw updateError;
        }

        results.successful++;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(`[REEMBED] ❌ Failed to embed ${doc.title}:`, msg);
        results.failed++;
        results.errors.push({
          docId: doc.id,
          title: doc.title,
          error: msg
        });
      }
    }

    console.log(`[REEMBED] ✅ Complete: ${results.successful} successful, ${results.failed} failed`);
    await appLog({
      source: 'reembed-gemini',
      message: `✅ Re-embedding complete: ${results.successful}/${results.total} successful`
    });

    return NextResponse.json({
      success: true,
      results
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[REEMBED] Error:', msg);
    await logError({
      source: 'reembed-gemini',
      message: `❌ Re-embedding failed: ${msg}`,
      level: 'error'
    });
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
