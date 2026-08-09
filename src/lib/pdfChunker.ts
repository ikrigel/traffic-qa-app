/**
 * Intelligent PDF Chunking Algorithm
 * Splits large PDFs into manageable chunks while preserving context
 */

export interface ChunkedDocument {
  title: string;
  content: string;
  chunkIndex: number;
  totalChunks: number;
  pageStart: number;
  pageEnd: number;
  source: string;
  isChunk: boolean;
  parentTitle: string;
}

const MAX_CHUNK_SIZE = 400000; // 400KB per chunk (safer for embeddings)
const MIN_CHUNK_SIZE = 50000; // Minimum size to avoid tiny chunks
const OVERLAP_RATIO = 0.1; // 10% overlap between chunks for context
const IDEAL_CHUNK_SIZE = 300000; // Target size for good embedding quality

/**
 * Find natural breaking points in text (paragraphs, double newlines)
 */
function findBreakPoint(text: string, maxPosition: number, minPosition: number): number {
  let bestPosition = maxPosition;
  const lastDoubleNewline = text.lastIndexOf('\n\n', maxPosition);

  if (lastDoubleNewline > minPosition) {
    bestPosition = lastDoubleNewline + 2; // Include the newlines
  } else {
    // Fall back to single newline
    const lastNewline = text.lastIndexOf('\n', maxPosition);
    if (lastNewline > minPosition) {
      bestPosition = lastNewline + 1;
    }
  }

  return bestPosition;
}

/**
 * Estimate page numbers based on text position (rough approximation)
 */
function estimatePageNumber(totalPages: number, position: number, totalLength: number): number {
  return Math.max(1, Math.ceil((position / totalLength) * totalPages));
}

/**
 * Intelligently chunk large documents
 */
export function chunkDocument(
  content: string,
  title: string,
  source: string,
  pageCount: number = 0
): ChunkedDocument[] {
  const totalLength = content.length;

  // If document is small enough, return as single chunk
  if (totalLength <= MAX_CHUNK_SIZE) {
    return [
      {
        title,
        content,
        chunkIndex: 0,
        totalChunks: 1,
        pageStart: 1,
        pageEnd: pageCount,
        source,
        isChunk: false,
        parentTitle: title,
      },
    ];
  }

  console.log(`[CHUNKER] 📚 Document size: ${(totalLength / 1000000).toFixed(2)}MB`);
  console.log(`[CHUNKER] 📑 Pages: ${pageCount}`);

  const chunks: ChunkedDocument[] = [];
  let position = 0;
  let chunkIndex = 0;
  let overlapContent = '';

  while (position < totalLength) {
    const chunkStart = position;
    const maxEnd = Math.min(position + IDEAL_CHUNK_SIZE, totalLength);

    // Find natural breaking point
    const chunkEnd = findBreakPoint(content, maxEnd, position + MIN_CHUNK_SIZE);

    // Combine with overlap from previous chunk
    const chunkContent = overlapContent + content.substring(chunkStart, chunkEnd);

    // Calculate page numbers
    const pageStart = estimatePageNumber(pageCount, chunkStart, totalLength);
    const pageEnd = estimatePageNumber(pageCount, chunkEnd, totalLength);

    const chunkTitle = `${title} (Part ${chunkIndex + 1})`;

    chunks.push({
      title: chunkTitle,
      content: chunkContent.trim(),
      chunkIndex,
      totalChunks: 0, // Will be updated after we know total count
      pageStart,
      pageEnd,
      source: `${source} • Page ${pageStart}-${pageEnd}`,
      isChunk: true,
      parentTitle: title,
    });

    console.log(
      `[CHUNKER] ✅ Chunk ${chunkIndex + 1}: Pages ${pageStart}-${pageEnd} (${chunkContent.length} chars)`
    );

    // Prepare overlap for next chunk
    const overlapStart = Math.max(chunkStart, chunkEnd - Math.floor((chunkEnd - chunkStart) * OVERLAP_RATIO));
    overlapContent = content.substring(overlapStart, chunkEnd);

    position = chunkEnd;
    chunkIndex++;
  }

  // Update total chunks count
  chunks.forEach(chunk => {
    chunk.totalChunks = chunks.length;
  });

  console.log(`[CHUNKER] ✅ Split into ${chunks.length} chunks`);
  return chunks;
}

/**
 * Format chunks for display in UI
 */
export function formatChunkInfo(chunks: ChunkedDocument[]): string {
  if (chunks.length === 1) {
    return '✓ Single document (no chunking needed)';
  }

  return `📚 Split into ${chunks.length} parts:\n${chunks.map(c => `  • Part ${c.chunkIndex + 1}: Pages ${c.pageStart}-${c.pageEnd}`).join('\n')}`;
}
