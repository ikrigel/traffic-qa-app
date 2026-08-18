'use client';

import { useState } from 'react';
import * as mammoth from 'mammoth';

interface ParseResult {
  title: string;
  content: string;
  message: string;
}

export function useFileParser() {
  const [isParsing, setIsParsing] = useState(false);

  const extractTextFromDocx = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } catch (err) {
      throw new Error(`Failed to parse DOCX: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const extractTextFromHTML = (content: string): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const text = doc.body.innerText || doc.body.textContent || '';
    return text.trim();
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }

    return fullText.trim();
  };

  const parseFile = async (file: File): Promise<ParseResult> => {
    setIsParsing(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let text = '';

      if (ext === 'txt') {
        text = await file.text();
      } else if (ext === 'docx') {
        text = await extractTextFromDocx(file);
      } else if (ext === 'htm' || ext === 'html') {
        const htmlContent = await file.text();
        text = extractTextFromHTML(htmlContent);
      } else if (ext === 'pdf') {
        text = await extractTextFromPDF(file);
      } else {
        throw new Error(`Unsupported file type: .${ext}. Supported: .txt, .docx, .htm, .html, .pdf`);
      }

      if (!text || text.length === 0) {
        throw new Error('File appears to be empty or could not be parsed.');
      }

      const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      return {
        title: fileNameWithoutExt,
        content: text,
        message: `✅ Extracted ${text.length} characters`,
      };
    } finally {
      setIsParsing(false);
    }
  };

  return { parseFile, isParsing };
}
