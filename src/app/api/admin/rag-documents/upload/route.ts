/* eslint-disable no-console */
import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { getServiceSupabase } from '@/lib/supabase';
import { embedWithFallback } from '@/lib/embeddings';
import { apiError } from '@/lib/apiErrors';
import { parseDocument } from '@/lib/documentParser';
import { appLog, logError } from '@/lib/logger';
import { chunkDocument, formatChunkInfo } from '@/lib/pdfChunker';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB per file
const MAX_CONTENT_LENGTH = 500000; // 500,000 characters max content after parsing

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

        // Check if content needs chunking
        const documentsToProcess = parsed.content.length > MAX_CONTENT_LENGTH
          ? chunkDocument(parsed.content, parsed.title, source || `Uploaded: ${file.name}`, parsed.pageCount || 0)
          : [{
            title: parsed.title,
            content: parsed.content,
            chunkIndex: 0,
            totalChunks: 1,
            pageStart: 1,
            pageEnd: parsed.pageCount || 0,
            source: source || `Uploaded: ${file.name}`,
            isChunk: false,
            parentTitle: parsed.title,
          }];

        if (documentsToProcess.length > 1) {
          console.log(`[RAG-UPLOAD] 📚 ${formatChunkInfo(documentsToProcess)}`);
          await appLog({
            source: 'rag-upload',
            message: `📚 Large document auto-chunked into ${documentsToProcess.length} parts`,
            context: { fileName: file.name, chunks: documentsToProcess.length, totalSize: parsed.content.length },
          });
        }

        // Process each document/chunk
        for (const doc of documentsToProcess) {
          try {
            // Generate embedding with fallback chain
            console.log(`[RAG-UPLOAD] 🧮 Generating embedding for "${doc.title}"...`);
            let embeddingResult: any = null;
            let embedProvider: string | null = null;

            try {
              await appLog({ source: 'rag-upload', message: `🧮 Embedding: "${doc.title}"`, context: { textLength: doc.content.length } });
              embeddingResult = await embedWithFallback(doc.content);
              if (embeddingResult) {
                embedProvider = embeddingResult.provider;
                console.log(`[RAG-UPLOAD] ✅ Embedding via ${embedProvider} (${embeddingResult.dimensions}D)`);
                await appLog({ source: 'rag-upload', message: `✅ Embedded via ${embedProvider}`, context: { dimensions: embeddingResult.dimensions } });
              } else {
                console.warn(`[RAG-UPLOAD] ⚠️ No embedding providers available`);
                await logError({ source: 'rag-upload', message: `⚠️ Embedding providers failed for "${doc.title}"`, level: 'warn' });
              }
            } catch (embedError) {
              const embedMsg = embedError instanceof Error ? embedError.message : String(embedError);
              console.error(`[RAG-UPLOAD] ❌ Embedding error: ${embedMsg}`);
              await logError({ source: 'rag-upload', message: `❌ Embedding error for "${doc.title}": ${embedMsg}`, level: 'error' });
            }

            const embedding = embeddingResult?.embedding || null;

            // Insert into database
            console.log(`[RAG-UPLOAD] 💾 Inserting "${doc.title}"...`);

            const { data, error } = await supabase
              .from('rag_documents')
              .insert({
                title: doc.title,
                source: doc.source,
                content: doc.content,
                embedding: embedding || null,
                metadata: {
                  uploadedFile: file.name,
                  fileType: parsed.fileType,
                  fileSize: file.size,
                  uploadedAt: new Date().toISOString(),
                  embeddingStatus: embedding ? 'complete' : 'pending',
                  embeddingProvider: embedProvider || 'none',
                  isChunk: doc.isChunk,
                  chunkIndex: doc.chunkIndex,
                  totalChunks: doc.totalChunks,
                  parentTitle: doc.parentTitle,
                  pageRange: `${doc.pageStart}-${doc.pageEnd}`,
                },
                created_by: user.id,
              })
              .select()
              .single();

            if (error) {
              console.error(`[RAG-UPLOAD] ❌ DATABASE ERROR for "${doc.title}":`);
              console.error(`[RAG-UPLOAD] Error code: ${error.code}`);
              console.error(`[RAG-UPLOAD] Error message: ${error.message}`);
              results.push({
                filename: file.name,
                success: false,
                error: `${doc.title}: ${error.message}`,
              });
            } else {
              console.log(`[RAG-UPLOAD] ✅ Uploaded "${doc.title}"`);
              results.push({
                filename: file.name,
                success: true,
                id: data.id,
                title: doc.title,
                contentLength: doc.content.length,
                fileType: parsed.fileType,
                isChunk: doc.isChunk,
                chunkInfo: doc.isChunk ? `Part ${doc.chunkIndex + 1}/${doc.totalChunks}` : undefined,
              });
            }
          } catch (chunkError) {
            const message = chunkError instanceof Error ? chunkError.message : 'Unknown error';
            console.error(`[RAG-UPLOAD] ❌ Error processing chunk:`, message);
            results.push({
              filename: file.name,
              success: false,
              error: `Chunk error: ${message}`,
            });
          }
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
