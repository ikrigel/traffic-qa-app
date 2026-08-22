import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { getServiceSupabase } from '@/lib/supabase';
import { upsertVectors } from '@/lib/pinecone';
import { embedPassagesBatch } from '@/lib/ragEmbedding';

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

    const vectors = [];
    let embeddingErrors = 0;
    const embeddingErrorDetails: Record<string, string> = {};

    // Generate embeddings in batches
    const embeddingBatchSize = 50;
    for (let i = 0; i < documents.length; i += embeddingBatchSize) {
      const batch = documents.slice(i, i + embeddingBatchSize);
      const batchNum = Math.floor(i / embeddingBatchSize) + 1;
      const totalBatches = Math.ceil(documents.length / embeddingBatchSize);

      console.log(`[MIGRATION] Embedding batch ${batchNum}/${totalBatches} (${batch.length} documents)`);

      try {
        const embeddings = await embedPassagesBatch(batch.map(d => d.content));

        for (let j = 0; j < batch.length; j++) {
          const doc = batch[j];
          const embedding = embeddings[j];

          console.log(`[MIGRATION] ✅ Got embedding for ${doc.id} (${embedding.length}D)`);

          vectors.push({
            id: doc.id,
            values: embedding,
            metadata: {
              title: doc.title,
              source: doc.source || '',
              createdAt: doc.created_at,
            },
          });
        }

        console.log(`[MIGRATION] 📦 Batch ${batchNum} complete, total vectors: ${vectors.length}`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`[MIGRATION] Failed to embed batch ${batchNum}:`, errorMsg);

        for (const doc of batch) {
          embeddingErrors++;
          embeddingErrorDetails[doc.id] = errorMsg;
        }
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
    const upsertErrors: Record<string, string> = {};

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
          console.log(`[MIGRATION] Batch ${batchNum} record format check:`, {
            sampleRecord: batch[0],
            vectorLength: batch[0]?.values?.length,
          });

          await upsertVectors(batch);

          upserted += batch.length;
          console.log(`[MIGRATION] ✅ Batch ${batchNum} upserted successfully (${batch.length} vectors)`);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          upsertErrors[`batch_${batchNum}`] = errorMsg;
          console.error(`[MIGRATION] ❌ Failed to upsert batch ${batchNum}:`, error);
          console.error(`[MIGRATION] Error details:`, {
            message: errorMsg,
            name: error instanceof Error ? error.name : 'Unknown',
            stack: error instanceof Error ? error.stack : 'N/A',
          });
        }
      }
    }

    console.log(`[MIGRATION] Migration complete: ${upserted} vectors upserted, ${embeddingErrors} embedding errors`);

    const summary: Record<string, any> = {
      message: 'Migration completed',
      total: documents.length,
      vectorsCreated: vectors.length,
      upserted,
      embeddingErrors,
      debug: {
        vectorsArrayLength: vectors.length,
        upsertsSuccessful: upserted,
        embeddingErrorCount: embeddingErrors,
        hasErrors: embeddingErrors > 0 || upserted === 0,
      },
    };

    if (embeddingErrors > 0) {
      summary.errorDetails = embeddingErrorDetails;
    }

    if (Object.keys(upsertErrors).length > 0) {
      summary.upsertErrorDetails = upsertErrors;
    }

    if (vectors.length === 0 && documents.length > 0) {
      summary.warning = '⚠️ No vectors were created. All documents may have failed embedding.';
    }

    if (upserted === 0 && vectors.length > 0) {
      summary.warning = '⚠️ Vectors were created but none were upserted to Pinecone. Check Pinecone connection.';
    }

    return NextResponse.json(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Migration failed';
    console.error('[MIGRATION] Error:', message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
