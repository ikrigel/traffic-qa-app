import type { Metadata } from 'next';
import '../styles/globals.css';
import PreferencesProvider from '@/components/PreferencesProvider';

export const metadata: Metadata = {
  title: 'Traffic Laws Q&A',
  description: 'Study Israeli traffic laws for your driving exam',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        <meta name="theme-color" content="#0ea5e9" />
        <script dangerouslySetInnerHTML={{__html: `
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
            } catch (e) {}
          })();
        `}} />
      </head>
      <body className="bg-gray-50">
        <PreferencesProvider>{children}</PreferencesProvider>
      </body>
    </html>
  );
}
