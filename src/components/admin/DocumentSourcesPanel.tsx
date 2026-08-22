'use client';

import { useState, useEffect } from 'react';

interface DocumentSource {
  id: string;
  name: string;
  source_type: 'url' | 'file' | 'text';
  source_url?: string;
  ingest_status: string;
  total_chunks: number;
  last_ingested_at?: string;
}

export default function DocumentSourcesPanel() {
  const [sources, setSources] = useState<DocumentSource[]>([]);
  const [sourceType, setSourceType] = useState<'url' | 'text'>('url');
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [regulationsToVerify, setRegulationsToVerify] = useState('25,24,23,22,21');
  const [loading, setLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      const response = await fetch('/api/admin/document-sources', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setSources(data.sources || []);
      }
    } catch (err) {
      console.error('Fetch failed:', err);
    }
  };

  const handleAddSource = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (sourceType === 'url' && !url.trim()) {
      setError('URL is required');
      return;
    }

    if (sourceType === 'text' && !text.trim()) {
      setError('Text is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/document-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name,
          source_type: sourceType,
          source_url: sourceType === 'url' ? url : undefined,
          source_text: sourceType === 'text' ? text : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to add source');
        return;
      }

      setName('');
      setUrl('');
      setText('');
      setError('');
      await fetchSources();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add source');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    const regulations = regulationsToVerify
      .split(',')
      .map(s => parseInt(s.trim()))
      .filter(n => !isNaN(n));

    if (regulations.length === 0) {
      setError('Enter regulation numbers separated by commas');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/document-sources/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ regulations_to_verify: regulations }),
      });

      const data = await response.json();
      setVerifyResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}

      {/* Add Source */}
      <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 space-y-4">
        <h4 className="font-semibold text-blue-900">📄 Add Document Source</h4>

        <div className="space-y-3">
          <input
            type="text"
            placeholder="Source name (e.g., 'Traffic Regulations Part 1')"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={sourceType}
            onChange={e => setSourceType(e.target.value as 'url' | 'text')}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value="url">🌐 URL</option>
            <option value="text">📝 Paste Text</option>
          </select>

          {sourceType === 'url' ? (
            <input
              type="url"
              placeholder="https://example.com/regulations"
              value={url}
              onChange={e => setUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <textarea
              placeholder="Paste document text here... (Hebrew supported)"
              value={text}
              onChange={e => setText(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          )}

          <button
            onClick={handleAddSource}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 font-semibold"
          >
            {loading ? '⏳ Processing...' : '✅ Add Source & Ingest'}
          </button>
        </div>
      </div>

      {/* Verify Content */}
      <div className="bg-green-50 border border-green-300 rounded-lg p-4 space-y-3">
        <h4 className="font-semibold text-green-900">✓ Verify Content</h4>
        <p className="text-sm text-gray-600">
          Check if specific regulations were successfully ingested
        </p>
        <input
          type="text"
          placeholder="Regulation numbers (e.g., 25,24,23,22,21)"
          value={regulationsToVerify}
          onChange={e => setRegulationsToVerify(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
        />
        <button
          onClick={handleVerify}
          disabled={loading}
          className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 font-semibold"
        >
          {loading ? '⏳ Verifying...' : '🔍 Verify Regulations'}
        </button>

        {verifyResult && (
          <div className="mt-4 p-3 bg-white rounded border border-green-200">
            <p className="font-semibold text-gray-800 mb-3">{verifyResult.summary}</p>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {verifyResult.results.map((r: any) => (
                <div key={r.regulation} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="font-semibold">תקנה {r.regulation}</span>
                  <span className={r.found ? 'text-green-600' : 'text-red-600'}>
                    {r.found ? `✅ Found (${r.chunks} chunks)` : '❌ Not Found'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sources List */}
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-800">📚 Document Sources ({sources.length})</h4>
        {sources.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No sources added yet</p>
        ) : (
          sources.map(source => (
            <div key={source.id} className="bg-white border border-gray-300 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-gray-800">{source.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {source.source_type === 'url' ? '🌐' : '📝'} {source.source_type} •{' '}
                    {source.ingest_status === 'success' ? '✅' : '⚠️'} {source.ingest_status}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-700">📊 {source.total_chunks} chunks</p>
              {source.last_ingested_at && (
                <p className="text-xs text-gray-500 mt-2">
                  Last: {new Date(source.last_ingested_at).toLocaleString()}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
