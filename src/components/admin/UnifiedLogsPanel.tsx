'use client';

import { useState, useEffect, useRef } from 'react';
import { useAdminLogs } from '@/hooks/useAdminLogs';
import { initDebugManager } from '@/lib/devkitConsole';

interface LogEntry {
  id: string;
  type: 'server' | 'client';
  level: 'info' | 'warn' | 'error';
  source: string;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
}

export default function UnifiedLogsPanel() {
  const [level, setLevel] = useState<'all' | 'info' | 'warn' | 'error'>('all');
  const [tab, setTab] = useState<'all' | 'server' | 'client'>('all');
  const [allLogs, setAllLogs] = useState<LogEntry[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { logs: serverLogs, loading, error, refetch } = useAdminLogs(level === 'all' ? 'all' : level);
  const debugManagerRef = useRef<any>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const manager = initDebugManager();
    debugManagerRef.current = manager;
  }, []);

  useEffect(() => {
    const combineLogs = () => {
      const combined: LogEntry[] = [];

      serverLogs.forEach(log => {
        combined.push({
          id: `server-${log.id}`,
          type: 'server',
          level: log.level,
          source: log.source,
          message: log.message,
          timestamp: log.created_at,
          context: log.context,
        });
      });

      if (debugManagerRef.current?.getRecords) {
        try {
          const clientLogs = debugManagerRef.current.getRecords?.();
          if (Array.isArray(clientLogs)) {
            clientLogs.forEach((log: any, idx: number) => {
              combined.push({
                id: `client-${idx}`,
                type: 'client',
                level: log.level?.toLowerCase?.() || 'info',
                source: log.namespace || 'app',
                message: log.message || String(log.data),
                timestamp: log.timestamp || new Date().toISOString(),
                context: log.data,
              });
            });
          }
        } catch (err) {
          console.error('Failed to get client logs:', err);
        }
      }

      combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setAllLogs(combined);
    };

    combineLogs();
  }, [serverLogs]);

  useEffect(() => {
    if (!autoRefresh) return;

    refreshIntervalRef.current = setInterval(() => {
      refetch();
    }, 2000);

    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, [autoRefresh, refetch]);

  const getLevelColor = (lvl: string) => {
    if (lvl === 'error') return 'bg-red-100 text-red-800 border-l-4 border-red-500';
    if (lvl === 'warn') return 'bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500';
    return 'bg-blue-100 text-blue-800 border-l-4 border-blue-500';
  };

  const getTypeLabel = (type: string) => {
    return type === 'server' ? '🖥️ Server' : '💻 Client';
  };

  const filteredLogs = allLogs.filter(log => {
    if (tab !== 'all' && log.type !== tab) return false;
    if (level !== 'all' && log.level !== level) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Unified Debug Logs</h3>
          <p className="text-sm text-gray-600">{filteredLogs.length} entries</p>
          {error && <p className="text-sm text-red-600">Error: {error}</p>}
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 rounded text-sm font-semibold transition ${
              autoRefresh
                ? 'bg-green-500 text-white'
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
            }`}
          >
            {autoRefresh ? '⏸ Auto' : '▶ Manual'}
          </button>

          <select
            value={level}
            onChange={e => setLevel(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded bg-white text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Levels</option>
            <option value="info">Info</option>
            <option value="warn">Warn</option>
            <option value="error">Error</option>
          </select>

          <button
            onClick={() => refetch()}
            disabled={loading}
            className="px-3 py-2 bg-indigo-500 text-white rounded text-sm hover:bg-indigo-600 disabled:opacity-50 transition font-semibold"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-300">
        {(['all', 'server', 'client'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 font-semibold transition ${
              tab === t
                ? 'text-indigo-700 border-b-2 border-indigo-700'
                : 'text-gray-600 hover:text-indigo-600'
            }`}
          >
            {t === 'all' ? '📊 All' : t === 'server' ? '🖥️ Server' : '💻 Client'}
          </button>
        ))}
      </div>

      <div className="space-y-2 max-h-[600px] overflow-y-auto bg-gray-50 rounded-lg p-4 border border-gray-200">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">📭 No logs found</p>
            <p className="text-sm">Logs will appear here as they are generated</p>
          </div>
        ) : (
          filteredLogs.map(log => (
            <div key={log.id} className={`rounded p-3 ${getLevelColor(log.level)}`}>
              <div className="flex gap-2 items-center mb-1 flex-wrap">
                <span className="font-semibold text-xs uppercase">{log.level}</span>
                <span className="text-xs bg-white/50 px-2 py-0.5 rounded">{getTypeLabel(log.type)}</span>
                <span className="text-xs font-mono text-gray-700">{log.source}</span>
                <span className="text-xs text-gray-600 ml-auto whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm font-medium mb-1">{log.message}</p>
              {log.context && Object.keys(log.context).length > 0 && (
                <details className="text-xs">
                  <summary className="cursor-pointer opacity-75 hover:opacity-100">Details</summary>
                  <pre className="mt-2 p-2 bg-black/10 rounded text-xs overflow-x-auto">
                    {JSON.stringify(log.context, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
