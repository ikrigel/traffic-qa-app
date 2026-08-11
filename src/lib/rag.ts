/* eslint-disable no-console */
import { embedText } from './gemini';
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
    console.log('[RAG] Step 1: Calling embedText...');
    let queryEmbedding: number[];
    try {
      queryEmbedding = await embedText(query);
      console.log('[RAG] Step 2: ✅ Query embedded successfully, dimensions:', queryEmbedding.length);
      console.log('[RAG] Embedding type:', typeof queryEmbedding, 'Is array:', Array.isArray(queryEmbedding));
      if (Array.isArray(queryEmbedding) && queryEmbedding.length > 0) {
        console.log('[RAG] First 3 embedding values:', queryEmbedding.slice(0, 3));
      }
    } catch (embedError) {
      const embedMsg = embedError instanceof Error ? embedError.message : String(embedError);
      console.error('[RAG] ❌ EMBEDDING FAILED:', embedMsg);
      console.error('[RAG] Full embedding error:', embedError);
      throw new Error(`Embedding failed: ${embedMsg}`);
    }

    console.log('[RAG] Step 3: Getting Supabase client...');
    const supabase = getServiceSupabase();
    console.log('[RAG] Step 4: Calling RPC match_rag_documents...');
    console.log('[RAG] RPC params - embedding length:', queryEmbedding.length, 'match_count:', limit);

    const { data, error } = await supabase.rpc('match_rag_documents', {
      query_embedding: queryEmbedding,
      match_count: limit,
    });

    if (error) {
      console.error('[RAG] ❌ RPC ERROR:', error.message);
      console.error('[RAG] Full RPC error:', error);
      throw new Error(`RPC failed: ${error.message}`);
    }

    console.log('[RAG] ✅ RPC returned', data?.length || 0, 'documents');
    if (data && data.length > 0) {
      console.log('[RAG] Top result:', data[0].title, 'similarity:', data[0].similarity);
    }

    return (data || []).map((doc: any) => ({
      id: doc.id,
      title: doc.title,
      content: doc.content,
      source: doc.source,
      similarity: doc.similarity,
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Document retrieval failed';
    console.error('[RAG] ❌ DOCUMENT RETRIEVAL ERROR:', message);
    console.error('[RAG] Full error:', error);
    await logError({ source: 'rag.retrieveRelevantDocuments', message, context: { gracefullFallback: true } });
    return [];
  }
};
