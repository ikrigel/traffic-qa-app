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

// Extract regulation number from query (e.g., "תקנה 25", "25", "25.")
function extractRegulationNumber(query: string): number | null {
  // Try multiple patterns to find regulation numbers
  let match = query.match(/תקנה\s+(\d+)/); // "תקנה 25"
  if (!match) {
    match = query.match(/(\d+)[א-ת]?/); // Just a number
  }
  return match ? parseInt(match[1], 10) : null;
}

export const retrieveRelevantDocuments = async (
  query: string,
  limit = 5
): Promise<RetrievedDocument[]> => {
  try {
    console.log('[RAG] ===== retrieveRelevantDocuments called =====');
    console.log('[RAG] Query:', query.substring(0, 50));
    console.log('[RAG] Limit:', limit);

    const supabase = getServiceSupabase();
    let results: RetrievedDocument[] = [];

    // Check if query contains a regulation number
    const regulationNum = extractRegulationNumber(query);
    if (regulationNum) {
      console.log(`[RAG] 🔍 Found regulation number: ${regulationNum}`);
      // Search for exact regulation number - look for the number with various separators
      const searchPattern = `%${regulationNum}%`;

      const { data: regDocs, error: regError } = await supabase
        .from('rag_documents')
        .select('id, title, content, source')
        .ilike('content', searchPattern)
        .limit(limit * 2); // Get more to filter

      console.log(`[RAG] Regulation search (pattern: "${searchPattern}"): ${regError ? `Error: ${regError.message}` : `Found ${regDocs?.length || 0} rows`}`);

      if (!regError && regDocs && regDocs.length > 0) {
        // Filter for rows that actually contain the regulation number in the right format
        const filtered = regDocs.filter((doc: any) => {
          const regex = new RegExp(`\\b${regulationNum}[.\\s]`, 'g');
          return regex.test(doc.content);
        });

        if (filtered.length > 0) {
          console.log(`[RAG] ✅ Filtered to ${filtered.length} documents with תקנה ${regulationNum}`);
          results = filtered.slice(0, limit).map((doc: any, idx: number) => ({
            id: doc.id,
            title: doc.title,
            content: doc.content,
            source: doc.source,
            similarity: 1.0 - idx * 0.05, // High similarity for exact matches
          }));

          if (results.length >= limit) {
            return results.slice(0, limit);
          }
        } else {
          console.log(`[RAG] ⚠️ Pattern match found rows but no regex match for תקנה ${regulationNum}`);
        }
      } else if (regError) {
        console.log(`[RAG] ⚠️ Regulation search error: ${regError.message}`);
      }
    }

    // Fallback to semantic search for remaining results or if no regulation number
    let queryEmbedding: number[];
    try {
      queryEmbedding = await embedQuery(query);
      console.log('[RAG] ✅ Query embedded via Pinecone e5-large');
      console.log('[RAG] Dimensions:', queryEmbedding.length);
    } catch (embedError) {
      const embedMsg = embedError instanceof Error ? embedError.message : String(embedError);
      console.error('[RAG] ❌ EMBEDDING FAILED:', embedMsg);
      if (results.length > 0) {
        console.log('[RAG] Returning regulation search results despite embedding failure');
        return results;
      }
      throw new Error(`Embedding failed: ${embedMsg}`);
    }

    console.log('[RAG] Querying Pinecone for semantic matches...');
    const semanticLimit = limit - results.length;
    const matches = await queryVectors(queryEmbedding, semanticLimit > 0 ? semanticLimit : limit);
    console.log('[RAG] ✅ Pinecone returned', matches.length, 'documents');

    if (matches.length === 0) {
      console.log('[RAG] No semantic matches found');
      return results;
    }

    // Fetch full document content from Supabase using IDs from Pinecone
    const docIds = matches.map(m => m.id);
    const { data: docs, error } = await supabase
      .from('rag_documents')
      .select('id, title, content, source')
      .in('id', docIds);

    if (error) throw error;

    const docMap = new Map(docs.map((d: any) => [d.id, d]));

    const semanticResults = matches
      .map((match, index) => {
        const doc = docMap.get(match.id);
        if (!doc) return null;
        return {
          id: doc.id,
          title: doc.title,
          content: doc.content,
          source: doc.source,
          similarity: match.score || (0.8 - index * 0.1),
        };
      })
      .filter((d): d is RetrievedDocument => d !== null);

    // Combine regulation search results with semantic results, avoiding duplicates
    const combinedIds = new Set(results.map(r => r.id));
    for (const result of semanticResults) {
      if (!combinedIds.has(result.id)) {
        results.push(result);
      }
    }

    return results.slice(0, limit);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Document retrieval failed';
    console.error('[RAG] ❌ ERROR:', message);
    await logError({ source: 'rag.retrieveRelevantDocuments', message, context: { gracefullFallback: true } });
    return [];
  }
};
