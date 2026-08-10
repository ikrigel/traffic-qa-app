/* eslint-disable no-console */
import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { apiError } from '@/lib/apiErrors';
import { getServiceSupabase } from '@/lib/supabase';
import { embedWithFallback } from '@/lib/embeddings';
import { parseDocument } from '@/lib/documentParser';
import { appLog, logError } from '@/lib/logger';
import { chunkDocument, formatChunkInfo } from '@/lib/pdfChunker';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export const dynamic = 'force-dynamic';

const UPLOAD_DIR = path.join(os.tmpdir(), 'rag-uploads');

async function mergeChunks(sessionId: string): Promise<Buffer> {
  const sessionDir = path.join(UPLOAD_DIR, sessionId);

  // Get all chunks and sort by index
  const files = await fs.readdir(sessionDir);
  const chunks = files
    .filter(f => f.startsWith('chunk-'))
    .sort((a, b) => {
      const aIdx = parseInt(a.split('-')[1], 10);
      const bIdx = parseInt(b.split('-')[1], 10);
      return aIdx - bIdx;
    });

  console.log(`[CHUNK-FINALIZE] Merging ${chunks.length} chunks for session ${sessionId}`);

  // Read all chunks
  const buffers: Buffer[] = [];
  for (const chunk of chunks) {
    const chunkPath = path.join(sessionDir, chunk);
    const buffer = await fs.readFile(chunkPath);
    buffers.push(buffer);
  }

  // Merge buffers
  const merged = Buffer.concat(buffers);
  console.log(`[CHUNK-FINALIZE] ✅ Merged ${chunks.length} chunks into ${(merged.length / 1024 / 1024).toFixed(2)}MB`);

  // Cleanup session directory
  try {
    await fs.rm(sessionDir, { recursive: true, force: true });
    console.log(`[CHUNK-FINALIZE] ✅ Cleaned up session directory`);
  } catch (cleanupError) {
    console.warn(`[CHUNK-FINALIZE] ⚠️ Failed to cleanup session dir:`, cleanupError);
  }

  return merged;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user || user.role !== 'super_admin') {
      return apiError('UNAUTHORIZED_KEY_ACCESS', 'Only super_admin can upload RAG documents', 403);
    }

    const body = await request.json();
    const { sessionId, filename, source } = body;

    if (!sessionId || !filename) {
      return apiError('MISSING_FIELDS', 'Missing sessionId or filename', 400);
    }

    console.log(`[CHUNK-FINALIZE] Starting finalization for ${filename}`);

    // Merge all chunks into a single buffer
    const buffer = await mergeChunks(sessionId);

    // Parse document
    console.log(`[CHUNK-FINALIZE] 📝 Parsing document...`);
    const parsed = await parseDocument(buffer, filename);
    console.log(`[CHUNK-FINALIZE] ✅ Document parsed: "${parsed.title}"`);
    console.log(`[CHUNK-FINALIZE] 📄 Content length: ${parsed.content.length} characters`);

    // Check if content needs chunking
    const MAX_CONTENT_LENGTH = 150000; // 150KB chars per chunk
    const documentsToProcess = parsed.content.length > MAX_CONTENT_LENGTH
      ? chunkDocument(parsed.content, parsed.title, source || `Uploaded: ${filename}`, parsed.pageCount || 0)
      : [{
        title: parsed.title,
        content: parsed.content,
        chunkIndex: 0,
        totalChunks: 1,
        pageStart: 1,
        pageEnd: parsed.pageCount || 0,
        source: source || `Uploaded: ${filename}`,
        isChunk: false,
        parentTitle: parsed.title,
      }];

    if (documentsToProcess.length > 1) {
      console.log(`[CHUNK-FINALIZE] 📚 ${formatChunkInfo(documentsToProcess)}`);
      await appLog({
        source: 'rag-finalize',
        message: `📚 Large document auto-chunked into ${documentsToProcess.length} parts`,
        context: { fileName: filename, chunks: documentsToProcess.length, totalSize: parsed.content.length },
      });
    }

    // Process each document/chunk
    const results: any[] = [];
    const supabase = getServiceSupabase();

    for (const doc of documentsToProcess) {
      try {
        // Generate embedding with fallback chain
        console.log(`[CHUNK-FINALIZE] 🧮 Generating embedding for "${doc.title}"...`);
        let embeddingResult: any = null;
        let embedProvider: string | null = null;

        try {
          await appLog({ source: 'rag-finalize', message: `🧮 Embedding: "${doc.title}"`, context: { textLength: doc.content.length } });
          embeddingResult = await embedWithFallback(doc.content);
          if (embeddingResult) {
            embedProvider = embeddingResult.provider;
            console.log(`[CHUNK-FINALIZE] ✅ Embedding via ${embedProvider} (${embeddingResult.dimensions}D)`);
            await appLog({ source: 'rag-finalize', message: `✅ Embedded via ${embedProvider}`, context: { dimensions: embeddingResult.dimensions } });
          } else {
            console.warn(`[CHUNK-FINALIZE] ⚠️ No embedding providers available`);
            await logError({ source: 'rag-finalize', message: `⚠️ Embedding providers failed for "${doc.title}"`, level: 'warn' });
          }
        } catch (embedError) {
          const embedMsg = embedError instanceof Error ? embedError.message : String(embedError);
          console.error(`[CHUNK-FINALIZE] ❌ Embedding error: ${embedMsg}`);
          await logError({ source: 'rag-finalize', message: `❌ Embedding error for "${doc.title}": ${embedMsg}`, level: 'error' });
        }

        const embedding = embeddingResult?.embedding || null;

        // Insert into database
        console.log(`[CHUNK-FINALIZE] 💾 Inserting "${doc.title}"...`);

        const { data, error } = await supabase
          .from('rag_documents')
          .insert({
            title: doc.title,
            source: doc.source,
            content: doc.content,
            embedding: embedding || null,
            metadata: {
              uploadedFile: filename,
              fileType: parsed.fileType,
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
          console.error(`[CHUNK-FINALIZE] ❌ DATABASE ERROR for "${doc.title}":`);
          console.error(`[CHUNK-FINALIZE] Error: ${error.message}`);
          results.push({
            filename,
            success: false,
            error: `${doc.title}: ${error.message}`,
          });
        } else {
          console.log(`[CHUNK-FINALIZE] ✅ Uploaded "${doc.title}"`);
          results.push({
            filename,
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
        console.error(`[CHUNK-FINALIZE] ❌ Error processing chunk:`, message);
        results.push({
          filename,
          success: false,
          error: `Chunk error: ${message}`,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    console.log(`[CHUNK-FINALIZE] ✅ Finalization complete: ${successCount}/${results.length} successful`);

    return NextResponse.json({
      success: true,
      uploaded: successCount,
      total: results.length,
      results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Finalization failed';
    console.error('[CHUNK-FINALIZE] Error:', message);
    return apiError('INTERNAL_ERROR', message, 500);
  }
}
