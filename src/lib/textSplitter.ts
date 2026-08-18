export function splitTextIntoChunks(text: string, maxSize: number = 200 * 1024): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = start + maxSize;
    if (end < text.length) {
      const lastNewline = text.lastIndexOf('\n', end);
      if (lastNewline > start) end = lastNewline;
    }
    chunks.push(text.substring(start, end));
    start = end;
  }
  return chunks;
}

export interface ChunkUploadResult {
  successCount: number;
  totalChunks: number;
  errors: string[];
}

export async function uploadTextChunks(
  chunks: string[],
  title: string,
  source: string | undefined,
  onProgress: (part: number, total: number, message: string) => void
): Promise<ChunkUploadResult> {
  let successCount = 0;
  const errors: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const partNum = i + 1;
    const chunkText = chunks[i];

    onProgress(partNum, chunks.length, `⏳ Uploading part ${partNum}/${chunks.length}...`);

    try {
      const response = await fetch('/api/admin/rag-documents/upload-chunked', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: chunks.length > 1 ? `${title} (Part ${partNum}/${chunks.length})` : title,
          source: source || undefined,
          content: chunkText,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Upload failed for part ${partNum}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || `Part ${partNum} did not complete`);
      }
      successCount++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Part ${partNum}: ${msg}`);
    }
  }

  return { successCount, totalChunks: chunks.length, errors };
}
