'use client';

import { useState } from 'react';

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

  const getStatusColor = (status: string) => {
    if (status === 'success') return 'bg-green-50 border-green-200';
    if (status === 'error') return 'bg-red-50 border-red-200';
    if (status === 'uploading') return 'bg-blue-50 border-blue-200';
    return 'bg-gray-50 border-gray-200';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'success') return '✅';
    if (status === 'error') return '❌';
    if (status === 'uploading') return '⏳';
    return '⏹️';
  };

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">📤 Upload Documents (Chunked)</h3>
        <p className="text-sm text-gray-600">
          Upload large documents that will be automatically split into chunks for better embeddings
        </p>

        {/* Title Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Document Title *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g., Traffic Law Regulations Part 1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={isUploading}
          />
        </div>

        {/* Source Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Source (Optional)</label>
          <input
            type="text"
            value={source}
            onChange={e => setSource(e.target.value)}
            placeholder="e.g., תקנות התעבורה"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={isUploading}
          />
        </div>

        {/* Content TextArea */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Document Content *</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Paste your document text here (supports up to 10MB+ of text)..."
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
            disabled={isUploading}
          />
          <p className="text-xs text-gray-500 mt-1">{content.length} characters</p>
        </div>

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={isUploading || !title.trim() || !content.trim()}
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition"
        >
          {isUploading ? '⏳ Uploading...' : '📤 Upload & Chunk'}
        </button>
      </div>

      {/* Current Upload Status */}
      {uploadState && (
        <div className={`rounded-lg border-2 p-4 ${getStatusColor(uploadState.status)}`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getStatusIcon(uploadState.status)}</span>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{uploadState.filename}</p>
              <p className="text-sm text-gray-700">{uploadState.message}</p>
              {uploadState.status === 'uploading' && (
                <div className="mt-2 w-full bg-gray-300 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all"
                    style={{ width: `${uploadState.progress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload History */}
      {uploadHistory.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">📋 Upload History</h3>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {uploadHistory.map((upload, idx) => (
              <div key={idx} className={`rounded-lg border p-3 ${getStatusColor(upload.status)}`}>
                <div className="flex items-start gap-2">
                  <span className="text-lg flex-shrink-0">{getStatusIcon(upload.status)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 break-words">{upload.filename}</p>
                    <p className="text-sm text-gray-700">{upload.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Section */}
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
