'use client';

import { useEffect, useState } from 'react';

interface ServerError {
  message: string;
  type: 'gemini' | 'supabase' | 'database' | 'unknown';
}

export default function ServerErrorBanner() {
  const [error, setError] = useState<ServerError | null>(null);

  useEffect(() => {
    // Check if there's an error in URL params
    const params = new URLSearchParams(window.location.search);
    const errorType = params.get('error');

    if (errorType === 'gemini') {
      setError({
        message: 'Gemini API key is not configured',
        type: 'gemini',
      });
    } else if (errorType === 'supabase') {
      setError({
        message: 'Database configuration is incomplete',
        type: 'supabase',
      });
    }
  }, []);

  if (!error) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-50 border-b-2 border-red-400 p-4 shadow-lg z-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex gap-3 items-start flex-1">
            <div className="text-2xl mt-1">⚠️</div>
            <div className="flex-1">
              <h3 className="font-bold text-red-800 text-lg">
                Setup Required
              </h3>
              <p className="text-red-700 mt-1">
                {error.message}. Follow the setup guide to configure your app.
              </p>
            </div>
          </div>

          <a
            href="/setup"
            className="flex-shrink-0 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition whitespace-nowrap"
          >
            Go to Setup →
          </a>
        </div>
      </div>
    </div>
  );
}
