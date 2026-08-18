import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { getServiceSupabase } from '@/lib/supabase';
import { embedText } from '@/lib/gemini';
import { upsertVectors } from '@/lib/pinecone';
import { chunkDocument, validateChunks } from '@/lib/documentChunker';
import { appLog, logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['super_admin']);
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await request.json();
    const { title, source, content } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Missing title or content' },
        { status: 400 }
      );
    }

    const contentSize = content.length;
    const maxSize = 200 * 1024; // 200KB limit per request

    if (contentSize > maxSize) {
      return NextResponse.json(
        {
          error: `Document too large (${(contentSize / 1024).toFixed(0)}KB). Max: 200KB per upload. Solutions: 1) Split into smaller parts 2) Upload multiple times 3) Use a PDF converter to compress first`,
        },
        { status: 413 }
      );
    }

    console.log(`[UPLOAD] Starting chunked upload: ${title}`);
    console.log(`[UPLOAD] Content size: ${contentSize} chars`);

    await appLog({
      source: 'rag-documents/upload-chunked',
      message: `📤 Starting chunked upload: ${title} (${content.length} chars)`,
    });

    // Chunk the document
    const chunks = chunkDocument(content, source || title);
    console.log(`[UPLOAD] Created ${chunks.length} chunks`);

    if (!validateChunks(chunks)) {
      throw new Error('Document chunks validation failed');
    }

    // Get Supabase client
    const supabase = getServiceSupabase();

    let uploadedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    // Process each chunk
    for (const chunk of chunks) {
      try {
        console.log(
          `[UPLOAD] Processing chunk ${chunk.chunkIndex + 1}/${chunk.totalChunks}`
        );

        // Store chunk in database
        const { data: docData, error: dbError } = await supabase
          .from('rag_documents')
          .insert({
            title: `${title} (Part ${chunk.chunkIndex + 1}/${chunk.totalChunks})`,
            source: source || title,
            content: chunk.content,
          })
          .select('id')
          .single();

        if (dbError || !docData) {
          throw new Error(`DB insert failed: ${dbError?.message}`);
        }

        const docId = docData.id;

        // Generate embedding
        console.log(`[UPLOAD] Embedding chunk ${chunk.chunkIndex + 1}`);
        const embedding = await embedText(chunk.content);

        // Upsert to Pinecone
        await upsertVectors([
          {
            id: docId,
            values: embedding,
            metadata: {
              title: `${title} (Part ${chunk.chunkIndex + 1})`,
              source: source || title,
              chunkIndex: chunk.chunkIndex,
              totalChunks: chunk.totalChunks,
              contentLength: chunk.content.length,
            },
          },
        ]);

        uploadedCount++;
        console.log(`[UPLOAD] ✅ Chunk ${chunk.chunkIndex + 1} uploaded`);
      } catch (chunkError) {
        failedCount++;
        const msg =
          chunkError instanceof Error ? chunkError.message : String(chunkError);
        errors.push(`Chunk ${chunk.chunkIndex + 1}: ${msg}`);
        console.error(`[UPLOAD] ❌ Chunk ${chunk.chunkIndex + 1}: ${msg}`);
      }
    }

    const summary = `Uploaded ${uploadedCount}/${chunks.length} chunks`;

    await appLog({
      source: 'rag-documents/upload-chunked',
      message: `✅ ${summary}`,
      level: 'info',
      context: {
        title,
        totalChunks: chunks.length,
        uploadedCount,
        failedCount,
        originalSize: content.length,
      },
    });

    return NextResponse.json({
      success: uploadedCount > 0,
      summary,
      totalChunks: chunks.length,
      uploaded: uploadedCount,
      failed: failedCount,
      errors: failedCount > 0 ? errors.slice(0, 5) : undefined,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[UPLOAD] Error:', msg);

    await logError({
      source: 'rag-documents/upload-chunked',
      message: `Upload failed: ${msg}`,
      level: 'error',
    });

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
