'use client';

import { useState, useEffect } from 'react';

interface UserPreferences {
  user_id: string;
  theme: 'light' | 'dark' | 'auto';
  language: 'he' | 'en';
  show_answers: boolean;
  notification_email: boolean;
  show_onboarding: boolean;
  compact_mode: boolean;
  high_contrast: boolean;
  created_at: string;
  updated_at: string;
}

export default function PreferencesSettings() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/preferences', {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to load preferences');

      const data = await response.json();
      setPreferences(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load preferences';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (updates: Partial<UserPreferences>) => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message ?? 'Failed to save preferences');
      }

      // Update local state immediately with the new values
      if (preferences) {
        setPreferences({
          ...preferences,
          ...updates,
          updated_at: new Date().toISOString(),
        });
      }

      setSuccess('✅ Preferences saved!');

      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save preferences';
      setError(message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'auto') => {
    handleSave({ theme });
  };

  const handleLanguageChange = (language: 'he' | 'en') => {
    handleSave({ language });
  };

  const handleToggle = (key: keyof UserPreferences, value: boolean) => {
    const updates = { [key]: value };
    setPreferences(prev => prev ? { ...prev, [key]: value } : null);
    handleSave(updates);
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-600">Loading preferences...</div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-600">Failed to load preferences</div>
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

      {/* Display Settings */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4">🎨 Display Settings</h3>

        <div className="space-y-4">
          {/* Theme Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Theme</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'light', label: '☀️ Light', description: 'Light background' },
                { value: 'dark', label: '🌙 Dark', description: 'Dark background' },
                { value: 'auto', label: '🔄 Auto', description: 'System setting' },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => handleThemeChange(option.value as any)}
                  className={`p-3 rounded-lg text-center transition ${
                    preferences.theme === option.value
                      ? 'bg-indigo-600 text-white border-2 border-indigo-700'
                      : 'bg-gray-50 text-gray-800 border-2 border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  <div className="font-semibold">{option.label}</div>
                  <div className="text-xs mt-1 opacity-75">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Language Selection */}
          <div className="pt-4 border-t border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Language</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'he', label: '🇮🇱 Hebrew', description: 'עברית' },
                { value: 'en', label: '🇬🇧 English', description: 'English' },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => handleLanguageChange(option.value as any)}
                  className={`p-3 rounded-lg text-center transition ${
                    preferences.language === option.value
                      ? 'bg-indigo-600 text-white border-2 border-indigo-700'
                      : 'bg-gray-50 text-gray-800 border-2 border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  <div className="font-semibold">{option.label}</div>
                  <div className="text-xs mt-1 opacity-75">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Compact Mode */}
          <div className="pt-4 border-t border-gray-200">
            <label className={`flex items-center gap-3 ${saving ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
              <input
                type="checkbox"
                checked={preferences.compact_mode}
                onChange={e => handleToggle('compact_mode', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
                disabled={saving}
              />
              <span className="font-semibold text-gray-700">💬 Compact Mode</span>
            </label>
            <p className="text-xs text-gray-600 mt-1">Reduce spacing and make content more dense</p>
          </div>

          {/* High Contrast */}
          <div>
            <label className={`flex items-center gap-3 ${saving ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
              <input
                type="checkbox"
                checked={preferences.high_contrast}
                onChange={e => handleToggle('high_contrast', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
                disabled={saving}
              />
              <span className="font-semibold text-gray-700">♿ High Contrast</span>
            </label>
            <p className="text-xs text-gray-600 mt-1">Increase color contrast for better visibility</p>
          </div>
        </div>
      </div>

      {/* Content Settings */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4">📖 Content Settings</h3>

        <div className="space-y-4">
          {/* Show Answers */}
          <div>
            <label className={`flex items-center gap-3 ${saving ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
              <input
                type="checkbox"
                checked={preferences.show_answers}
                onChange={e => handleToggle('show_answers', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
                disabled={saving}
              />
              <span className="font-semibold text-gray-700">👁️ Show Answers by Default</span>
            </label>
            <p className="text-xs text-gray-600 mt-1">Display correct answers after submitting</p>
          </div>

          {/* Show Onboarding */}
          <div>
            <label className={`flex items-center gap-3 ${saving ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
              <input
                type="checkbox"
                checked={preferences.show_onboarding}
                onChange={e => handleToggle('show_onboarding', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
                disabled={saving}
              />
              <span className="font-semibold text-gray-700">🎓 Show Help Tips</span>
            </label>
            <p className="text-xs text-gray-600 mt-1">Display guidance and tips when using features</p>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4">🔔 Notifications</h3>

        <div className="space-y-4">
          {/* Email Notifications */}
          <div>
            <label className={`flex items-center gap-3 ${saving ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
              <input
                type="checkbox"
                checked={preferences.notification_email}
                onChange={e => handleToggle('notification_email', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
                disabled={saving}
              />
              <span className="font-semibold text-gray-700">📧 Email Notifications</span>
            </label>
            <p className="text-xs text-gray-600 mt-1">Receive emails about important updates</p>
          </div>
        </div>
      </div>

      {/* Last Updated */}
      {preferences.updated_at && (
        <div className="text-xs text-gray-500 text-center">
          Last updated: {new Date(preferences.updated_at).toLocaleString()}
        </div>
      )}
    </div>
  );
}
