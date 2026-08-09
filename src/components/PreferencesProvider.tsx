'use client';

import { useEffect, useState, useCallback } from 'react';
import { PreferencesContext, UserPreferences } from '@/lib/PreferencesContext';

interface PreferencesProviderProps {
  children: React.ReactNode;
}

export default function PreferencesProvider({ children }: PreferencesProviderProps) {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPreferences = useCallback(async () => {
    try {
      const response = await fetch('/api/user/preferences', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
        applyPreferencesToDOM(data);
      }
    } catch (err) {
      console.error('Failed to load preferences:', err);
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
      applyPreferencesToDOM(data.preferences);
      return true;
    } catch (err) {
      console.error('Failed to update preferences:', err);
      return false;
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  useEffect(() => {
    if (preferences) {
      applyPreferencesToDOM(preferences);
    }
  }, [preferences?.theme, preferences?.compact_mode, preferences?.high_contrast]);

  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        loading,
        updatePreferences,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

function applyPreferencesToDOM(prefs: UserPreferences) {
  if (typeof window === 'undefined') return;

  const html = document.documentElement;

  // Apply theme
  if (prefs.theme === 'dark') {
    html.classList.add('dark');
  } else if (prefs.theme === 'light') {
    html.classList.remove('dark');
  } else {
    // Auto - respect system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }

  // Apply language
  html.lang = prefs.language;
  if (prefs.language === 'he') {
    html.dir = 'rtl';
  } else {
    html.dir = 'ltr';
  }

  // Apply compact mode
  if (prefs.compact_mode) {
    html.classList.add('compact-mode');
  } else {
    html.classList.remove('compact-mode');
  }

  // Apply high contrast
  if (prefs.high_contrast) {
    html.classList.add('high-contrast');
  } else {
    html.classList.remove('high-contrast');
  }

  // Store preferences in sessionStorage for quick access
  sessionStorage.setItem('userPreferences', JSON.stringify(prefs));
}
