import type { Metadata } from 'next';
import Script from 'next/script';
import '../styles/globals.css';
import PreferencesProvider from '@/components/PreferencesProvider';
import ConsoleInitializer from '@/components/ConsoleInitializer';

export const metadata: Metadata = {
  title: 'Driving Instruction Hub - קורס למידה להוראת נהיגה',
  description: 'Interactive learning platform for driving instruction students in Israel',
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
      </head>
      <body className="bg-white dark:bg-gray-900">
        <ConsoleInitializer />
        <PreferencesProvider>{children}</PreferencesProvider>
      </body>
    </html>
  );
}
