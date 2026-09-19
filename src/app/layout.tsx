import type { Metadata } from 'next';
import Script from 'next/script';
import '../styles/globals.css';
import PreferencesProvider from '@/components/PreferencesProvider';
import ConsoleInitializer from '@/components/ConsoleInitializer';

export const metadata: Metadata = {
  title: 'Driving Instructors Course - קורס מורי נהיגה',
  description: 'קורס מורי נהיגה - הכנה ולמידה לקורסים השונים בקורס מורי נהיגה',
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
        <Script src="/theme-loader.js" strategy="beforeInteractive" />
        <Script id="favicon-loader" strategy="afterInteractive">
          {`
            (async () => {
              try {
                const cached = localStorage.getItem('app_favicon_url');
                if (cached) {
                  const link = document.querySelector("link[rel='icon']");
                  const apple = document.querySelector("link[rel='apple-touch-icon']");
                  if (link) link.href = cached;
                  if (apple) apple.href = cached;
                }
                const res = await fetch('/api/admin/settings');
                const data = await res.json();
                if (data.success && data.settings.favicon_url) {
                  const url = data.settings.favicon_url;
                  localStorage.setItem('app_favicon_url', url);
                  const link = document.querySelector("link[rel='icon']");
                  const apple = document.querySelector("link[rel='apple-touch-icon']");
                  if (link) link.href = url;
                  if (apple) apple.href = url;
                }
              } catch (e) {
                console.log('Favicon load skipped');
              }
            })();
          `}
        </Script>
      </head>
      <body className="bg-white dark:bg-gray-900">
        <ConsoleInitializer />
        <PreferencesProvider>{children}</PreferencesProvider>
      </body>
    </html>
  );
}
