'use client';

import { useEffect, useState, useRef } from 'react';
import { DebugKitProvider, DebugPanel } from 'devkit-console-ui';
import { initDebugManager } from '@/lib/devkitConsole';

interface ServerLog {
  id: string;
  level: string;
  source: string;
  message: string;
  context?: Record<string, any>;
  created_at: string;
}

export default function DevkitConsolePanel() {
  const [manager, setManager] = useState<any>(null);
  const [serverLogs, setServerLogs] = useState<ServerLog[]>([]);
  const [loading, setLoading] = useState(false);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const debugManager = initDebugManager();
    setManager(debugManager);

    if (debugManager) {
      console.log('[DevKit] Console initialized and ready');
    }
  }, []);

  const fetchServerLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/logs?limit=50', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setServerLogs(data.logs || []);
      }
    } catch (err) {
      console.error('[DevKit] Failed to fetch server logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServerLogs();
    refreshIntervalRef.current = setInterval(fetchServerLogs, 3000);

    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
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
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Live Debugging Console</h3>
          <p className="text-sm text-gray-600">
            Real-time client-side debugging + server logs ({serverLogs.length} recent entries)
          </p>
        </div>
        <button
          onClick={fetchServerLogs}
          disabled={loading}
          className="px-3 py-2 bg-indigo-500 text-white rounded text-sm hover:bg-indigo-600 disabled:opacity-50 font-semibold"
        >
          🔄 Sync
        </button>
      </div>

      {serverLogs.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 space-y-2 max-h-[200px] overflow-y-auto">
          <p className="text-sm font-semibold text-amber-900">📡 Recent Server Logs:</p>
          {serverLogs.slice(0, 10).map(log => (
            <div key={log.id} className="text-xs text-amber-800 font-mono">
              <span className="font-bold">[{log.level.toUpperCase()}]</span>
              <span className="text-amber-700"> {log.source}:</span> {log.message}
            </div>
          ))}
        </div>
      )}

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
