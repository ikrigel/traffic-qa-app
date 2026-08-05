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
    console.log('[RAG] Retrieving documents for query:', query.substring(0, 50));
    const queryEmbedding = await embedText(query);
    console.log('[RAG] Query embedded, calling RPC...');

    const supabase = getServiceSupabase();
    const { data, error } = await supabase.rpc('match_rag_documents', {
      query_embedding: queryEmbedding,
      match_count: limit,
    });

    if (error) {
      console.error('[RAG] RPC error:', error);
      throw error;
    }

    console.log('[RAG] RPC returned', data?.length || 0, 'documents');

    return (data || []).map((doc: any) => ({
      id: doc.id,
      title: doc.title,
      content: doc.content,
      source: doc.source,
      similarity: doc.similarity,
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Document retrieval failed';
    console.error('[RAG] Document retrieval error:', message, error);
    await logError({ source: 'rag.retrieveRelevantDocuments', message });
    return [];
  }
};
