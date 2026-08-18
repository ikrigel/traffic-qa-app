'use client';

import { useState, useRef } from 'react';
import UploadStatusDisplay from './UploadStatusDisplay';

interface UploadState {
  filename: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  message?: string;
}

export default function ChunkedUploadPanel() {
  const [title, setTitle] = useState('');
  const [source, setSource] = useState('');
  const [content, setContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState | null>(null);
  const [uploadHistory, setUploadHistory] = useState<UploadState[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isParsing, setIsParsing] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files || !files[0]) return;

    const file = files[0];
    setIsParsing(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let text = '';

      if (ext === 'txt') {
        text = await file.text();
      } else if (ext === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
      } else if (ext === 'htm' || ext === 'html') {
        const htmlContent = await file.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        text = (doc.body.innerText || doc.body.textContent || '').trim();
      } else if (ext === 'pdf') {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch('/api/admin/rag-documents/parse-file', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });
        if (!response.ok) {
          if (response.status === 413) {
            throw new Error('File too large for server. Try: 1) Paste text directly 2) Split PDF into smaller parts');
          }
          if (response.status === 400 || response.status === 500) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || `Server error (${response.status})`);
          }
          throw new Error(`PDF parsing failed (${response.status})`);
        }
        const result = await response.json();
        text = result.text;
      } else {
        throw new Error(`Unsupported file type: .${ext}. Supported: .txt, .docx, .htm, .html, .pdf`);
      }

      if (!text) throw new Error('File is empty or could not be parsed');

      const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setTitle(fileNameWithoutExt);
      setContent(text);
      setUploadState({
        filename: file.name,
        progress: 100,
        status: 'success',
        message: `✅ Extracted ${text.length} characters`,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setUploadState({
        filename: files[0].name,
        progress: 0,
        status: 'error',
        message: `❌ ${errorMsg}`,
      });
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!title.trim()) {
      setUploadState({
        filename: 'Validation',
        progress: 0,
        status: 'error',
        message: '❌ Please enter a title',
      });
      return;
    }

    if (!content.trim()) {
      setUploadState({
        filename: 'Validation',
        progress: 0,
        status: 'error',
        message: '❌ Please enter document content',
      });
      return;
    }

    setIsUploading(true);
    setUploadState({
      filename: title,
      progress: 10,
      status: 'uploading',
      message: '⏳ Uploading...',
    });

    try {
      const response = await fetch('/api/admin/rag-documents/upload-chunked', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          source: source.trim() || undefined,
          content: content.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Upload did not complete successfully');
      }

      const newState: UploadState = {
        filename: title,
        progress: 100,
        status: 'success',
        message: `✅ ${result.summary} (${result.uploaded}/${result.totalChunks} chunks uploaded)`,
      };

      setUploadState(newState);
      setUploadHistory([newState, ...uploadHistory.slice(0, 9)]);

      // Clear form
      setTitle('');
      setSource('');
      setContent('');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      const newState: UploadState = {
        filename: title,
        progress: 0,
        status: 'error',
        message: `❌ ${errorMsg}`,
      };
      setUploadState(newState);
      setUploadHistory([newState, ...uploadHistory.slice(0, 9)]);
    } finally {
      setIsUploading(false);
    }
  };


  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">📤 Upload Documents (Chunked)</h3>
        <p className="text-sm text-gray-600">Upload large documents that will be split into chunks for better embeddings</p>
        <div className="border-2 border-dashed border-indigo-300 rounded-lg p-6 bg-indigo-50">
          <label className="block text-sm font-medium text-gray-700 mb-3">📤 Upload File or Paste Text</label>
          <input ref={fileInputRef} type="file" accept=".txt,.docx,.htm,.html,.pdf" onChange={handleFileSelect} disabled={isUploading || isParsing} className="hidden"/>
          <div className="flex gap-3 flex-wrap">
            <button onClick={() => fileInputRef.current?.click()} disabled={isUploading || isParsing} className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-semibold transition text-lg">
              {isParsing ? '⏳ Parsing...' : '📁 Choose File'}
            </button>
            <div className="flex flex-col justify-center">
              <p className="text-sm text-gray-700 font-medium">Supported: TXT, DOCX, HTM, PDF</p>
              <p className="text-xs text-gray-600">Hebrew and Unicode fully supported</p>
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Document Title *</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Traffic Law Regulations Part 1" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" disabled={isUploading}/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Source (Optional)</label>
          <input type="text" value={source} onChange={e => setSource(e.target.value)} placeholder="e.g., תקנות התעבורה" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" disabled={isUploading}/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Document Content *</label>
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Paste your document text here (supports up to 10MB+ of text)..." rows={8} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm" disabled={isUploading}/>
          <p className="text-xs text-gray-500 mt-1">{content.length} characters</p>
        </div>
        <button onClick={handleUpload} disabled={isUploading || !title.trim() || !content.trim()} className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-semibold transition">
          {isUploading ? '⏳ Uploading...' : '📤 Upload & Chunk'}
        </button>
      </div>
      <UploadStatusDisplay uploadState={uploadState} uploadHistory={uploadHistory} />
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
        <p className="font-semibold text-blue-900">ℹ️ How Chunking Works</p>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Documents are split into 1,500 character chunks</li>
          <li>200 character overlap between chunks for context</li>
          <li>Each chunk breaks at natural points (periods, newlines)</li>
          <li>All chunks get embedded and uploaded to Pinecone</li>
          <li>Metadata links chunks to original document</li>
        </ul>
      </div>
    </div>
  );
}
