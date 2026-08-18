export interface PDFChunk {
  partNumber: number;
  totalParts: number;
  text: string;
  title: string;
}

const MAX_CHUNK_SIZE = 3 * 1024 * 1024;

export async function splitLargePDF(file: File, baseTitle: string): Promise<PDFChunk[]> {
  try {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }

    if (!fullText.trim()) {
      throw new Error('No text could be extracted from PDF');
    }

    const chunks = splitTextIntoChunks(fullText, MAX_CHUNK_SIZE);
    return chunks.map((text, idx) => ({
      partNumber: idx + 1,
      totalParts: chunks.length,
      text,
      title: `${baseTitle} (Part ${idx + 1}/${chunks.length})`,
    }));
  } catch (err) {
    throw new Error(
      `Failed to split PDF: ${err instanceof Error ? err.message : 'Unknown error'}`
    );
  }
}

function splitTextIntoChunks(text: string, maxSize: number): string[] {
  const chunks: string[] = [];
  let currentChunk = '';

  const lines = text.split('\n');

  for (const line of lines) {
    const testChunk = currentChunk + (currentChunk ? '\n' : '') + line;

    if (testChunk.length > maxSize && currentChunk) {
      chunks.push(currentChunk);
      currentChunk = line;
    } else {
      currentChunk = testChunk;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}
