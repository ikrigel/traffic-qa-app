/* eslint-disable no-console */
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { getServiceSupabase } from '@/lib/supabase';
import { apiError } from '@/lib/apiErrors';
import { appLog } from '@/lib/logger';
import { validateRagDatabase, cleanupOrphanedChunks } from '@/lib/ragValidation';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ['super_admin']);
  if (!auth.authorized) return auth.response;

  try {
    console.log('[RAG-ADMIN-VALIDATE] Starting validation endpoint');
    const supabase = getServiceSupabase();

    const report = await validateRagDatabase(supabase);

    await appLog({
      source: 'admin/rag-validate',
      message: `✅ RAG database validation complete`,
      context: {
        totalDocuments: report.totalDocuments,
        withEmbedding: report.documentsWithEmbedding,
        withoutEmbedding: report.documentsWithoutEmbedding,
        duplicates: report.duplicates.length,
        orphanedChunks: report.orphanedChunks.length,
      },
    });

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Validation failed';
    console.error('[RAG-ADMIN-VALIDATE] Error:', message);
    return apiError('INTERNAL_ERROR', message, 500);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ['super_admin']);
  if (!auth.authorized) return auth.response;

  try {
    console.log('[RAG-ADMIN-CLEANUP] Starting cleanup');
    const body = await request.json();
    const { action, orphanedChunkIds } = body;

    if (!action) {
      return apiError('MISSING_FIELDS', 'action field is required', 400);
    }

    const supabase = getServiceSupabase();

    if (action === 'cleanup-orphaned') {
      if (!orphanedChunkIds || !Array.isArray(orphanedChunkIds)) {
        return apiError('MISSING_FIELDS', 'orphanedChunkIds array is required', 400);
      }

      console.log(`[RAG-ADMIN-CLEANUP] Deleting ${orphanedChunkIds.length} orphaned chunks`);
      const deleted = await cleanupOrphanedChunks(supabase, orphanedChunkIds);

      await appLog({
        source: 'admin/rag-cleanup',
        message: `✅ Cleaned up ${deleted} orphaned chunks`,
        context: { deletedCount: deleted },
      });

      return NextResponse.json({
        success: true,
        message: `Deleted ${deleted} orphaned chunks`,
        deletedCount: deleted,
      });
    }

    if (action === 'verify-embeddings') {
      console.log('[RAG-ADMIN-VERIFY] Verifying all embeddings exist');

      const { data: docs, error } = await supabase
        .from('rag_documents')
        .select('id, title, embedding, metadata');

      if (error) throw error;

      const results = {
        total: docs?.length || 0,
        withEmbedding: 0,
        withoutEmbedding: 0,
        details: [] as any[],
      };

      for (const doc of docs || []) {
        if (doc.embedding && doc.embedding.length > 0) {
          results.withEmbedding++;
        } else {
          results.withoutEmbedding++;
          results.details.push({
            id: doc.id,
            title: doc.title,
            embeddingStatus: doc.metadata?.embeddingStatus || 'unknown',
          });
        }
      }

      await appLog({
        source: 'admin/rag-verify',
        message: `✅ Embedding verification: ${results.withEmbedding}/${results.total} have embeddings`,
        context: results,
      });

      return NextResponse.json({
        success: true,
        verification: results,
      });
    }

    return apiError('INVALID_REQUEST', `Unknown action: ${action}`, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Cleanup failed';
    console.error('[RAG-ADMIN-CLEANUP] Error:', message);
    return apiError('INTERNAL_ERROR', message, 500);
  }
}
