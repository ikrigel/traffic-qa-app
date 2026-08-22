import { getServiceSupabase } from './supabase';
import { ingestDocument } from './ragIngest';
import { logError, appLog } from './logger';
import crypto from 'crypto';

export interface DocumentSource {
  id?: string;
  name: string;
  source_type: 'url' | 'file' | 'text';
  source_url?: string;
  source_path?: string;
  source_text?: string;
  description?: string;
}

/**
 * Fetch content from URL with proper encoding handling
 */
export async function fetchUrlContent(url: string): Promise<string> {
  console.log('[INGEST] Fetching URL:', url);
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept-Charset': 'utf-8',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();

    // Remove HTML tags and clean up
    const cleaned = text
      .replace(/<script[^>]*>.*?<\/script>/gs, '')
      .replace(/<style[^>]*>.*?<\/style>/gs, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();

    console.log('[INGEST] ✅ Fetched', cleaned.length, 'characters');
    return cleaned;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[INGEST] ❌ Fetch failed:', msg);
    throw new Error(`Failed to fetch URL: ${msg}`);
  }
}

/**
 * Calculate content hash for validation
 */
export function calculateContentHash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Extract Hebrew regulation numbers from content
 */
export function extractRegulationNumbers(content: string): number[] {
  const regex = /תקנה\s+(\d+)[א-ת]?/g;
  const numbers: number[] = [];
  let match;

  while ((match = regex.exec(content)) !== null) {
    const num = parseInt(match[1], 10);
    if (!numbers.includes(num)) {
      numbers.push(num);
    }
  }

  return numbers.sort((a, b) => a - b);
}

/**
 * Tokenize Hebrew text for indexing
 */
export function tokenizeHebrewText(text: string): string[] {
  // Split by whitespace and punctuation, keep Hebrew words
  const tokens = text
    .split(/[\s\-.,;:!?()[\]{}""״׳]/g)
    .filter(token => {
      // Keep tokens that contain Hebrew or numbers
      return /[֐-׿0-9]/.test(token) && token.length > 1;
    })
    .map(token => token.toLowerCase());

  return [...new Set(tokens)]; // Remove duplicates
}

/**
 * Ingest document from source
 */
export async function ingestDocumentSource(
  source: DocumentSource,
  userId: string
): Promise<{ success: boolean; chunks: number; error?: string }> {
  try {
    let content: string;

    // Fetch content based on source type
    if (source.source_type === 'url' && source.source_url) {
      content = await fetchUrlContent(source.source_url);
    } else if (source.source_type === 'text' && source.source_text) {
      content = source.source_text;
    } else if (source.source_type === 'file' && source.source_path) {
      // File path - would need filesystem access
      throw new Error('File uploads not yet implemented via API');
    } else {
      throw new Error('Invalid source configuration');
    }

    if (!content || content.length < 50) {
      throw new Error('Content too short or empty');
    }

    // Ingest the document
    const result = await ingestDocument({
      title: source.name,
      source: source.source_url || source.source_path || 'Manual Text',
      content,
      createdBy: userId,
    });

    if (result.errors.length > 0) {
      console.warn('[INGEST] Ingestion had errors:', result.errors);
    }

    // Store source record
    const supabase = getServiceSupabase();
    const contentHash = calculateContentHash(content);
    const regulations = extractRegulationNumbers(content);

    const { error: sourceError } = await supabase.from('document_sources').insert({
      name: source.name,
      source_type: source.source_type,
      source_url: source.source_url,
      source_path: source.source_path,
      description: source.description,
      ingest_status: result.errors.length === 0 ? 'success' : 'failed',
      ingest_error: result.errors.length > 0 ? result.errors.join('; ') : null,
      total_chunks: result.chunksCreated,
      verified_chunks: result.vectorsUpserted,
      last_ingested_at: new Date().toISOString(),
      created_by: userId,
    });

    if (sourceError) throw sourceError;

    // Store validation data
    await supabase.from('source_content_validation').insert({
      content_hash: contentHash,
      total_size: content.length,
      chunk_count: result.chunksCreated,
      regulation_count: regulations.length,
      first_regulation: regulations.length > 0 ? regulations[0] : null,
      last_regulation: regulations.length > 0 ? regulations[regulations.length - 1] : null,
    });

    await appLog({
      source: 'documentIngestion.ingestDocumentSource',
      message: `✅ Ingested "${source.name}": ${result.chunksCreated} chunks, ${regulations.length} regulations`,
      context: { regulations },
    });

    return { success: true, chunks: result.chunksCreated };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[INGEST] ❌ Error:', msg);
    await logError({
      source: 'documentIngestion.ingestDocumentSource',
      message: msg,
    });

    return { success: false, chunks: 0, error: msg };
  }
}

/**
 * Verify content completeness
 */
export async function verifyContentCompleteness(
  regulation: number
): Promise<{ found: boolean; chunks: number; content: string }> {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from('rag_documents')
    .select('id, content')
    .or(`content.ilike.%תקנה%${regulation}%,regulation_numbers.cs.{${regulation}}`)
    .limit(10);

  if (error) throw error;

  return {
    found: (data?.length ?? 0) > 0,
    chunks: data?.length ?? 0,
    content: data?.[0]?.content || '',
  };
}
