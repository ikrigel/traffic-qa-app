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
    const embeddingErrorDetails: Record<string, string> = {};

    // Generate embeddings and prepare vectors
    for (const doc of documents) {
      try {
        console.log(`[MIGRATION] Embedding document: ${doc.id} - ${doc.title}`);
        const embedding = await embedText(doc.content);

        console.log(`[MIGRATION] ✅ Got embedding for ${doc.id}:`, {
          isArray: Array.isArray(embedding),
          length: embedding?.length,
          type: typeof embedding,
          sample: Array.isArray(embedding) ? embedding.slice(0, 3) : embedding,
        });

        if (!Array.isArray(embedding) || embedding.length === 0) {
          throw new Error(`Invalid embedding: ${typeof embedding}, length: ${embedding?.length || 'N/A'}`);
        }

        vectors.push({
          id: doc.id,
          values: embedding,
          metadata: {
            title: doc.title,
            source: doc.source || '',
            createdAt: doc.created_at,
          },
        });

        console.log(`[MIGRATION] 📦 Vector added to batch, total vectors: ${vectors.length}`);
      } catch (error) {
        embeddingErrors++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        embeddingErrorDetails[doc.id] = errorMsg;
        console.error(`[MIGRATION] Failed to embed ${doc.id}:`, errorMsg);
        console.error(`[MIGRATION] Full error for ${doc.id}:`, error);
      }
    }

    console.log(`[MIGRATION] 📊 Embedding batch complete:`, {
      totalDocs: documents.length,
      successfulVectors: vectors.length,
      failures: embeddingErrors,
    });

    // Upsert to Pinecone in batches
    const batchSize = 50;
    let upserted = 0;

    console.log(`[MIGRATION] Starting Pinecone upsert:`, {
      totalVectors: vectors.length,
      batchSize,
      batches: Math.ceil(vectors.length / batchSize),
    });

    if (vectors.length === 0) {
      console.warn('[MIGRATION] ⚠️ No vectors to upsert!');
    } else {
      for (let i = 0; i < vectors.length; i += batchSize) {
        const batch = vectors.slice(i, i + batchSize);
        const batchNum = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(vectors.length / batchSize);

        console.log(`[MIGRATION] Upserting batch ${batchNum}/${totalBatches} (${batch.length} vectors)`);

        try {
          const result = await index.upsert({
            records: batch.map(v => ({
              id: v.id,
              values: v.values,
              metadata: v.metadata || {},
            })),
          });

          upserted += batch.length;
          console.log(`[MIGRATION] ✅ Batch ${batchNum} upserted successfully, result:`, result);
        } catch (error) {
          console.error(`[MIGRATION] ❌ Failed to upsert batch ${batchNum}:`, error);
          console.error(`[MIGRATION] Error details:`, {
            message: error instanceof Error ? error.message : String(error),
            name: error instanceof Error ? error.name : 'Unknown',
          });
        }
      }
    }

    console.log(`[MIGRATION] Migration complete: ${upserted} vectors upserted, ${embeddingErrors} embedding errors`);

    return NextResponse.json({
      message: 'Migration completed',
      total: documents.length,
      upserted,
      embeddingErrors,
      ...(embeddingErrors > 0 && { errorDetails: embeddingErrorDetails }),
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
