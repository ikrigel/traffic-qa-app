import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { getServiceSupabase } from '@/lib/supabase';
import { apiError } from '@/lib/apiErrors';
import { appLog, logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(request, ['super_admin']);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = params;

    if (!id) {
      return apiError('MISSING_FIELDS', 'Document ID is required', 400);
    }

    await appLog({
      source: 'admin/rag-documents',
      message: `🗑️ Deleting RAG document: ${id}`,
      context: { docId: id },
    });

    const supabase = getServiceSupabase();

    // First, get the document to log it
    const { data: doc } = await supabase
      .from('rag_documents')
      .select('id, title, source')
      .eq('id', id)
      .single();

    // Delete the document
    const { error } = await supabase
      .from('rag_documents')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    await appLog({
      source: 'admin/rag-documents',
      message: `✅ RAG document deleted: "${doc?.title || id}"`,
      context: { docId: id, title: doc?.title, source: doc?.source },
    });

    return NextResponse.json({
      success: true,
      message: `Document "${doc?.title || 'Unknown'}" deleted successfully`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete document';
    await logError({
      source: 'admin/rag-documents',
      message: `❌ Failed to delete document: ${message}`,
      level: 'error',
    });
    return apiError('INTERNAL_ERROR', message, 500);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(request, ['super_admin']);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = params;
    const { title, source, content } = await request.json();

    if (!id) {
      return apiError('MISSING_FIELDS', 'Document ID is required', 400);
    }

    if (!title && !source && !content) {
      return apiError('MISSING_FIELDS', 'At least one field (title, source, or content) is required', 400);
    }

    const supabase = getServiceSupabase();

    // Build update object
    const updates: Record<string, any> = {};
    if (title) updates.title = title;
    if (source) updates.source = source;
    if (content) {
      if (content.length > 500000) {
        return apiError('INVALID_REQUEST', 'Content too long (max 500,000 characters)', 400);
      }
      updates.content = content;
      // Clear embedding when content changes (will need to be regenerated)
      updates.embedding = null;
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('rag_documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    await appLog({
      source: 'admin/rag-documents',
      message: `✏️ RAG document updated: "${data.title}"`,
      context: { docId: id, updatedFields: Object.keys(updates) },
    });

    return NextResponse.json({
      success: true,
      document: {
        id: data.id,
        title: data.title,
        source: data.source,
        content: data.content,
        embedding: data.embedding,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update document';
    await logError({
      source: 'admin/rag-documents',
      message: `❌ Failed to update document: ${message}`,
      level: 'error',
    });
    return apiError('INTERNAL_ERROR', message, 500);
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(request, ['super_admin']);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = params;

    if (!id) {
      return apiError('MISSING_FIELDS', 'Document ID is required', 400);
    }

    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('rag_documents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return apiError('MISSING_FIELDS', 'Document not found', 404);
    }

    return NextResponse.json({
      document: {
        id: data.id,
        title: data.title,
        source: data.source,
        content: data.content,
        hasEmbedding: !!data.embedding,
        createdAt: data.created_at,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch document';
    return apiError('INTERNAL_ERROR', message, 500);
  }
}
