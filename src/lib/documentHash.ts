/**
 * Document hashing and duplicate detection
 * Prevents re-uploading the same content twice
 */

import crypto from 'crypto';

export function calculateContentHash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function calculateFileHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingDocId?: string;
  existingDocTitle?: string;
  existingDocSource?: string;
}

/**
 * Check if a document with the same content hash already exists
 */
export async function checkForDuplicate(
  supabase: any,
  contentHash: string
): Promise<DuplicateCheckResult> {
  try {
    const { data, error } = await supabase
      .from('rag_documents')
      .select('id, title, source, metadata')
      .filter('metadata', 'cs', JSON.stringify({ contentHash }))
      .limit(1)
      .single();

    if (error && error.code === 'PGRST116') {
      // No rows found
      return { isDuplicate: false };
    }

    if (error) {
      console.error('[HASH-CHECK] Error checking for duplicates:', error);
      return { isDuplicate: false };
    }

    if (data) {
      return {
        isDuplicate: true,
        existingDocId: data.id,
        existingDocTitle: data.title,
        existingDocSource: data.source,
      };
    }

    return { isDuplicate: false };
  } catch (err) {
    console.error('[HASH-CHECK] Exception checking duplicates:', err);
    return { isDuplicate: false };
  }
}
