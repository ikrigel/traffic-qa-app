import { useEffect, useState } from 'react';

interface AppSettings {
  favicon_url?: string;
  app_theme_color?: string;
}

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings');
        const data = await res.json();
        if (data.success) {
          setSettings(data.settings);
          // Update favicon in DOM
          if (data.settings.favicon_url) {
            const link = document.querySelector("link[rel='icon']") as HTMLLinkElement;
            if (link) link.href = data.settings.favicon_url;
            const apple = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
            if (apple) apple.href = data.settings.favicon_url;
          }
        }
      } catch (error) {
        console.error('Failed to fetch app settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return { settings, loading };
}
