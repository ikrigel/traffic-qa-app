/* eslint-disable no-console */
import mammoth from 'mammoth';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

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
  console.log('[PDF-PARSER] 🔍 Starting PDF text extraction...');
  console.log(`[PDF-PARSER] 📊 Buffer size: ${buffer.length} bytes`);

  let tempFilePath: string | null = null;

  try {
    // Use pdf-text-extract - requires file path, not buffer
    console.log('[PDF-PARSER] 📦 Requiring pdf-text-extract library...');
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
    const pdfExtract = require('pdf-text-extract');
    console.log('[PDF-PARSER] ✅ pdf-text-extract loaded');

    // Create temporary file from buffer
    console.log('[PDF-PARSER] 📁 Creating temporary file...');
    tempFilePath = join(tmpdir(), `pdf-extract-${Date.now()}.pdf`);
    console.log(`[PDF-PARSER] 📝 Temp file path: ${tempFilePath}`);

    writeFileSync(tempFilePath, buffer);
    console.log(`[PDF-PARSER] ✅ Temporary file created (${buffer.length} bytes written)`);

    return new Promise((resolve, reject) => {
      console.log('[PDF-PARSER] 🔄 Starting extraction with file path...');
      // pdf-text-extract requires a file path
      pdfExtract(tempFilePath, {}, (err: any, pages: any) => {
        console.log('[PDF-PARSER] 📞 Extraction callback triggered');

        // Cleanup temp file
        if (tempFilePath) {
          try {
            unlinkSync(tempFilePath);
            console.log('[PDF-PARSER] ✅ Temporary file deleted');
          } catch (cleanupErr) {
            console.warn('[PDF-PARSER] ⚠️ Failed to delete temp file:', cleanupErr);
          }
        }

        if (err) {
          console.error('[PDF-PARSER] ❌ EXTRACTION ERROR DETAILS:');
          console.error(`[PDF-PARSER] Error type: ${err.constructor.name}`);
          console.error(`[PDF-PARSER] Error message: ${err.message}`);
          console.error(`[PDF-PARSER] Error stack: ${err.stack}`);
          reject(new Error(`PDF extraction failed at library level: ${err.message}`));
          return;
        }

        console.log(`[PDF-PARSER] 📄 Extraction successful. Pages received: ${typeof pages}, is array: ${Array.isArray(pages)}`);

        if (!pages || !Array.isArray(pages)) {
          console.error('[PDF-PARSER] ❌ INVALID RESPONSE:');
          console.error(`[PDF-PARSER] Pages type: ${typeof pages}`);
          console.error(`[PDF-PARSER] Pages value: ${JSON.stringify(pages)}`);
          reject(new Error(`Invalid pages response: ${typeof pages}, expected array`));
          return;
        }

        console.log(`[PDF-PARSER] 📑 Processing ${pages.length} pages...`);
        const fullText = pages.join('\n');
        console.log(`[PDF-PARSER] ✅ Text concatenation complete`);
        console.log(`[PDF-PARSER] 📈 Extracted ${fullText.length} characters from ${pages.length} pages`);
        resolve(fullText.trim());
      });
    });
  } catch (error) {
    // Cleanup on sync error
    if (tempFilePath) {
      try {
        unlinkSync(tempFilePath);
        console.log('[PDF-PARSER] ✅ Temporary file deleted (error cleanup)');
      } catch (cleanupErr) {
        console.warn('[PDF-PARSER] ⚠️ Failed to cleanup temp file:', cleanupErr);
      }
    }

    console.error('[PDF-PARSER] ❌ SYNC ERROR CAUGHT:');
    console.error(`[PDF-PARSER] Error type: ${error instanceof Error ? error.constructor.name : typeof error}`);
    console.error(`[PDF-PARSER] Error message: ${error instanceof Error ? error.message : String(error)}`);
    if (error instanceof Error) {
      console.error(`[PDF-PARSER] Error stack: ${error.stack}`);
    }
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
