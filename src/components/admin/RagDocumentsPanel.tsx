/* eslint-disable no-console */
'use client';

import { useState } from 'react';
import { useAdminRagDocuments } from '@/hooks/useAdminRagDocuments';
import { uploadLargeFile } from '@/lib/chunkedFileUpload';

interface DocumentInfo {
  id: string;
  title: string;
  source: string;
  content: string;
}

export default function RagDocumentsPanel() {
  const { documents, loading, error, uploadDocument, refetch } = useAdminRagDocuments();
  const [tab, setTab] = useState<'text' | 'files'>('text');
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [source, setSource] = useState('');
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editing, setEditing] = useState<DocumentInfo | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileSource, setFileSource] = useState('');
  const [uploadProgress, setUploadProgress] = useState<{ file: string; progress: number } | null>(null);

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
    console.log(`[RAG-PANEL] handleFileUpload called, selectedFiles.length = ${selectedFiles.length}`);

    if (selectedFiles.length === 0) {
      console.warn('[RAG-PANEL] No files selected');
      setMessage({ type: 'error', text: 'Please select at least one file' });
      return;
    }

    setUploading(true);
    setMessage(null);
    setUploadProgress(null);

    try {
      let totalUploaded = 0;

      for (const file of selectedFiles) {
        console.log(`[RAG-PANEL] Starting upload for ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
        setUploadProgress({ file: file.name, progress: 0 });

        const result = await uploadLargeFile(file, {
          source: fileSource || undefined,
          onProgress: (event) => {
            if (event.type === 'progress' && event.progress !== undefined) {
              console.log(`[RAG-PANEL] Progress for ${file.name}: ${event.progress}%`);
              setUploadProgress({ file: file.name, progress: event.progress });
            } else if (event.type === 'error') {
              console.error(`[RAG-PANEL] Upload error for ${file.name}:`, event.error);
            } else if (event.type === 'complete') {
              console.log(`[RAG-PANEL] Upload complete for ${file.name}`);
            }
          },
        });

        console.log(`[RAG-PANEL] Upload result for ${file.name}:`, result);

        if (result.success) {
          totalUploaded++;
          console.log(`[RAG-PANEL] ✅ Successfully uploaded: ${file.name}`);
        } else {
          console.error(`[RAG-PANEL] ❌ Failed to upload ${file.name}: ${result.error}`);
          if (result.error?.includes('already uploaded')) {
            setMessage({
              type: 'error',
              text: `📋 ${file.name}: This file is already in the database. Skipping duplicate upload.`,
            });
          } else if (result.error?.includes('PDF')) {
            setMessage({
              type: 'error',
              text: `📄 ${file.name}: PDF format not supported.\n\n${result.error}`,
            });
          } else {
            setMessage({ type: 'error', text: `⚠️ ${file.name}: ${result.error}` });
          }
        }
      }

      setUploadProgress(null);

      if (totalUploaded > 0) {
        console.log(`[RAG-PANEL] ✅ Upload successful: ${totalUploaded}/${selectedFiles.length} files`);
        setSelectedFiles([]);
        setFileSource('');
        setMessage({
          type: 'success',
          text: `✅ Successfully uploaded ${totalUploaded}/${selectedFiles.length} file(s)`,
        });
        await refetch();
      } else {
        console.error('[RAG-PANEL] ❌ All uploads failed');
        setMessage({ type: 'error', text: `❌ Failed to upload all files` });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed';
      console.error(`[RAG-PANEL] Exception during upload:`, err);
      setMessage({ type: 'error', text: `❌ ${errorMsg}` });
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const handleDelete = async (docId: string, docTitle: string) => {
    if (!confirm(`Delete document "${docTitle}"? This cannot be undone.`)) {
      return;
    }

    setDeleting(docId);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/rag-documents/${docId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ type: 'error', text: `❌ Delete failed: ${data.error?.message || 'Unknown error'}` });
        return;
      }

      setMessage({ type: 'success', text: `✅ Document deleted successfully` });
      await refetch();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Delete failed';
      setMessage({ type: 'error', text: `❌ ${errorMsg}` });
    } finally {
      setDeleting(null);
    }
  };

  const handleEditStart = (doc: any) => {
    setEditing({
      id: doc.id,
      title: doc.title,
      source: doc.source,
      content: doc.content,
    });
    setMessage(null);
  };

  const handleEditSave = async () => {
    if (!editing) return;

    setUploading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/rag-documents/${editing.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editing.title,
          source: editing.source,
          content: editing.content,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ type: 'error', text: `❌ Update failed: ${data.error?.message || 'Unknown error'}` });
        return;
      }

      setMessage({ type: 'success', text: `✅ Document updated successfully` });
      setEditing(null);
      await refetch();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Update failed';
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
      <div className="bg-indigo-50 dark:bg-gray-800 rounded-lg p-6 border border-indigo-200 dark:border-gray-700 space-y-4">
        <div className="flex gap-2 border-b border-indigo-200 dark:border-gray-700">
          <button
            onClick={() => setTab('text')}
            className={`px-4 py-2 font-semibold transition ${
              tab === 'text'
                ? 'text-indigo-700 dark:text-indigo-400 border-b-2 border-indigo-700 dark:border-indigo-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'
            }`}
          >
            📝 Paste Text
          </button>
          <button
            onClick={() => setTab('files')}
            className={`px-4 py-2 font-semibold transition ${
              tab === 'files'
                ? 'text-indigo-700 dark:text-indigo-400 border-b-2 border-indigo-700 dark:border-indigo-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'
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
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-300 mb-2">Title *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g., Traffic Safety Guidelines..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={uploading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-300 mb-2">Source (optional)</label>
              <input
                type="text"
                value={source}
                onChange={e => setSource(e.target.value)}
                placeholder="e.g., Israeli Driving School Manual..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={uploading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-300 mb-2">Content *</label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Paste your document content here..."
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                disabled={uploading}
              />
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{content.length} characters</p>
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
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-300 mb-2">
                Select Files * (PDF, DOCX, TXT)
              </label>
              <input
                type="file"
                multiple
                accept=".pdf,.docx,.txt"
                onChange={e => {
                  const files = Array.from(e.target.files || []);
                  console.log(`[RAG-PANEL] File input changed: ${files.length} file(s) selected`);
                  files.forEach((f, i) => console.log(`  [${i}] ${f.name} (${(f.size / 1024 / 1024).toFixed(2)}MB)`));
                  setSelectedFiles(files);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={uploading}
              />
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                📊 {selectedFiles.length} file(s) selected (max 50MB per file)
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                💡 If PDF upload fails: Try re-exporting as PDF/A format or convert using an online tool
              </p>
              {selectedFiles.length > 0 && (
                <div className="mt-2 space-y-1">
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} className="text-xs text-gray-600 dark:text-gray-400 flex justify-between">
                      <span>📄 {file.name}</span>
                      <span>{(file.size / 1024 / 1024).toFixed(2)}MB</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-300 mb-2">
                Source Label (optional)
              </label>
              <input
                type="text"
                value={fileSource}
                onChange={e => setFileSource(e.target.value)}
                placeholder="e.g., Driver's Manual Chapter 3..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={uploading}
              />
            </div>

            {uploadProgress && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold text-blue-700">📤 {uploadProgress.file}</span>
                  <span className="text-sm font-semibold text-blue-700">{uploadProgress.progress}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress.progress}%` }}
                  />
                </div>
              </div>
            )}

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
                  <div className="flex gap-2 items-center">
                    <span className={`text-xs px-2 py-1 rounded font-semibold ${
                      (doc as any).metadata?.embedding_status === 'complete' || doc.embedding
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {(doc as any).metadata?.embedding_status === 'complete' || doc.embedding ? '✅ Complete' : '⏳ Pending'}
                    </span>
                    <button
                      onClick={() => handleEditStart(doc)}
                      disabled={uploading || deleting === doc.id}
                      className="text-xs px-2 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded disabled:opacity-50 transition"
                      title="Edit document"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id, doc.title)}
                      disabled={uploading || deleting === doc.id}
                      className="text-xs px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded disabled:opacity-50 transition"
                      title="Delete document"
                    >
                      {deleting === doc.id ? '⏳' : '🗑️'}
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{doc.content}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Created: {doc.created_at ? new Date(doc.created_at.replace(' ', 'T') + 'Z').toLocaleDateString() : 'Unknown Date'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-xl font-bold mb-4">✏️ Edit Document</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={editing.title}
                  onChange={e => setEditing({ ...editing, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={uploading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Source</label>
                <input
                  type="text"
                  value={editing.source}
                  onChange={e => setEditing({ ...editing, source: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={uploading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Content ({editing.content.length} characters)
                </label>
                <textarea
                  value={editing.content}
                  onChange={e => setEditing({ ...editing, content: e.target.value })}
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  disabled={uploading}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setEditing(null)}
                  disabled={uploading}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 disabled:opacity-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSave}
                  disabled={uploading || !editing.title.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-semibold"
                >
                  {uploading ? '⏳ Saving...' : '💾 Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
