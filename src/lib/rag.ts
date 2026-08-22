/* eslint-disable no-console */
import { embedQuery } from './ragEmbedding';
import { queryVectors } from './pinecone';
import { getServiceSupabase } from './supabase';
import { logError } from './logger';

export interface RetrievedDocument {
  id: string;
  title: string;
  content: string;
  source: string | null;
  similarity: number;
}

export const retrieveRelevantDocuments = async (
  query: string,
  limit = 5
): Promise<RetrievedDocument[]> => {
  try {
    console.log('[RAG] ===== retrieveRelevantDocuments called =====');
    console.log('[RAG] Query:', query.substring(0, 50));
    console.log('[RAG] Limit:', limit);

    let queryEmbedding: number[];
    try {
      queryEmbedding = await embedQuery(query);
      console.log('[RAG] ✅ Query embedded via Pinecone e5-large');
      console.log('[RAG] Dimensions:', queryEmbedding.length);
    } catch (embedError) {
      const embedMsg = embedError instanceof Error ? embedError.message : String(embedError);
      console.error('[RAG] ❌ EMBEDDING FAILED:', embedMsg);
      throw new Error(`Embedding failed: ${embedMsg}`);
    }

    console.log('[RAG] Querying Pinecone...');
    const matches = await queryVectors(queryEmbedding, limit);
    console.log('[RAG] ✅ Pinecone returned', matches.length, 'documents');

    if (matches.length === 0) {
      console.log('[RAG] No documents found');
      return [];
    }

    // Fetch full document content from Supabase using IDs from Pinecone
    const docIds = matches.map(m => m.id);
    const supabase = getServiceSupabase();
    const { data: docs, error } = await supabase
      .from('rag_documents')
      .select('id, title, content, source')
      .in('id', docIds);

    if (error) throw error;

    const docMap = new Map(docs.map((d: any) => [d.id, d]));

    return matches
      .map((match, index) => {
        const doc = docMap.get(match.id);
        if (!doc) return null;
        return {
          id: doc.id,
          title: doc.title,
          content: doc.content,
          source: doc.source,
          similarity: match.score || (1 - index * 0.1),
        };
      })
      .filter((d): d is RetrievedDocument => d !== null);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Document retrieval failed';
    console.error('[RAG] ❌ ERROR:', message);
    await logError({ source: 'rag.retrieveRelevantDocuments', message, context: { gracefullFallback: true } });
    return [];
  }
};
