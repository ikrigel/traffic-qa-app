export interface DocumentChunk {
  content: string;
  chunkIndex: number;
  totalChunks: number;
  source: string;
}

const CHUNK_SIZE = 1500; // characters per chunk
const CHUNK_OVERLAP = 200; // overlap for context

export function chunkDocument(
  content: string,
  source: string,
  chunkSize: number = CHUNK_SIZE,
  overlap: number = CHUNK_OVERLAP
): DocumentChunk[] {
  if (!content || content.trim().length === 0) {
    return [];
  }

  const chunks: DocumentChunk[] = [];
  let currentIndex = 0;

  while (currentIndex < content.length) {
    // Get chunk from current position to chunkSize ahead
    let chunkEnd = Math.min(currentIndex + chunkSize, content.length);

    // Try to find a natural break point (period, newline) within the last 200 chars
    if (chunkEnd < content.length) {
      let breakPoint = chunkEnd;
      for (let i = chunkEnd; i > currentIndex + chunkSize * 0.7; i--) {
        if (content[i] === '.' || content[i] === '\n') {
          breakPoint = i + 1;
          break;
        }
      }
      chunkEnd = breakPoint;
    }

    const chunk = content.substring(currentIndex, chunkEnd).trim();

    if (chunk.length > 0) {
      chunks.push({
        content: chunk,
        chunkIndex: chunks.length,
        totalChunks: 0, // Will be set after we know total
        source,
      });
    }

    // Move forward by chunkSize minus overlap
    currentIndex = chunkEnd - overlap;
  }

  // Set total chunks count
  chunks.forEach(chunk => {
    chunk.totalChunks = chunks.length;
  });

  return chunks;
}

export function validateChunks(chunks: DocumentChunk[]): boolean {
  if (chunks.length === 0) return false;

  for (const chunk of chunks) {
    if (!chunk.content || chunk.content.trim().length === 0) {
      console.error('Empty chunk found');
      return false;
    }
    if (chunk.content.length > CHUNK_SIZE * 1.5) {
      console.warn(`Chunk exceeds size: ${chunk.content.length} chars`);
    }
  }

  return true;
}
