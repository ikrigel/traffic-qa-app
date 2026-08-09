(function() {
  try {
    const prefs = localStorage.getItem('userPreferences');
    if (prefs) {
      const parsed = JSON.parse(prefs);
      if (parsed.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (parsed.theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else if (parsed.theme === 'auto') {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
        }
      }
    }
  } catch (e) {
    // Silently fail if localStorage is not available
  }
})();
