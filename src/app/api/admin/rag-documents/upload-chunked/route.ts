import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { getServiceSupabase } from '@/lib/supabase';
import { logError } from '@/lib/logger';
import { upsertVectors } from '@/lib/pinecone';

export const dynamic = 'force-dynamic';

function splitIntoEmbeddingChunks(text: string, chunkSize = 1500, overlapSize = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + chunkSize, text.length);
    if (end < text.length) {
      const lastNewline = text.lastIndexOf('\n', end);
      if (lastNewline > start + overlapSize) {
        end = lastNewline;
      }
    }
    chunks.push(text.substring(start, end).trim());
    start = Math.max(end - overlapSize, start + 1);
  }
  return chunks.filter(c => c.length > 0);
}

async function embedWithPinecone(text: string): Promise<number[]> {
  const { getPineconeClient } = await import('@/lib/pinecone');
  const pc = getPineconeClient();

  try {
    const result = await pc.inference.embed({
      model: 'multilingual-e5-large',
      inputs: [text],
      parameters: { input_type: 'passage', truncate: 'END' },
    });

    // Extract embedding values from result - handle various response formats
    const embeddings = result as unknown as Array<{ values: number[] }>;
    if (!Array.isArray(embeddings) || !embeddings[0]?.values) {
      throw new Error('Invalid embedding response from Pinecone');
    }
    return embeddings[0].values;
  } catch (error) {
    throw new Error(
      `Pinecone embedding failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['super_admin']);
    if (!auth.authorized) return auth.response;

    const body = await request.json();
    const { title, source, content } = body;

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'Missing title or content' }, { status: 400 });
    }

    const titleTrimmed = title.trim();
    const sourceTrimmed = source?.trim() || titleTrimmed;
    const contentTrimmed = content.trim();

    console.log(`[UPLOAD] Processing: "${titleTrimmed}" (${contentTrimmed.length} chars)`);

    const supabase = getServiceSupabase();

    // Insert document record first
    const { data: docData, error: docError } = await supabase
      .from('rag_documents')
      .insert({
        title: titleTrimmed,
        source: sourceTrimmed,
        content: contentTrimmed,
      })
      .select('id')
      .single();

    if (docError || !docData) {
      throw new Error(`Failed to store document: ${docError?.message || 'No ID returned'}`);
    }

    const docId = docData.id;
    console.log(`[UPLOAD] 📄 Document stored: ${docId}`);

    // Split into embedding chunks and embed
    const chunks = splitIntoEmbeddingChunks(contentTrimmed);
    console.log(`[UPLOAD] 📦 Split into ${chunks.length} embedding chunks`);

    const vectors = [];
    for (let i = 0; i < chunks.length; i++) {
      try {
        const chunkText = chunks[i];
        const embedding = await embedWithPinecone(chunkText);

        vectors.push({
          id: `${docId}_chunk_${i}`,
          values: embedding,
          metadata: {
            docId,
            chunkIndex: i,
            title: titleTrimmed,
            source: sourceTrimmed,
            text: chunkText.substring(0, 200),
          },
        });
        console.log(`[UPLOAD] ✅ Embedded chunk ${i + 1}/${chunks.length}`);
      } catch (embedError) {
        const msg = embedError instanceof Error ? embedError.message : String(embedError);
        console.error(`[UPLOAD] ⚠️ Chunk ${i} embedding failed (continuing): ${msg}`);
      }
    }

    // Upsert vectors to Pinecone
    if (vectors.length > 0) {
      await upsertVectors(vectors);
      console.log(`[UPLOAD] 🎯 Upserted ${vectors.length} vectors to Pinecone`);
    }

    return NextResponse.json({
      success: true,
      documentId: docId,
      summary: `✅ Document stored with ${chunks.length} embedding chunks`,
      chunkCount: chunks.length,
      vectorCount: vectors.length,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[UPLOAD] ❌ Error:', msg);
    await logError({
      source: 'rag-documents/upload-chunked',
      message: `Upload failed: ${msg}`,
      level: 'error',
    });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
