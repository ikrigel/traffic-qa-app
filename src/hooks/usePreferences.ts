import { useState, useEffect, useCallback } from 'react';

export interface UserPreferences {
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

const DEFAULT_PREFERENCES: UserPreferences = {
  user_id: '',
  theme: 'auto',
  language: 'he',
  show_answers: false,
  notification_email: true,
  show_onboarding: true,
  compact_mode: false,
  high_contrast: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const usePreferences = () => {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = useCallback(async () => {
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
      setPreferences(DEFAULT_PREFERENCES);
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update preferences');

      const data = await response.json();
      setPreferences(data.preferences);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update preferences';
      setError(message);
      return false;
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return {
    preferences,
    loading,
    error,
    fetchPreferences,
    updatePreferences,
  };
};
