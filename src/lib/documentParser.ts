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

async function parsePDF(buffer: Buffer): Promise<{ content: string; pageCount: number }> {
  console.log('[PDF-PARSER] 🔍 Starting PDF text extraction...');
  console.log(`[PDF-PARSER] 📊 Buffer size: ${buffer.length} bytes`);

  try {
    // Use pdf2json - pure JavaScript, no external dependencies
    console.log('[PDF-PARSER] 📦 Requiring pdf2json library...');
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
    const PDFParser = require('pdf2json');
    console.log('[PDF-PARSER] ✅ pdf2json loaded');

    return new Promise((resolve, reject) => {
      console.log('[PDF-PARSER] 🔄 Creating PDFParser instance...');
      const pdfParser = new PDFParser();

      console.log('[PDF-PARSER] 📡 Setting up event listeners...');
      pdfParser.on('pdfParser_dataError', (error: any) => {
        console.error('[PDF-PARSER] ❌ PARSER ERROR:');
        console.error(`[PDF-PARSER] Error type: ${error.constructor.name}`);
        const errorMsg = error.message || error.parserError || JSON.stringify(error);
        console.error(`[PDF-PARSER] Error message: ${errorMsg}`);

        // Provide helpful error messages based on error type
        let userMessage = 'PDF parsing failed';
        if (errorMsg.includes('XRef') || errorMsg.includes('Invalid')) {
          userMessage = 'PDF format not supported or corrupted. Try: 1) Re-export the PDF from the source, 2) Use a different PDF tool, 3) Convert to PDF/A format';
        } else if (errorMsg.includes('permission') || errorMsg.includes('encrypted')) {
          userMessage = 'PDF is password-protected or encrypted. Please remove encryption and try again.';
        }

        reject(new Error(`${userMessage} (${errorMsg})`));
      });

      pdfParser.on('pdfParser_dataReady', (data: any) => {
        console.log('[PDF-PARSER] 📞 Parser data ready callback triggered');
        try {
          console.log(`[PDF-PARSER] 📊 PDF data received. Pages: ${data.Pages ? data.Pages.length : 'unknown'}`);

          if (!data.Pages || !Array.isArray(data.Pages)) {
            console.error('[PDF-PARSER] ❌ INVALID DATA:');
            console.error(`[PDF-PARSER] Pages type: ${typeof data.Pages}`);
            reject(new Error('No pages found in PDF'));
            return;
          }

          const pageCount = data.Pages.length;
          console.log(`[PDF-PARSER] 📑 Processing ${pageCount} pages...`);

          // Extract text from all pages
          let fullText = '';
          for (let pageNum = 0; pageNum < data.Pages.length; pageNum++) {
            const page = data.Pages[pageNum];
            console.log(`[PDF-PARSER] 🔤 Extracting text from page ${pageNum + 1}...`);

            if (page.Texts && Array.isArray(page.Texts)) {
              const pageText = page.Texts.map((textItem: any) => {
                if (textItem.R && Array.isArray(textItem.R)) {
                  return textItem.R.map((r: any) => {
                    try {
                      // Safe URI decoding - handle malformed URIs
                      return decodeURIComponent(r.T || '');
                    } catch (decodeError) {
                      // If decoding fails, return raw text
                      console.warn(`[PDF-PARSER] ⚠️ Failed to decode URI, using raw text`);
                      return r.T || '';
                    }
                  }).join('');
                }
                return '';
              }).join(' ');

              fullText += pageText + '\n';
              console.log(`[PDF-PARSER] ✅ Page ${pageNum + 1} extracted (${pageText.length} chars)`);
            }
          }

          console.log(`[PDF-PARSER] ✅ Text extraction complete`);
          console.log(`[PDF-PARSER] 📈 Extracted ${fullText.length} characters from ${pageCount} pages`);

          if (fullText.trim().length === 0) {
            console.warn('[PDF-PARSER] ⚠️ Warning: Extracted text is empty');
          }

          resolve({ content: fullText.trim(), pageCount });
        } catch (parseError) {
          console.error('[PDF-PARSER] ❌ ERROR IN DATA PROCESSING:');
          const message = parseError instanceof Error ? parseError.message : String(parseError);
          console.error(`[PDF-PARSER] Error: ${message}`);
          reject(parseError);
        }
      });

      console.log('[PDF-PARSER] 🔄 Starting PDF parsing from buffer...');
      pdfParser.parseBuffer(buffer);
    });
  } catch (error) {
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

export async function parseDocument(buffer: Buffer, filename: string): Promise<ParsedDocument & { pageCount?: number }> {
  const fileType = getSupportedFileType(filename);

  if (!fileType) {
    throw new Error(`Unsupported file type: ${filename}. Supported: PDF, DOCX, TXT`);
  }

  console.log(`[PARSER] Parsing ${fileType.toUpperCase()}: ${filename}`);

  let content = '';
  let pageCount = 0;

  try {
    if (fileType === 'pdf') {
      console.log(`[PARSER] Extracting text from PDF...`);
      const result = await parsePDF(buffer);
      content = result.content;
      pageCount = result.pageCount;

      // Validate page count
      if (pageCount > 300) {
        throw new Error(`PDF has too many pages (${pageCount} pages, max 300). Please split into smaller files.`);
      }

      console.log(`[PARSER] ✅ PDF extracted (${content.length} characters, ${pageCount} pages)`);
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

    // Validate content size - chunked uploads can handle up to 5MB extracted content
    if (content.length > 5000000) {
      throw new Error(`Extracted content is too large (${(content.length / 1000000).toFixed(2)}MB, max 5MB). Please split into smaller files or reduce document size.`);
    }

    return {
      title: filename.replace(/\.[^/.]+$/, ''),
      content: content.trim(),
      fileType,
      pageCount,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Parsing failed';
    console.error(`[PARSER] ❌ Error parsing ${filename}:`, message);
    throw new Error(`Failed to parse ${filename}: ${message}`);
  }
}
