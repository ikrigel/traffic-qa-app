// Theme loader: Apply dark mode from localStorage before React hydrates
(function() {
  try {
    // Try to get saved preferences
    const stored = localStorage.getItem('userPreferences');
    const html = document.documentElement;

    if (stored) {
      try {
        const prefs = JSON.parse(stored);

        // Apply theme
        if (prefs.theme === 'dark') {
          html.classList.add('dark');
        } else if (prefs.theme === 'light') {
          html.classList.remove('dark');
        } else if (prefs.theme === 'auto') {
          // Auto - respect system preference
          if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            html.classList.add('dark');
          }
        }

        // Apply language
        if (prefs.language === 'he') {
          html.dir = 'rtl';
        } else if (prefs.language === 'en') {
          html.dir = 'ltr';
        }
      } catch (parseError) {
        // If parsing fails, clean up and proceed without preferences
        localStorage.removeItem('userPreferences');
      }
    }
  } catch (e) {
    // Silently fail if localStorage is not available (e.g., private browsing)
  }
})();
