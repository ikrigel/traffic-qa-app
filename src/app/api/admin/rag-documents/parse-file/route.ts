import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import PdfParse from 'pdf2json';

export const dynamic = 'force-dynamic';

async function extractPDFText(buffer: ArrayBuffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new (PdfParse as any)();
    pdfParser.on('pdfParser_dataError', (err: any) => {
      reject(new Error(`PDF parsing error: ${err.message || err}`));
    });
    pdfParser.on('pdfParser_dataReady', () => {
      const text = pdfParser.getRawTextContent();
      if (!text || text.trim().length === 0) {
        reject(new Error('No text extracted from PDF. File may be empty or image-based.'));
      } else {
        resolve(text);
      }
    });
    pdfParser.parseBuffer(Buffer.from(buffer));
  });
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['super_admin']);
    if (!auth.authorized) {
      return auth.response;
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'pdf') {
      const buffer = await file.arrayBuffer();
      const text = await extractPDFText(buffer);
      return NextResponse.json({ text });
    } else {
      return NextResponse.json(
        { error: `Unsupported file type: .${ext}. Use /parse-file for PDF files.` },
        { status: 400 }
      );
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[PARSE-FILE] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
