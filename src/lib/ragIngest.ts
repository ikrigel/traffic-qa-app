/* eslint-disable no-console */
'use server';

import { randomUUID } from 'crypto';
import { getServiceSupabase } from './supabase';
import { chunkText } from './chunker';
import { embedPassagesBatch } from './ragEmbedding';
import { calculateContentHash, checkForDuplicate } from './documentHash';
import { upsertVectors, PineconeVector } from './pinecone';
import { logError } from './logger';

export interface IngestDocumentParams {
  title: string;
  source?: string;
  content: string;
  fileType?: string;
  uploadedFile?: string;
  createdBy: string;
}

export interface IngestDocumentResult {
  parentDocumentId: string;
  chunksCreated: number;
  vectorsUpserted: number;
  errors: string[];
}

export async function ingestDocument(params: IngestDocumentParams): Promise<IngestDocumentResult> {
  const { title, source, content, fileType, uploadedFile, createdBy } = params;
  const errors: string[] = [];

  try {
    const supabase = getServiceSupabase();

    // Step 1: Check for duplicates
    const contentHash = calculateContentHash(content);
    const dupCheck = await checkForDuplicate(supabase, contentHash);

    if (dupCheck.isDuplicate) {
      const msg = `Document content already exists: "${dupCheck.existingDocTitle}" (ID: ${dupCheck.existingDocId})`;
      errors.push(msg);
      await logError({ source: 'ragIngest.ingestDocument', message: msg });
      throw new Error(msg);
    }

    // Step 2: Chunk the content
    console.log('[INGEST] Chunking content...');
    const chunks = chunkText(content, { targetTokens: 400, overlapTokens: 50, charsPerToken: 4 });
    console.log(`[INGEST] Created ${chunks.length} chunks from content`);

    if (chunks.length === 0) {
      throw new Error('No chunks created from document content');
    }

    // Step 3: Embed chunks in batches
    console.log('[INGEST] Embedding chunks in batches...');
    const embeddings: number[][] = [];
    const batchSize = 50;

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const batchTexts = batch.map(c => c.content);

      try {
        const batchEmbeddings = await embedPassagesBatch(batchTexts);
        embeddings.push(...batchEmbeddings);
        console.log(`[INGEST] Embedded batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}`);
      } catch (embedError) {
        const msg = `Embedding batch ${Math.floor(i / batchSize) + 1} failed: ${embedError instanceof Error ? embedError.message : String(embedError)}`;
        errors.push(msg);
        await logError({ source: 'ragIngest.embedBatch', message: msg });
        throw new Error(msg);
      }
    }

    if (embeddings.length !== chunks.length) {
      throw new Error(`Embedding count mismatch: expected ${chunks.length}, got ${embeddings.length}`);
    }

    // Step 4: Prepare rows for Supabase and vectors for Pinecone
    const parentDocumentId = randomUUID();
    const timestamp = new Date().toISOString();
    const ragDocumentRows = [];
    const pineconeVectors: PineconeVector[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = embeddings[i];
      const docId = randomUUID();

      ragDocumentRows.push({
        id: docId,
        title,
        source,
        content: chunk.content,
        chunk_index: i,
        parent_document_id: parentDocumentId,
        parent_title: title,
        total_chunks: chunks.length,
        regulation_numbers: chunk.regulationNumbers || null,
        metadata: {
          contentHash,
          embeddingStatus: 'complete',
          embeddingProvider: 'pinecone-e5-large',
          embeddingDimensions: embedding.length,
          fileType,
          uploadedFile,
          chunkCharStart: chunk.charStart,
          chunkCharEnd: chunk.charEnd,
        },
        created_by: createdBy,
        created_at: timestamp,
      });

      pineconeVectors.push({
        id: docId,
        values: embedding,
        metadata: {
          parentDocumentId,
          parentTitle: title,
          chunkIndex: i,
          totalChunks: chunks.length,
          regulationNumbers: chunk.regulationNumbers,
          source,
        },
      });
    }

    // Step 5: Insert into Supabase
    console.log('[INGEST] Inserting rows into Supabase...');
    const { error: insertError } = await supabase.from('rag_documents').insert(ragDocumentRows);

    if (insertError) {
      const msg = `Failed to insert RAG documents: ${insertError.message}`;
      errors.push(msg);
      await logError({ source: 'ragIngest.supabaseInsert', message: msg });
      throw new Error(msg);
    }

    console.log(`[INGEST] Inserted ${ragDocumentRows.length} rows into Supabase`);

    // Step 6: Upsert to Pinecone in batches
    console.log('[INGEST] Upserting vectors to Pinecone...');
    let vectorsUpserted = 0;

    for (let i = 0; i < pineconeVectors.length; i += batchSize) {
      const batch = pineconeVectors.slice(i, i + batchSize);

      try {
        await upsertVectors(batch);
        vectorsUpserted += batch.length;
        console.log(`[INGEST] Upserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(pineconeVectors.length / batchSize)}`);
      } catch (upsertError) {
        const msg = `Pinecone upsert batch ${Math.floor(i / batchSize) + 1} failed: ${upsertError instanceof Error ? upsertError.message : String(upsertError)}`;
        errors.push(msg);
        await logError({ source: 'ragIngest.pineconeUpsert', message: msg });
        // Don't throw here — partial upsert is acceptable; log as warning and continue
        console.warn('[INGEST] ' + msg);
      }
    }

    console.log(`[INGEST] Successfully ingested document: ${chunks.length} chunks, ${vectorsUpserted} vectors upserted`);

    return {
      parentDocumentId,
      chunksCreated: chunks.length,
      vectorsUpserted,
      errors,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[INGEST] Document ingestion failed:', message);
    await logError({ source: 'ragIngest.ingestDocument', message });
    throw error;
  }
}
