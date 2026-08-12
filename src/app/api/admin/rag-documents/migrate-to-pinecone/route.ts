import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { getServiceSupabase } from '@/lib/supabase';
import { getPineconeIndex } from '@/lib/pinecone';
import { embedText } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ['super_admin']);
  if (!auth.authorized) return auth.response;

  try {
    console.log('[MIGRATION] Starting migration to Pinecone...');

    const supabase = getServiceSupabase();

    // Fetch all documents
    const { data: documents, error: fetchError } = await supabase
      .from('rag_documents')
      .select('id, title, source, content, created_at')
      .limit(1000);

    if (fetchError) throw fetchError;

    if (!documents || documents.length === 0) {
      return NextResponse.json({ message: 'No documents to migrate', migrated: 0 });
    }

    console.log(`[MIGRATION] Found ${documents.length} documents to migrate`);

    const index = getPineconeIndex();
    const vectors = [];
    let embeddingErrors = 0;

    // Generate embeddings and prepare vectors
    for (const doc of documents) {
      try {
        console.log(`[MIGRATION] Embedding document: ${doc.id} - ${doc.title}`);
        const embedding = await embedText(doc.content);

        vectors.push({
          id: doc.id,
          values: embedding,
          metadata: {
            title: doc.title,
            source: doc.source || '',
            createdAt: doc.created_at,
          },
        });
      } catch (error) {
        embeddingErrors++;
        console.error(`[MIGRATION] Failed to embed ${doc.id}:`, error);
      }
    }

    // Upsert to Pinecone in batches
    const batchSize = 50;
    let upserted = 0;

    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      console.log(`[MIGRATION] Upserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(vectors.length / batchSize)}`);

      try {
        await index.upsert({
          records: batch.map(v => ({
            id: v.id,
            values: v.values,
            metadata: v.metadata || {},
          })),
        });
        upserted += batch.length;
      } catch (error) {
        console.error(`[MIGRATION] Failed to upsert batch:`, error);
      }
    }

    console.log(`[MIGRATION] Migration complete: ${upserted} vectors upserted, ${embeddingErrors} embedding errors`);

    return NextResponse.json({
      message: 'Migration completed',
      total: documents.length,
      upserted,
      embeddingErrors,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Migration failed';
    console.error('[MIGRATION] Error:', message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
