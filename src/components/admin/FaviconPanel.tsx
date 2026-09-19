'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function FaviconPanel() {
  const [faviconUrl, setFaviconUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data.success) {
        setFaviconUrl(data.settings.favicon_url || '');
        setPreviewUrl(data.settings.favicon_url || '');
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      setMessage('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setFaviconUrl(dataUrl);
      setPreviewUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFaviconUrl(url);
    setPreviewUrl(url);
  };

  const handleSave = async () => {
    if (!faviconUrl) {
      setMessage('Please select a favicon or enter a URL');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'favicon_url', value: faviconUrl }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage('✅ Favicon updated successfully');
        updateFaviconInDOM(faviconUrl);
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(`❌ ${data.error || 'Failed to update'}`);
      }
    } catch (error) {
      console.error('Save error:', error);
      setMessage('❌ Failed to save favicon');
    } finally {
      setSaving(false);
    }
  };

  const updateFaviconInDOM = (url: string) => {
    const link = document.querySelector("link[rel='icon']") as HTMLLinkElement;
    if (link) link.href = url;
    const apple = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
    if (apple) apple.href = url;
  };

  const handleReset = () => {
    const defaultUrl = '/favicon.svg';
    setFaviconUrl(defaultUrl);
    setPreviewUrl(defaultUrl);
  };

  if (loading) {
    return <div className="text-center text-gray-600">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800">🎨 App Favicon</h3>

      <div className="space-y-4">
        {/* Current Favicon Preview */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-3">Current Favicon Preview</p>
          <div className="flex items-center gap-4">
            {previewUrl && (
              <div className="w-16 h-16 bg-white rounded border border-gray-300 flex items-center justify-center overflow-hidden relative">
                {previewUrl.startsWith('data:') ? (
                  <Image src={previewUrl} alt="favicon preview" fill className="object-cover" />
                ) : previewUrl.endsWith('.svg') ? (
                  <Image src={previewUrl} alt="favicon preview" width={32} height={32} className="w-8 h-8" />
                ) : (
                  <Image src={previewUrl} alt="favicon preview" fill className="object-cover" />
                )}
              </div>
            )}
            <div className="flex-1 text-xs text-gray-600 break-all max-h-16 overflow-y-auto">
              {previewUrl}
            </div>
          </div>
        </div>

        {/* Upload Option */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm font-medium text-gray-700 mb-3">Upload Image</p>
          <input
            type="file"
            accept="image/svg+xml,image/png,image/jpeg,image/x-icon"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-600 border border-gray-300 rounded-lg p-2 bg-white hover:border-blue-400 cursor-pointer"
          />
          <p className="text-xs text-gray-500 mt-2">
            Accepts: SVG, PNG, JPEG, ICO (recommended: 512x512px or vector SVG)
          </p>
        </div>

        {/* URL Option */}
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm font-medium text-gray-700 mb-3">Or Paste URL</p>
          <input
            type="text"
            value={faviconUrl}
            onChange={handleUrlChange}
            placeholder="https://example.com/favicon.svg or /favicon.svg"
            className="w-full px-3 py-2 border border-green-300 rounded-lg text-sm focus:outline-none focus:border-green-500"
          />
        </div>

        {/* Status Message */}
        {message && (
          <div
            className={`p-3 rounded-lg text-sm ${
              message.startsWith('✅')
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {saving ? 'Saving...' : '💾 Save Favicon'}
          </button>
          <button
            onClick={handleReset}
            className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-lg font-semibold hover:bg-gray-500 transition"
          >
            🔄 Reset
          </button>
        </div>

        {/* Info */}
        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 text-xs text-yellow-800">
          <strong>💡 Tip:</strong> Upload an SVG for best results (scalable and small file size).
          The favicon updates across all browser tabs after saving.
        </div>
      </div>
    </div>
  );
}
