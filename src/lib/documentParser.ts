/* eslint-disable no-console */
import mammoth from 'mammoth';

// Polyfill DOM APIs for Node.js environment (required by pdfjs-dist)
if (typeof globalThis !== 'undefined' && !globalThis.DOMMatrix) {
  // @ts-expect-error - Polyfill for Node.js
  globalThis.DOMMatrix = class DOMMatrix {
    constructor(init?: any) {
      return init || {};
    }
  };
}

if (typeof globalThis !== 'undefined' && !globalThis.ImageData) {
  // @ts-expect-error - Polyfill for Node.js
  globalThis.ImageData = class ImageData {
    width: number;
    height: number;
    data: Uint8ClampedArray;

    constructor(width: number, height: number) {
      this.width = width;
      this.height = height;
      this.data = new Uint8ClampedArray(width * height * 4);
    }
  };
}

if (typeof globalThis !== 'undefined' && !globalThis.Path2D) {
  // @ts-expect-error - Polyfill for Node.js
  globalThis.Path2D = class Path2D {
    addPath() {}
    closePath() {}
    moveTo() {}
    lineTo() {}
    bezierCurveTo() {}
    quadraticCurveTo() {}
    arc() {}
    arcTo() {}
    ellipse() {}
    rect() {}
  };
}

export type SupportedFileType = 'pdf' | 'docx' | 'txt';

export interface ParsedDocument {
  title: string;
  content: string;
  fileType: SupportedFileType;
}

export function getSupportedFileType(filename: string): SupportedFileType | null {
  const ext = filename.toLowerCase().split('.').pop();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx') return 'docx';
  if (ext === 'txt') return 'txt';
  return null;
}

async function parsePDF(buffer: Buffer): Promise<string> {
  console.log('[PDF-PARSER] Starting PDF text extraction...');
  try {
    // Use pdf-text-extract - simple Node.js library for text extraction
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
    const pdfExtract = require('pdf-text-extract');

    return new Promise((resolve, reject) => {
      // pdf-text-extract requires a file path, so we use a callback approach
      pdfExtract(buffer, { type: 'buffer' }, (err: any, pages: any) => {
        if (err) {
          console.error('[PDF-PARSER] Extraction error:', err);
          reject(new Error(`PDF extraction failed: ${err.message}`));
          return;
        }

        if (!pages || !Array.isArray(pages)) {
          console.error('[PDF-PARSER] No pages extracted');
          reject(new Error('No text pages extracted from PDF'));
          return;
        }

        const fullText = pages.join('\n');
        console.log(`[PDF-PARSER] ✅ Extracted ${fullText.length} characters from ${pages.length} pages`);
        resolve(fullText.trim());
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'PDF parsing failed';
    throw new Error(`PDF extraction error: ${message}`);
  }
}

export async function parseDocument(buffer: Buffer, filename: string): Promise<ParsedDocument> {
  const fileType = getSupportedFileType(filename);

  if (!fileType) {
    throw new Error(`Unsupported file type: ${filename}. Supported: PDF, DOCX, TXT`);
  }

  console.log(`[PARSER] Parsing ${fileType.toUpperCase()}: ${filename}`);

  let content = '';

  try {
    if (fileType === 'pdf') {
      console.log(`[PARSER] Extracting text from PDF...`);
      content = await parsePDF(buffer);
      console.log(`[PARSER] ✅ PDF extracted (${content.length} characters)`);
    } else if (fileType === 'docx') {
      console.log(`[PARSER] Extracting text from DOCX...`);
      const result = await mammoth.extractRawText({ buffer });
      content = result.value;
      console.log(`[PARSER] ✅ DOCX extracted (${content.length} characters)`);
    } else if (fileType === 'txt') {
      console.log(`[PARSER] Reading TXT file...`);
      content = buffer.toString('utf-8');
      console.log(`[PARSER] ✅ TXT read (${content.length} characters)`);
    }

    if (!content || content.trim().length === 0) {
      throw new Error('Extracted content is empty');
    }

    return {
      title: filename.replace(/\.[^/.]+$/, ''),
      content: content.trim(),
      fileType,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Parsing failed';
    console.error(`[PARSER] ❌ Error parsing ${filename}:`, message);
    throw new Error(`Failed to parse ${filename}: ${message}`);
  }
}
