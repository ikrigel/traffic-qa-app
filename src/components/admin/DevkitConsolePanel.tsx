'use client';

import { useEffect, useState } from 'react';
import { DebugKitProvider, DebugPanel } from 'devkit-console-ui';
import { initDebugManager, getDebugManagerInstance } from '@/lib/devkitConsole';

export default function DevkitConsolePanel() {
  const [manager, setManager] = useState<any>(null);

  useEffect(() => {
    const debugManager = initDebugManager();
    setManager(debugManager);
  }, []);

  if (!manager) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Live Debugging Console</h3>
        <p className="text-gray-600">Initializing debug console...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Live Debugging Console</h3>
      <p className="text-gray-600">
        Real-time client-side debugging with log history, level filtering, and export functionality.
      </p>
      <DebugKitProvider manager={manager}>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <DebugPanel
            position="bottom-right"
            defaultOpen={true}
            showLogViewer={true}
            showExport={true}
            showNamespaces={true}
            showVersion={true}
            maxVisibleLogs={100}
            theme="light"
            className="w-full"
          />
        </div>
      </DebugKitProvider>
    </div>
  );
}
