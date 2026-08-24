/* eslint-disable no-console */
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

const DEVKIT_SETTINGS_STORAGE_KEY = 'devkit_console_settings';

export default function DevkitConsolePanel() {
  const [manager, setManager] = useState<any>(null);
  const [serverLogs, setServerLogs] = useState<ServerLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [logFilter, setLogFilter] = useState<'all' | 'trace' | 'error' | 'none'>('all');
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DEVKIT_SETTINGS_STORAGE_KEY);
      if (saved) {
        const settings = JSON.parse(saved);
        if (typeof settings.autoSync === 'boolean') setAutoSync(settings.autoSync);
        if (settings.logFilter) setLogFilter(settings.logFilter);
      }
    } catch (err) {
      console.error('Failed to load DevKit settings:', err);
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      const settings = { autoSync, logFilter };
      localStorage.setItem(DEVKIT_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (err) {
      console.error('Failed to save DevKit settings:', err);
    }
  }, [autoSync, logFilter]);

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

      if (!response.ok) {
        console.error(`[DevKit] Logs fetch failed with status ${response.status}`);
        setServerLogs([]);
        return;
      }

      const data = await response.json();
      setServerLogs(data.logs || []);
    } catch (err) {
      console.error('[DevKit] Failed to fetch server logs:', err);
      setServerLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServerLogs();

    if (autoSync) {
      refreshIntervalRef.current = setInterval(fetchServerLogs, 2000);
    }

    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, [autoSync]);

  const filteredServerLogs = serverLogs.filter(log => {
    if (logFilter === 'none') return false;
    if (logFilter === 'trace') return log.level.toLowerCase() === 'trace';
    if (logFilter === 'error') return log.level.toLowerCase() === 'error';
    return true;
  });

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
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Live Debugging Console</h3>
          <p className="text-sm text-gray-600">
            Real-time client + server debugging ({filteredServerLogs.length} / {serverLogs.length} server logs)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setAutoSync(!autoSync)}
            className={`px-3 py-2 rounded text-sm font-semibold transition ${
              autoSync
                ? 'bg-green-500 text-white'
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
            }`}
          >
            {autoSync ? '🔄 Auto' : '⏸ Manual'}
          </button>
          <button
            onClick={fetchServerLogs}
            disabled={loading}
            className="px-3 py-2 bg-indigo-500 text-white rounded text-sm hover:bg-indigo-600 disabled:opacity-50 font-semibold"
          >
            🔄 Sync
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        {(['all', 'trace', 'error', 'none'] as const).map(filter => (
          <button
            key={filter}
            onClick={() => setLogFilter(filter)}
            className={`px-3 py-2 rounded text-sm font-semibold transition ${
              logFilter === filter
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {filter === 'all' ? '📊 All' : filter === 'trace' ? '📍 Trace' : filter === 'error' ? '❌ Error' : '🚫 None'}
          </button>
        ))}
      </div>

      {filteredServerLogs.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 space-y-2 max-h-[300px] overflow-y-auto">
          <p className="text-sm font-semibold text-amber-900">📡 Server Logs ({filteredServerLogs.length}):</p>
          {filteredServerLogs.slice(0, 20).map(log => (
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
