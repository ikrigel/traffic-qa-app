/* eslint-disable no-console */
'use client';

import { useEffect } from 'react';
import '@/lib/consoleInterceptor';

export default function ConsoleInitializer() {
  useEffect(() => {
    console.log('[🔧 Console] Interceptor initialized - all console calls will be captured');
  }, []);

  return null;
}
