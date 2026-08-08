/* eslint-disable no-console */
import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { getServiceSupabase } from '@/lib/supabase';
import { embedText } from '@/lib/gemini';
import { apiError } from '@/lib/apiErrors';
import { parseDocument } from '@/lib/documentParser';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB per file

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user || user.role !== 'super_admin') {
      return apiError('UNAUTHORIZED_KEY_ACCESS', 'Only super_admin can upload RAG documents', 403);
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const source = formData.get('source') as string | null;

    if (!files || files.length === 0) {
      return apiError('MISSING_FIELDS', 'At least one file is required', 400);
    }

    console.log(`[RAG-UPLOAD] Starting file upload with ${files.length} file(s)`);

    const results: any[] = [];
    const supabase = getServiceSupabase();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          const sizeMB = (file.size / 1024 / 1024).toFixed(2);
          console.warn(`[RAG-UPLOAD] File too large: ${file.name} (${sizeMB}MB)`);
          results.push({
            filename: file.name,
            success: false,
            error: `File too large: ${sizeMB}MB (max 50MB)`,
          });
          continue;
        }

        console.log(`[RAG-UPLOAD] 🔄 Processing file ${i + 1}/${files.length}: "${file.name}"`);
        console.log(`[RAG-UPLOAD] 📊 File size: ${(file.size / 1024).toFixed(2)}KB`);
        console.log(`[RAG-UPLOAD] 🏷️ File type: ${file.type}`);

        // Convert File to Buffer
        console.log(`[RAG-UPLOAD] 🔀 Converting File to Buffer...`);
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        console.log(`[RAG-UPLOAD] ✅ Buffer created: ${buffer.length} bytes`);

        // Parse document
        console.log(`[RAG-UPLOAD] 📝 Parsing document...`);
        const parsed = await parseDocument(buffer, file.name);
        console.log(`[RAG-UPLOAD] ✅ Document parsed: "${parsed.title}"`);
        console.log(`[RAG-UPLOAD] 📄 Content length: ${parsed.content.length} characters`);
        console.log(`[RAG-UPLOAD] 🎯 File type detected: ${parsed.fileType}`);

        // Generate embedding
        console.log(`[RAG-UPLOAD] 🧮 Generating embedding...`);
        const embedding = await embedText(parsed.content);
        console.log(`[RAG-UPLOAD] ✅ Embedding generated (${embedding.length} dimensions)`);

        // Insert into database
        console.log(`[RAG-UPLOAD] 💾 Inserting into Supabase...`);
        const { data, error } = await supabase
          .from('rag_documents')
          .insert({
            title: parsed.title,
            source: source || `Uploaded: ${file.name}`,
            content: parsed.content,
            embedding,
            metadata: {
              uploadedFile: file.name,
              fileType: parsed.fileType,
              fileSize: file.size,
              uploadedAt: new Date().toISOString(),
            },
            created_by: user.id,
          })
          .select()
          .single();

        if (error) {
          console.error(`[RAG-UPLOAD] ❌ DATABASE ERROR for "${file.name}":`);
          console.error(`[RAG-UPLOAD] Error code: ${error.code}`);
          console.error(`[RAG-UPLOAD] Error message: ${error.message}`);
          console.error(`[RAG-UPLOAD] Error details:`, error);
          results.push({
            filename: file.name,
            success: false,
            error: error.message,
          });
        } else {
          console.log(`[RAG-UPLOAD] ✅ Successfully uploaded "${file.name}"`);
          results.push({
            filename: file.name,
            success: true,
            id: data.id,
            title: parsed.title,
            contentLength: parsed.content.length,
            fileType: parsed.fileType,
          });
        }
      } catch (docError) {
        const message = docError instanceof Error ? docError.message : 'Unknown error';
        console.error(`[RAG-UPLOAD] ❌ Error processing "${file.name}":`, message);
        results.push({
          filename: file.name,
          success: false,
          error: message,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    console.log(`[RAG-UPLOAD] ✅ Upload complete: ${successCount}/${files.length} successful`);

    return NextResponse.json({
      success: true,
      uploaded: successCount,
      total: files.length,
      results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process request';
    console.error('[RAG-UPLOAD] Error:', message);
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
      endpoint: 'POST /api/admin/rag-documents/upload',
      description: 'Upload PDF, DOCX, or TXT files for RAG ingestion with automatic embedding',
      supportedFormats: ['PDF', 'DOCX', 'TXT'],
      maxFileSize: '50MB per file',
      example: {
        formData: {
          files: ['document1.pdf', 'document2.docx', 'notes.txt'],
          source: 'optional-source-label',
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return apiError('INTERNAL_ERROR', message, 500);
  }
}
