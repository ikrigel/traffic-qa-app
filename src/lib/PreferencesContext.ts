import { createContext, useContext } from 'react';

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

interface PreferencesContextType {
  preferences: UserPreferences | null;
  loading: boolean;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<boolean>;
}

export const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const usePreferencesContext = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferencesContext must be used within PreferencesProvider');
  }
  return context;
};
