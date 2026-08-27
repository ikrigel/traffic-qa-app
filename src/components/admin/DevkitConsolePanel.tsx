/* eslint-disable no-console */
'use client';

import { useEffect, useState, useRef } from 'react';
import { consoleInterceptor, type LogLevel, type LogEntry } from '@/lib/consoleInterceptor';

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
  const [clientLogs, setClientLogs] = useState<LogEntry[]>([]);
  const [serverLogs, setServerLogs] = useState<ServerLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [logLevel, setLogLevel] = useState<LogLevel>('debug');
  const logsEndRef = useRef<HTMLDivElement>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DEVKIT_SETTINGS_STORAGE_KEY);
      if (saved) {
        const settings = JSON.parse(saved);
        if (typeof settings.autoSync === 'boolean') setAutoSync(settings.autoSync);
        if (settings.logLevel) setLogLevel(settings.logLevel);
      }
    } catch (err) {
      console.error('Failed to load DevKit settings:', err);
    }
  }, []);

  // Save settings to localStorage and update interceptor when level changes
  useEffect(() => {
    try {
      const settings = { autoSync, logLevel };
      localStorage.setItem(DEVKIT_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      consoleInterceptor.setLevel(logLevel);
    } catch (err) {
      console.error('Failed to save DevKit settings:', err);
    }
  }, [autoSync, logLevel]);

  // Subscribe to console interceptor
  useEffect(() => {
    const unsubscribe = consoleInterceptor.subscribe((entry: LogEntry) => {
      setClientLogs(prev => {
        const updated = [...prev, entry];
        return updated.slice(-1000);
      });
    });

    const initialLogs = consoleInterceptor.getLogs();
    setClientLogs(initialLogs);

    return () => unsubscribe();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [clientLogs]);

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

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case 'error': return 'bg-red-100 text-red-800 border-l-4 border-red-500';
      case 'warn': return 'bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500';
      case 'trace': return 'bg-purple-100 text-purple-800 border-l-4 border-purple-500';
      case 'network': return 'bg-blue-100 text-blue-800 border-l-4 border-blue-500';
      default: return 'bg-gray-100 text-gray-800 border-l-4 border-gray-500';
    }
  };

  const getLevelEmoji = (level: LogLevel) => {
    switch (level) {
      case 'error': return '❌';
      case 'warn': return '⚠️';
      case 'trace': return '📍';
      case 'network': return '🌐';
      case 'info': return 'ℹ️';
      default: return '🐛';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">🔧 Connected Console</h3>
          <p className="text-sm text-gray-600">Client logs: {clientLogs.length} | Server logs: {serverLogs.length}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
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
          <button
            onClick={() => {
              consoleInterceptor.clear();
              setClientLogs([]);
            }}
            className="px-3 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600 font-semibold"
          >
            🗑️ Clear
          </button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['trace', 'debug', 'info', 'warn', 'error', 'network'] as const).map(level => (
          <button
            key={level}
            onClick={() => setLogLevel(level)}
            className={`px-3 py-2 rounded text-sm font-semibold transition ${
              logLevel === level
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {level === 'trace' ? '📍 Trace' : level === 'debug' ? '🐛 Debug' : level === 'info' ? 'ℹ️ Info' : level === 'warn' ? '⚠️ Warn' : level === 'error' ? '❌ Error' : '🌐 Network'}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <div className="max-h-[500px] overflow-y-auto bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-1">
          {clientLogs.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p className="text-sm">No client logs yet. Logs will appear as you interact with the app.</p>
            </div>
          ) : (
            <>
              {clientLogs.map((log, idx) => (
                <div key={idx} className={`rounded px-3 py-2 text-sm ${getLevelColor(log.level)} font-mono break-words`}>
                  <div className="flex gap-2">
                    <span className="flex-shrink-0">{getLevelEmoji(log.level)}</span>
                    <span className="font-bold">[{log.level.toUpperCase()}]</span>
                    <span className="text-gray-600">{log.source}</span>
                    <span className="text-xs opacity-75 ml-auto flex-shrink-0">{log.timestamp.toLocaleTimeString()}</span>
                  </div>
                  <div className="ml-8">{log.message}</div>
                  {log.data && (
                    <details className="ml-8 text-xs mt-1">
                      <summary className="cursor-pointer opacity-75 hover:opacity-100">Details</summary>
                      <pre className="mt-1 p-2 bg-black/10 rounded text-xs overflow-x-auto">{JSON.stringify(log.data, null, 2)}</pre>
                    </details>
                  )}
                </div>
              ))}
              <div ref={logsEndRef} />
            </>
          )}
        </div>
      </div>

      {serverLogs.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 space-y-2 max-h-[300px] overflow-y-auto">
          <p className="text-sm font-semibold text-amber-900">📡 Server Logs ({serverLogs.length}):</p>
          {serverLogs.slice(0, 10).map(log => (
            <div key={log.id} className="text-xs text-amber-800 font-mono break-words">
              <span className="font-bold">[{log.level.toUpperCase()}]</span>
              <span className="text-amber-700"> {log.source}:</span> {log.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
