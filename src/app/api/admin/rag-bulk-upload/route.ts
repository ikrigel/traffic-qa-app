/* eslint-disable no-console */
import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { getServiceSupabase } from '@/lib/supabase';
import { embedText } from '@/lib/gemini';
import { apiError } from '@/lib/apiErrors';

export const dynamic = 'force-dynamic';

interface DocumentToUpload {
  title: string;
  source?: string;
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user || user.role !== 'super_admin') {
      return apiError('UNAUTHORIZED_KEY_ACCESS', 'Only super_admin can upload RAG documents', 403);
    }

    const body = await request.json();
    const { documents } = body as { documents: DocumentToUpload[] };

    if (!Array.isArray(documents) || documents.length === 0) {
      return apiError('MISSING_FIELDS', 'documents array is required and must not be empty', 400);
    }

    console.log(`[RAG-BULK] Starting bulk upload of ${documents.length} documents`);

    const results: any[] = [];
    const supabase = getServiceSupabase();

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      try {
        console.log(`[RAG-BULK] Processing document ${i + 1}/${documents.length}: "${doc.title}"`);

        // Generate embedding
        console.log(`[RAG-BULK] Generating embedding for "${doc.title}"...`);
        const embedding = await embedText(doc.content);
        console.log(`[RAG-BULK] ✅ Embedding generated (${embedding.length} dimensions)`);

        // Insert into database
        console.log(`[RAG-BULK] Inserting into database...`);
        const { data, error } = await supabase
          .from('rag_documents')
          .insert({
            title: doc.title,
            source: doc.source || null,
            content: doc.content,
            embedding,
            metadata: {},
            created_by: user.id,
          })
          .select()
          .single();

        if (error) {
          console.error(`[RAG-BULK] ❌ Database error for "${doc.title}":`, error);
          results.push({
            title: doc.title,
            success: false,
            error: error.message,
          });
        } else {
          console.log(`[RAG-BULK] ✅ Successfully uploaded "${doc.title}"`);
          results.push({
            title: doc.title,
            success: true,
            id: data.id,
          });
        }
      } catch (docError) {
        const message = docError instanceof Error ? docError.message : 'Unknown error';
        console.error(`[RAG-BULK] ❌ Error processing "${doc.title}":`, message);
        results.push({
          title: doc.title,
          success: false,
          error: message,
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`[RAG-BULK] ✅ Bulk upload complete: ${successCount}/${documents.length} successful`);

    return NextResponse.json({
      success: true,
      uploaded: successCount,
      total: documents.length,
      results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process request';
    console.error('[RAG-BULK] Error:', message);
    return apiError('INTERNAL_ERROR', message, 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user || user.role !== 'super_admin') {
      return apiError('UNAUTHORIZED_KEY_ACCESS', 'Only super_admin can access this endpoint', 403);
    }

    return NextResponse.json({
      endpoint: 'POST /api/admin/rag-bulk-upload',
      description: 'Bulk upload RAG documents with automatic embedding generation',
      example: {
        documents: [
          {
            title: 'Document Title',
            source: 'optional-source',
            content: 'Full document content here...',
          },
        ],
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return apiError('INTERNAL_ERROR', message, 500);
  }
}
