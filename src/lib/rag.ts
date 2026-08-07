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
    const queryEmbedding = await embedText(query);
    console.log('[RAG] Step 2: ✅ Query embedded successfully, dimensions:', queryEmbedding.length);
    console.log('[RAG] Step 3: Getting Supabase client...');

    console.log('[RAG] Step 4: Getting Supabase client...');
    const supabase = getServiceSupabase();
    console.log('[RAG] Step 5: Calling RPC match_rag_documents...');

    const { data, error } = await supabase.rpc('match_rag_documents', {
      query_embedding: queryEmbedding,
      match_count: limit,
    });

    if (error) {
      console.error('[RAG] ❌ RPC error:', error);
      throw error;
    }

    console.log('[RAG] Step 6: ✅ RPC returned', data?.length || 0, 'documents');

    return (data || []).map((doc: any) => ({
      id: doc.id,
      title: doc.title,
      content: doc.content,
      source: doc.source,
      similarity: doc.similarity,
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Document retrieval failed';
    console.error('[RAG] ⚠️ Document retrieval error (graceful fallback):', message);
    await logError({ source: 'rag.retrieveRelevantDocuments', message, context: { gracefullFallback: true } });
    return [];
  }
};
