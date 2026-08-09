'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AIProvider, APIKey } from '@/types';

export default function UserSettings() {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('groq');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [operatingKeyId, setOperatingKeyId] = useState<string | null>(null);

  const providers: { id: AIProvider; name: string; free: boolean; speed: string }[] = [
    { id: 'groq', name: '⚡ Groq (Fastest, Free)', free: true, speed: '⭐⭐⭐⭐⭐' },
    { id: 'gemini', name: '🔮 Google Gemini (Good, Free)', free: true, speed: '⭐⭐⭐' },
    { id: 'ollama', name: '🏠 Ollama (Local, Free)', free: true, speed: '⭐⭐⭐' },
    { id: 'openai', name: '🤖 OpenAI ChatGPT', free: false, speed: '⭐⭐⭐⭐' },
    { id: 'huggingface', name: '🤗 HuggingFace', free: true, speed: '⭐⭐' },
  ];

  // Load API keys on mount
  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = useCallback(async () => {
    try {
      const response = await fetch('/api/user/keys', {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to load API keys');

      const data = await response.json();
      setApiKeys(data.keys || []);
      setLoading(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load API keys';
      setError(message);
      setLoading(false);
    }
  }, []);

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!apiKeyInput.trim()) {
      setError('Please enter an API key');
      return;
    }

    try {
      setAdding(true);
      const response = await fetch('/api/user/keys', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey: apiKeyInput,
          displayName: displayName || `${selectedProvider} key`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message ?? errorData.error ?? 'Failed to add API key');
      }

      setSuccess('✅ API key added successfully!');
      setApiKeyInput('');
      setDisplayName('');

      // Update local state immediately without full refetch
      const data = await response.json();
      setApiKeys(prev => [...prev, data.key || { provider: selectedProvider }]);

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add API key';
      setError(message);
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return;

    try {
      setOperatingKeyId(keyId);
      const response = await fetch(`/api/user/keys/${keyId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to delete API key');

      setSuccess('✅ API key deleted');
      // Update local state immediately
      setApiKeys(prev => prev.filter(k => k.id !== keyId));

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete API key';
      setError(message);
    } finally {
      setOperatingKeyId(null);
    }
  };

  const handleSetDefault = async (keyId: string) => {
    try {
      setOperatingKeyId(keyId);
      const response = await fetch(`/api/user/keys/${keyId}`, {
        method: 'PATCH',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to set default key');

      setSuccess('✅ Default key updated');
      // Update local state immediately
      setApiKeys(prev => prev.map(k => ({
        ...k,
        isDefault: k.id === keyId
      })));

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to set default key';
      setError(message);
    } finally {
      setOperatingKeyId(null);
    }
  };

  const handleTestKey = async (keyId: string) => {
    try {
      setError(null);
      setOperatingKeyId(keyId);
      const response = await fetch(`/api/user/keys/${keyId}/test`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to test key');
      }

      setSuccess('✅ Key is valid!');
      // Update local state with validation status
      setApiKeys(prev => prev.map(k => k.id === keyId ? { ...k, validationStatus: 'valid' } : k));

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to test key';
      setError(message);
    } finally {
      setOperatingKeyId(null);
    }
  };

  const handleSetPriority = async (keyId: string, priority: number) => {
    try {
      setOperatingKeyId(keyId);
      const response = await fetch(`/api/user/keys/${keyId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setPriority', priority }),
      });

      if (!response.ok) throw new Error('Failed to update priority');

      setSuccess('✅ Priority updated');
      // Update local state immediately
      setApiKeys(prev => prev.map(k => k.id === keyId ? { ...k, priority } : k));

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update priority';
      setError(message);
    } finally {
      setOperatingKeyId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-600">Loading API keys...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 font-semibold">❌ {error}</p>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 font-semibold">{success}</p>
        </div>
      )}

      {/* Add New Key Form */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4">➕ Add API Key</h3>

        <form onSubmit={handleAddKey} className="space-y-4">
          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Choose AI Provider
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {providers.map(provider => (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => setSelectedProvider(provider.id)}
                  className={`p-3 rounded-lg text-left transition ${
                    selectedProvider === provider.id
                      ? 'bg-indigo-600 text-white border-2 border-indigo-700'
                      : 'bg-gray-50 text-gray-800 border-2 border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  <div className="font-semibold">{provider.name}</div>
                  <div className="text-xs mt-1 opacity-75">
                    {provider.free ? '✅ Free tier' : '💰 Paid'} • Speed: {provider.speed}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Display Name (optional)
            </label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder={`e.g., My ${selectedProvider} key`}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* API Key Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              API Key
            </label>
            <input
              type="password"
              value={apiKeyInput}
              onChange={e => setApiKeyInput(e.target.value)}
              placeholder="Paste your API key here"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
            />
            <p className="text-xs text-gray-600 mt-2">
              🔒 Your key is encrypted and stored securely. Never shared or logged.
            </p>
          </div>

          {/* Help Text */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Need a key?</strong>
              {selectedProvider === 'groq' && (
                <>
                  {' '}
                  Visit{' '}
                  <a
                    href="https://console.groq.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    groq.com
                  </a>{' '}
                  (very fast, free tier)
                </>
              )}
              {selectedProvider === 'gemini' && (
                <>
                  {' '}
                  Visit{' '}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    Google AI Studio
                  </a>{' '}
                  (free tier available)
                </>
              )}
              {selectedProvider === 'ollama' && (
                <>
                  {' '}
                  Download{' '}
                  <a
                    href="https://ollama.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    Ollama
                  </a>{' '}
                  (local, completely free)
                </>
              )}
              {selectedProvider === 'openai' && (
                <>
                  {' '}
                  Visit{' '}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    OpenAI Platform
                  </a>{' '}
                  (paid, very capable)
                </>
              )}
              {selectedProvider === 'huggingface' && (
                <>
                  {' '}
                  Visit{' '}
                  <a
                    href="https://huggingface.co/settings/tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    HuggingFace
                  </a>{' '}
                  (free tier available)
                </>
              )}
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={adding || !apiKeyInput.trim()}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {adding ? '⏳ Adding...' : '➕ Add API Key'}
          </button>
        </form>
      </div>

      {/* Single Key Hint */}
      {apiKeys.length === 1 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-blue-800 text-sm">
            💡 <strong>Tip:</strong> Add a backup key from another provider so grading and chat keep working if this one hits a rate limit.
          </p>
        </div>
      )}

      {/* Existing Keys */}
      {apiKeys.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4">🔑 Your API Keys</h3>

          <div className="space-y-3">
            {apiKeys.map(key => (
              <div
                key={key.id}
                className={`p-4 rounded-lg border-2 ${
                  key.isDefault
                    ? 'bg-indigo-50 border-indigo-300'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-800">
                        {key.displayName || key.provider}
                      </h4>
                      {key.isDefault && (
                        <span className="px-2 py-1 bg-indigo-600 text-white text-xs rounded font-semibold">
                          Default
                        </span>
                      )}
                      {key.validationStatus === 'valid' && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded font-semibold">
                          ✅ Valid
                        </span>
                      )}
                      {key.validationStatus === 'invalid' && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded font-semibold">
                          ❌ Invalid
                        </span>
                      )}
                      {!key.validationStatus || key.validationStatus === 'unknown' && (
                        <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded font-semibold">
                          ⚪ Untested
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Provider: <span className="font-mono font-semibold">{key.provider}</span>
                    </p>
                    {key.lastValidatedAt && key.validationStatus === 'invalid' && key.lastValidationError && (
                      <p className="text-xs text-red-600 mt-1">
                        Error: {key.lastValidationError}
                      </p>
                    )}
                    {key.lastUsedAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        Last used: {new Date(key.lastUsedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap mb-3">
                  <button
                    onClick={() => handleTestKey(key.id)}
                    disabled={operatingKeyId !== null}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {operatingKeyId === key.id ? '⏳ Testing...' : '🧪 Test'}
                  </button>
                  {!key.isDefault && (
                    <button
                      onClick={() => handleSetDefault(key.id)}
                      disabled={operatingKeyId !== null}
                      className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded text-sm hover:bg-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {operatingKeyId === key.id ? '⏳ Setting...' : 'Set Default'}
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteKey(key.id)}
                    disabled={operatingKeyId !== null}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {operatingKeyId === key.id ? '⏳ Deleting...' : 'Delete'}
                  </button>
                </div>

                <div className="flex gap-2 items-center">
                  <label className="text-xs font-semibold text-gray-700">Priority:</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={key.priority || 5}
                    onChange={e => handleSetPriority(key.id, parseInt(e.target.value))}
                    disabled={operatingKeyId !== null}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="text-xs text-gray-600 w-6 text-right">{key.priority || 5}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {apiKeys.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800 font-semibold mb-2">⚠️ No API Keys Added</p>
          <p className="text-yellow-700 text-sm">
            Add an API key above to enable AI-powered answer grading and chat assistance.
          </p>
        </div>
      )}
    </div>
  );
}
