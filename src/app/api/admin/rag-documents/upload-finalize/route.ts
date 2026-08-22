/* eslint-disable no-console */
import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { apiError } from '@/lib/apiErrors';
import { getServiceSupabase } from '@/lib/supabase';
import { parseDocument } from '@/lib/documentParser';
import { appLog, logError } from '@/lib/logger';
import { ingestDocument } from '@/lib/ragIngest';
import { calculateContentHash, checkForDuplicate } from '@/lib/documentHash';
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

    // Initialize Supabase
    const supabase = getServiceSupabase();

    // Merge all chunks into a single buffer
    const buffer = await mergeChunks(sessionId);

    // Parse document
    console.log(`[CHUNK-FINALIZE] 📝 Parsing document...`);
    let parsed;
    try {
      parsed = await parseDocument(buffer, filename);
      console.log(`[CHUNK-FINALIZE] ✅ Document parsed: "${parsed.title}"`);
      console.log(`[CHUNK-FINALIZE] 📄 Content length: ${parsed.content.length} characters`);
    } catch (parseError) {
      const errorMsg = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
      console.error(`[CHUNK-FINALIZE] ❌ Parse failed: ${errorMsg}`);

      await appLog({
        source: 'rag-finalize',
        message: `❌ PDF parsing failed: ${filename}`,
        context: { fileName: filename, error: errorMsg },
      });

      return NextResponse.json({
        success: false,
        error: {
          code: 'PDF_PARSE_ERROR',
          message: errorMsg,
          suggestions: [
            '1. Try re-exporting the PDF from the source application',
            '2. Use an online PDF conversion tool to convert to PDF/A',
            '3. Check if the PDF is password-protected or encrypted',
            '4. Try a different PDF file format',
          ],
        },
      }, { status: 400 });
    }

    // Calculate content hash and check for duplicates
    console.log(`[CHUNK-FINALIZE] 🔍 Checking for duplicate content...`);
    const contentHash = calculateContentHash(parsed.content);
    const dupCheck = await checkForDuplicate(supabase, contentHash);

    if (dupCheck.isDuplicate) {
      console.log(`[CHUNK-FINALIZE] ⚠️ Duplicate detected: "${dupCheck.existingDocTitle}"`);
      await appLog({
        source: 'rag-finalize',
        message: `⚠️ Upload rejected: duplicate file "${filename}"`,
        context: {
          fileName: filename,
          existingDocId: dupCheck.existingDocId,
          existingDocTitle: dupCheck.existingDocTitle,
          contentHash,
        },
      });

      return NextResponse.json({
        success: false,
        error: {
          code: 'DUPLICATE_FILE',
          message: `This file is already uploaded as "${dupCheck.existingDocTitle}" (${dupCheck.existingDocSource || 'no source'})`,
          existingDocId: dupCheck.existingDocId,
          existingDocTitle: dupCheck.existingDocTitle,
        },
      }, { status: 409 });
    }

    console.log(`[CHUNK-FINALIZE] ✅ No duplicates found`);

    // Use unified ingestion pipeline
    console.log(`[CHUNK-FINALIZE] 📚 Ingesting document with new chunker and embedder...`);
    try {
      const result = await ingestDocument({
        title: parsed.title,
        source: source || `Uploaded: ${filename}`,
        content: parsed.content,
        fileType: parsed.fileType,
        uploadedFile: filename,
        createdBy: user.id,
      });

      await appLog({
        source: 'rag-finalize',
        message: `✅ Document ingested: "${parsed.title}" (${result.chunksCreated} chunks, ${result.vectorsUpserted} vectors)`,
        context: {
          fileName: filename,
          parentDocumentId: result.parentDocumentId,
          chunks: result.chunksCreated,
          vectors: result.vectorsUpserted,
        },
      });

      const hasErrors = result.errors.length > 0;
      if (hasErrors) {
        for (const error of result.errors) {
          console.warn(`[CHUNK-FINALIZE] ⚠️ Warning: ${error}`);
        }
      }

      return NextResponse.json({
        success: true,
        parentDocumentId: result.parentDocumentId,
        chunksCreated: result.chunksCreated,
        vectorsUpserted: result.vectorsUpserted,
        filename,
        title: parsed.title,
        warnings: result.errors,
      });
    } catch (ingestError) {
      const message = ingestError instanceof Error ? ingestError.message : String(ingestError);
      console.error(`[CHUNK-FINALIZE] ❌ Ingestion error:`, message);
      await logError({
        source: 'rag-finalize',
        message: `❌ Document ingestion failed for "${parsed.title}": ${message}`,
      });

      return NextResponse.json({
        success: false,
        error: message,
        filename,
        title: parsed.title,
      }, { status: 500 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Finalization failed';
    console.error('[CHUNK-FINALIZE] Error:', message);
    return apiError('INTERNAL_ERROR', message, 500);
  }
}
