export interface TextChunk {
  content: string;
  index: number;
  charStart: number;
  charEnd: number;
  regulationNumbers?: string[];
}

interface ChunkOptions {
  targetTokens?: number;
  overlapTokens?: number;
  charsPerToken?: number;
}

export function chunkText(content: string, options: ChunkOptions = {}): TextChunk[] {
  const { targetTokens = 400, overlapTokens = 50, charsPerToken = 4 } = options;
  const targetChars = targetTokens * charsPerToken;
  const overlapChars = Math.ceil(overlapTokens * charsPerToken);

  // Pass 0: Detect regulation boundaries (Hebrew legal text)
  const regulationRegex = /^\s*תקנה\s+(\d+[א-ת]?)/gm;
  const regMatches = [...content.matchAll(regulationRegex)];

  let segments: { content: string; regulationNumbers?: string[] }[] = [];

  if (regMatches.length >= 2) {
    // Split at regulation boundaries
    const boundaryIndices = regMatches.map(m => m.index);
    for (let i = 0; i < boundaryIndices.length; i++) {
      const start = boundaryIndices[i];
      const end = i + 1 < boundaryIndices.length ? boundaryIndices[i + 1] : content.length;
      const segmentContent = content.substring(start, end).trim();
      const regulationMatch = segmentContent.match(/^תקנה\s+(\d+[א-ת]?)/);
      segments.push({
        content: segmentContent,
        regulationNumbers: regulationMatch ? [regulationMatch[1]] : undefined,
      });
    }
  } else {
    // No clear regulation boundaries or fewer than 2 — treat entire content as one segment
    segments = [{ content }];
  }

  // Pass 1: Recursively split each segment
  const allChunks: TextChunk[] = [];
  let globalIndex = 0;
  let globalCharOffset = 0;

  for (const segment of segments) {
    const segmentChunks = recursiveSplit(segment.content, {
      targetChars,
      overlapChars,
      regulationNumbers: segment.regulationNumbers,
    });

    // Apply overlap between chunks within this segment (not across segment boundaries)
    for (let i = 0; i < segmentChunks.length; i++) {
      const chunk = segmentChunks[i];
      let chunkContent = chunk.content;

      // Add overlap from previous chunk if not the first chunk in segment and not first chunk overall
      if (i > 0) {
        const prevChunk = segmentChunks[i - 1];
        const overlapContent = prevChunk.content.slice(-overlapChars);
        chunkContent = overlapContent + chunkContent;
      }

      allChunks.push({
        content: chunkContent,
        index: globalIndex,
        charStart: globalCharOffset + chunk.charStart,
        charEnd: globalCharOffset + chunk.charEnd + (i > 0 ? overlapChars : 0),
        regulationNumbers: chunk.regulationNumbers,
      });
      globalIndex++;
    }

    globalCharOffset += segment.content.length;
  }

  return allChunks;
}

interface SplitSegment {
  content: string;
  charStart: number;
  charEnd: number;
  regulationNumbers?: string[];
}

function recursiveSplit(
  text: string,
  options: {
    targetChars: number;
    overlapChars: number;
    regulationNumbers?: string[];
  }
): SplitSegment[] {
  const { targetChars, overlapChars, regulationNumbers } = options;

  if (text.length <= targetChars) {
    return [{ content: text, charStart: 0, charEnd: text.length, regulationNumbers }];
  }

  // Try separators in priority order
  const separators = [
    { pattern: /\n\n/g, name: 'paragraph' },
    { pattern: /\n/g, name: 'line' },
    { pattern: /([.!?])\s+(?=[A-Zא-ת])/g, name: 'sentence' }, // Sentence ending followed by capital letter or Hebrew letter
    { pattern: /\.\n/g, name: 'dotline' }, // Period followed by newline (Hebrew text sometimes lacks spaces)
  ];

  for (const { pattern } of separators) {
    const splits = trySplitBySeparator(text, pattern, targetChars);
    if (splits.length > 1) {
      // Successfully split
      return splits.flatMap((split, idx) =>
        recursiveSplit(split.content, {
          targetChars,
          overlapChars,
          regulationNumbers: idx === 0 ? regulationNumbers : undefined,
        }).map(chunk => ({
          ...chunk,
          charStart: split.charStart + chunk.charStart,
          charEnd: split.charStart + chunk.charEnd,
        }))
      );
    }
  }

  // Fallback: split at nearest whitespace before target
  const splits = splitAtWhitespace(text, targetChars);
  return splits.map(split => ({
    content: split,
    charStart: 0,
    charEnd: split.length,
    regulationNumbers,
  }));
}

function trySplitBySeparator(
  text: string,
  pattern: RegExp,
  targetChars: number
): { content: string; charStart: number; charEnd: number }[] {
  const matches = [...text.matchAll(pattern)];
  if (matches.length === 0) return [{ content: text, charStart: 0, charEnd: text.length }];

  const chunks: { content: string; charStart: number; charEnd: number }[] = [];
  let lastEnd = 0;

  for (const match of matches) {
    const chunkContent = text.substring(lastEnd, match.index).trim();
    if (chunkContent.length > 0) {
      chunks.push({
        content: chunkContent,
        charStart: lastEnd,
        charEnd: match.index,
      });
    }
    lastEnd = match.index + match[0].length;
  }

  // Add final chunk after last separator
  const finalContent = text.substring(lastEnd).trim();
  if (finalContent.length > 0) {
    chunks.push({
      content: finalContent,
      charStart: lastEnd,
      charEnd: text.length,
    });
  }

  // Check if this separator produced chunks close to target size
  const avgSize = chunks.reduce((sum, c) => sum + c.content.length, 0) / chunks.length;
  const withinRange = avgSize > targetChars * 0.5 && avgSize < targetChars * 1.5;

  if (withinRange && chunks.length > 1) {
    return chunks;
  }

  return [{ content: text, charStart: 0, charEnd: text.length }];
}

function splitAtWhitespace(text: string, targetChars: number): string[] {
  const chunks: string[] = [];
  let current = '';

  const words = text.split(/(\s+)/); // Keep whitespace
  for (const word of words) {
    if ((current + word).length <= targetChars) {
      current += word;
    } else {
      if (current.length > 0) {
        chunks.push(current.trim());
      }
      current = word.trim();
    }
  }

  if (current.length > 0) {
    chunks.push(current);
  }

  return chunks.length > 0 ? chunks : [text];
}
