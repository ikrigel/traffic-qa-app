export function splitTextIntoChunks(text: string, maxSize: number = 50 * 1024): string[] {
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

    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }

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
        const text = await response.text();
        const isJson = text.startsWith('{');
        if (isJson) {
          try {
            const error = JSON.parse(text);
            throw new Error(error.error || `Upload failed (${response.status})`);
          } catch {
            throw new Error(`Server error: ${response.status}`);
          }
        } else {
          throw new Error(`Server error ${response.status}: ${text.substring(0, 100)}`);
        }
      }

      const resultText = await response.text();
      if (!resultText) throw new Error('Empty response');
      const result = JSON.parse(resultText);
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
