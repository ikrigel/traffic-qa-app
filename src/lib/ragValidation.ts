/**
 * RAG database validation and cleanup utilities
 * Ensures data integrity and consistency in the RAG document store
 */

export interface ValidationReport {
  totalDocuments: number;
  documentsWithEmbedding: number;
  documentsWithoutEmbedding: number;
  duplicates: Array<{
    hash: string;
    count: number;
    docIds: string[];
  }>;
  orphanedChunks: Array<{
    chunkId: string;
    parentTitle: string;
    parentExists: boolean;
  }>;
  stats: {
    totalEmbeddedSize: number;
    averageContentLength: number;
    oldestDocument: string | null;
    newestDocument: string | null;
  };
}

export async function validateRagDatabase(supabase: any): Promise<ValidationReport> {
  console.log('[RAG-VALIDATION] Starting database validation...');

  try {
    // Fetch all documents
    const { data: allDocs, error: docsError } = await supabase
      .from('rag_documents')
      .select('id, title, embedding, content, metadata, created_at');

    if (docsError) throw docsError;

    const docs = allDocs || [];
    console.log(`[RAG-VALIDATION] Found ${docs.length} documents`);

    // Check embeddings
    const withEmbedding = docs.filter((d: any) => d.embedding && d.embedding.length > 0);
    const withoutEmbedding = docs.filter((d: any) => !d.embedding || d.embedding.length === 0);

    console.log(`[RAG-VALIDATION] ✅ ${withEmbedding.length} documents have embeddings`);
    console.log(`[RAG-VALIDATION] ⏳ ${withoutEmbedding.length} documents missing embeddings`);

    // Check for duplicates by content hash
    const hashMap = new Map<string, any[]>();
    const duplicates: ValidationReport['duplicates'] = [];

    for (const doc of docs) {
      const hash = doc.metadata?.contentHash || 'unknown';
      if (!hashMap.has(hash)) {
        hashMap.set(hash, []);
      }
      hashMap.get(hash)?.push(doc);
    }

    for (const [hash, docsWithHash] of hashMap) {
      if (docsWithHash.length > 1) {
        duplicates.push({
          hash,
          count: docsWithHash.length,
          docIds: docsWithHash.map((d: any) => d.id),
        });
      }
    }

    if (duplicates.length > 0) {
      console.log(`[RAG-VALIDATION] ⚠️ Found ${duplicates.length} duplicate content groups`);
    }

    // Check for orphaned chunks (chunks whose parent doesn't exist)
    const chunks = docs.filter((d: any) => d.metadata?.isChunk);
    const orphanedChunks: ValidationReport['orphanedChunks'] = [];

    for (const chunk of chunks) {
      const parentTitle = chunk.metadata?.parentTitle;
      const parentExists = docs.some((d: any) => d.title === parentTitle && !d.metadata?.isChunk);

      if (!parentExists && parentTitle) {
        orphanedChunks.push({
          chunkId: chunk.id,
          parentTitle,
          parentExists: false,
        });
      }
    }

    if (orphanedChunks.length > 0) {
      console.log(`[RAG-VALIDATION] ⚠️ Found ${orphanedChunks.length} orphaned chunks`);
    }

    // Calculate stats
    const totalEmbeddedSize = withEmbedding.reduce((sum: number, d: any) => {
      return sum + (d.embedding?.length || 0) * 8; // 8 bytes per float64
    }, 0);

    const contentLengths = docs.map((d: any) => d.content?.length || 0);
    const averageContentLength = contentLengths.length > 0
      ? Math.round(contentLengths.reduce((a: number, b: number) => a + b, 0) / contentLengths.length)
      : 0;

    const dates = docs
      .map((d: any) => d.created_at)
      .filter((d: any) => d)
      .sort();

    const report: ValidationReport = {
      totalDocuments: docs.length,
      documentsWithEmbedding: withEmbedding.length,
      documentsWithoutEmbedding: withoutEmbedding.length,
      duplicates,
      orphanedChunks,
      stats: {
        totalEmbeddedSize: Math.round(totalEmbeddedSize / 1024 / 1024), // Convert to MB
        averageContentLength,
        oldestDocument: dates.length > 0 ? dates[0] : null,
        newestDocument: dates.length > 0 ? dates[dates.length - 1] : null,
      },
    };

    console.log('[RAG-VALIDATION] ✅ Validation complete');
    return report;
  } catch (error) {
    console.error('[RAG-VALIDATION] Error during validation:', error);
    throw error;
  }
}

export async function cleanupOrphanedChunks(supabase: any, orphanedChunkIds: string[]): Promise<number> {
  if (orphanedChunkIds.length === 0) return 0;

  console.log(`[RAG-CLEANUP] Deleting ${orphanedChunkIds.length} orphaned chunks...`);

  try {
    const { count, error } = await supabase
      .from('rag_documents')
      .delete()
      .in('id', orphanedChunkIds);

    if (error) throw error;

    console.log(`[RAG-CLEANUP] ✅ Deleted ${count} orphaned chunks`);
    return count || 0;
  } catch (error) {
    console.error('[RAG-CLEANUP] Error deleting orphaned chunks:', error);
    throw error;
  }
}

export async function deleteAllChunksForDocument(supabase: any, parentTitle: string): Promise<number> {
  console.log(`[RAG-CLEANUP] Deleting all chunks for parent: "${parentTitle}"...`);

  try {
    // Get all chunks for this parent
    const { data: chunks, error: fetchError } = await supabase
      .from('rag_documents')
      .select('id')
      .filter('metadata', 'cs', JSON.stringify({ parentTitle, isChunk: true }));

    if (fetchError) throw fetchError;

    if (!chunks || chunks.length === 0) {
      console.log(`[RAG-CLEANUP] No chunks found for parent: "${parentTitle}"`);
      return 0;
    }

    const chunkIds = chunks.map((c: any) => c.id);

    // Delete all chunks
    const { count, error: deleteError } = await supabase
      .from('rag_documents')
      .delete()
      .in('id', chunkIds);

    if (deleteError) throw deleteError;

    console.log(`[RAG-CLEANUP] ✅ Deleted ${count} chunks for parent: "${parentTitle}"`);
    return count || 0;
  } catch (error) {
    console.error('[RAG-CLEANUP] Error deleting chunks:', error);
    throw error;
  }
}
