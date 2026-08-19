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

async function embedWithPinecone(text: string, chunkIdx: number = -1): Promise<number[]> {
  const { getPineconeClient } = await import('@/lib/pinecone');
  const pc = getPineconeClient();

  try {
    if (chunkIdx === 0) console.log('[EMBED] Starting inference call...');

    const result = await pc.inference.embed({
      model: 'multilingual-e5-large',
      inputs: [text],
      parameters: { input_type: 'passage', truncate: 'END' },
    }) as unknown;

    if (chunkIdx === 0) console.log('[EMBED] Inference call returned, result type:', typeof result);

    // Log actual response structure on first chunk only
    if (chunkIdx === 0) {
      const keys = result && typeof result === 'object' ? Object.keys(result) : [];
      console.log('[EMBED] Response keys:', keys);
      console.log('[EMBED] Response type:', typeof result, 'isArray:', Array.isArray(result));
      const obj = result as any;
      if (obj?.data && Array.isArray(obj.data)) {
        console.log('[EMBED] data.length:', obj.data.length);
        console.log('[EMBED] data[0] keys:', Object.keys(obj.data[0] || {}).join(','));
      }
    }

    // Handle different response formats from Pinecone SDK
    let embedding: number[] | undefined;
    const obj = result as any;

    // Try data property (most likely for Pinecone SDK)
    if (obj?.data && Array.isArray(obj.data) && obj.data.length > 0) {
      const item = obj.data[0];
      if (item?.values && Array.isArray(item.values)) {
        embedding = item.values;
      } else if (Array.isArray(item)) {
        embedding = item;
      }
    }
    // Try embeddings property
    else if (obj?.embeddings && Array.isArray(obj.embeddings) && obj.embeddings.length > 0) {
      const item = obj.embeddings[0];
      if (item?.values && Array.isArray(item.values)) {
        embedding = item.values;
      } else if (Array.isArray(item)) {
        embedding = item;
      }
    }
    // Try direct array access
    else if (Array.isArray(result) && result.length > 0) {
      const item = result[0];
      if (item?.values && Array.isArray(item.values)) {
        embedding = item.values;
      } else if (Array.isArray(item)) {
        embedding = item;
      }
    }
    // Try direct values property (fallback)
    else if (obj?.values && Array.isArray(obj.values)) {
      embedding = obj.values;
    }

    if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
      if (chunkIdx === 0) {
        console.error('[EMBED] Invalid embedding extracted:', { type: typeof embedding, isArray: Array.isArray(embedding), length: Array.isArray(embedding) ? embedding.length : 'N/A' });
      }
      throw new Error(`Got invalid embedding: ${typeof embedding}, length: ${Array.isArray(embedding) ? embedding.length : 'N/A'}`);
    }
    return embedding;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (chunkIdx === 0) {
      console.error('[EMBED] Chunk 0 error:', msg);
    }
    throw new Error(`Pinecone embedding failed: ${msg}`);
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
        // First chunk gets extra logging
        if (i === 0) {
          console.log(`[UPLOAD] 🔍 Chunk 0: text length ${chunkText.length}, sample: "${chunkText.substring(0, 50).replace(/\n/g, ' ')}..."`);
        }
        const embedding = await embedWithPinecone(chunkText, i);

        if (!Array.isArray(embedding) || embedding.length === 0) {
          throw new Error(`Embedding not an array or empty: ${typeof embedding}`);
        }

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
        console.log(`[UPLOAD] ✅ Embedded chunk ${i + 1}/${chunks.length} (${embedding.length}D)`);
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
