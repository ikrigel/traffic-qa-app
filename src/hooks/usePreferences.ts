'use client';

import { useContext } from 'react';
import { PreferencesContext } from '@/lib/PreferencesContext';

export const usePreferences = () => {
  const context = useContext(PreferencesContext);

  if (!context) {
    throw new Error('usePreferences must be used within PreferencesProvider');
  }

  return {
    preferences: context.preferences,
    loading: context.loading,
    updatePreferences: context.updatePreferences,
  };
};
