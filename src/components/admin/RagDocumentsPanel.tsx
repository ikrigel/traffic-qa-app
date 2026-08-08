'use client';

import { useState } from 'react';
import { useAdminRagDocuments } from '@/hooks/useAdminRagDocuments';

export default function RagDocumentsPanel() {
  const { documents, loading, error, uploadDocument } = useAdminRagDocuments();
  const [tab, setTab] = useState<'text' | 'files'>('text');
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [source, setSource] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileSource, setFileSource] = useState('');

  const handleUpload = async () => {
    if (!title.trim() || !content.trim()) {
      setMessage({ type: 'error', text: 'Please fill in title and content' });
      return;
    }

    setUploading(true);
    setMessage(null);

    const success = await uploadDocument(title, content, source || undefined);

    if (success) {
      setTitle('');
      setContent('');
      setSource('');
      setMessage({ type: 'success', text: '✅ Document uploaded successfully!' });
    } else {
      setMessage({ type: 'error', text: '❌ Failed to upload document' });
    }
    setUploading(false);
  };

  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one file' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });
      if (fileSource.trim()) {
        formData.append('source', fileSource);
      }

      const response = await fetch('/api/admin/rag-documents/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ type: 'error', text: `❌ Upload failed: ${data.error?.message || data.message || 'Unknown error'}` });
        return;
      }

      if (data.uploaded > 0) {
        setSelectedFiles([]);
        setFileSource('');
        setMessage({
          type: 'success',
          text: `✅ Successfully uploaded ${data.uploaded}/${data.total} file(s)`,
        });
      } else {
        setMessage({ type: 'error', text: `❌ Failed to upload any files` });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed';
      setMessage({ type: 'error', text: `❌ ${errorMsg}` });
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="text-center text-gray-600">Loading documents...</div>;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800">RAG Document Management</h3>

      {/* Upload Form */}
      <div className="bg-indigo-50 rounded-lg p-6 border border-indigo-200 space-y-4">
        <div className="flex gap-2 border-b border-indigo-200">
          <button
            onClick={() => setTab('text')}
            className={`px-4 py-2 font-semibold transition ${
              tab === 'text'
                ? 'text-indigo-700 border-b-2 border-indigo-700'
                : 'text-gray-600 hover:text-indigo-600'
            }`}
          >
            📝 Paste Text
          </button>
          <button
            onClick={() => setTab('files')}
            className={`px-4 py-2 font-semibold transition ${
              tab === 'files'
                ? 'text-indigo-700 border-b-2 border-indigo-700'
                : 'text-gray-600 hover:text-indigo-600'
            }`}
          >
            📁 Upload Files
          </button>
        </div>

        {message && (
          <div
            className={`p-3 rounded ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800 border border-green-300'
                : 'bg-red-100 text-red-800 border border-red-300'
            }`}
          >
            {message.text}
          </div>
        )}

        {tab === 'text' ? (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g., Traffic Safety Guidelines..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={uploading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Source (optional)</label>
              <input
                type="text"
                value={source}
                onChange={e => setSource(e.target.value)}
                placeholder="e.g., Israeli Driving School Manual..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={uploading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Content *</label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Paste your document content here..."
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                disabled={uploading}
              />
              <p className="text-xs text-gray-600 mt-1">{content.length} characters</p>
            </div>

            <button
              onClick={handleUpload}
              disabled={uploading || !title.trim() || !content.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-semibold transition w-full"
            >
              {uploading ? '⏳ Uploading...' : '📤 Upload Document'}
            </button>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Files * (PDF, DOCX, TXT)
              </label>
              <input
                type="file"
                multiple
                accept=".pdf,.docx,.txt"
                onChange={e => setSelectedFiles(Array.from(e.target.files || []))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={uploading}
              />
              <p className="text-xs text-gray-600 mt-2">
                📊 {selectedFiles.length} file(s) selected (max 50MB per file)
              </p>
              {selectedFiles.length > 0 && (
                <div className="mt-2 space-y-1">
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} className="text-xs text-gray-600 flex justify-between">
                      <span>📄 {file.name}</span>
                      <span>{(file.size / 1024 / 1024).toFixed(2)}MB</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Source Label (optional)
              </label>
              <input
                type="text"
                value={fileSource}
                onChange={e => setFileSource(e.target.value)}
                placeholder="e.g., Driver's Manual Chapter 3..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={uploading}
              />
            </div>

            <button
              onClick={handleFileUpload}
              disabled={uploading || selectedFiles.length === 0}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-semibold transition w-full"
            >
              {uploading ? '⏳ Uploading...' : '📤 Upload Files'}
            </button>
          </>
        )}
      </div>

      {/* Documents List */}
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold text-gray-800 mb-4">Uploaded Documents ({documents.length})</h4>
          {error && <div className="text-red-600 mb-4">Error: {error}</div>}
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg text-gray-500">
            <p className="text-lg">📚 No documents uploaded yet</p>
            <p className="text-sm">Upload your first RAG document above</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {documents.map(doc => (
              <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h5 className="font-semibold text-gray-800">{doc.title}</h5>
                    {doc.source && <p className="text-xs text-gray-600">Source: {doc.source}</p>}
                  </div>
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                    {doc.embedding ? '✓ Embedded' : 'Pending'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{doc.content}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Created: {new Date(doc.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
