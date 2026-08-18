import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { getServiceSupabase } from '@/lib/supabase';
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

    console.log(`[UPLOAD] Starting chunked upload: ${title}`);
    console.log(`[UPLOAD] Content size: ${content.length} chars`);

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

    // Process each chunk with timeout
    for (const chunk of chunks) {
      try {
        const chunkNum = chunk.chunkIndex + 1;
        console.log(`[UPLOAD] Starting chunk ${chunkNum}/${chunk.totalChunks}`);

        // Set 25 second timeout for chunk processing
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Chunk processing timeout (25s)')), 25000)
        );

        const processChunk = async () => {
          // Store chunk in database
          console.log(`[UPLOAD] DB insert for chunk ${chunkNum}...`);
          const { data: docData, error: dbError } = await supabase
            .from('rag_documents')
            .insert({
              title: `${title} (Part ${chunkNum}/${chunk.totalChunks})`,
              source: source || title,
              content: chunk.content,
            })
            .select('id')
            .single();

          if (dbError || !docData) {
            throw new Error(`DB insert failed: ${dbError?.message || 'No data returned'}`);
          }

          const docId = docData.id;
          console.log(`[UPLOAD] DB insert done, docId: ${docId}`);

          // TODO: Embedding disabled due to memory issues
          // In production, use Pinecone serverless embeddings or external embedding service
          console.log(`[UPLOAD] Storing chunk ${chunkNum} (embedding deferred to RAG query time)`);

          // For now, just log that we'd embed this
          // The document is stored in DB and can be searched via full-text
          console.log(`[UPLOAD] Chunk ${chunkNum} ready for search: ${chunk.content.substring(0, 50)}...`);

          uploadedCount++;
          console.log(`[UPLOAD] ✅ Chunk ${chunkNum} complete`);
        };

        await Promise.race([processChunk(), timeoutPromise]);
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
