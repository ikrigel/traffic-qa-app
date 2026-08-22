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
  const [refreshRate, setRefreshRate] = useState(2000);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [loggingEnabled, setLoggingEnabled] = useState(true);
  const { logs: serverLogs, loading, error, refetch } = useAdminLogs(level === 'all' ? 'all' : level);
  const debugManagerRef = useRef<any>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const manager = initDebugManager();
    debugManagerRef.current = manager;
  }, []);

  useEffect(() => {
    const checkLoggingStatus = async () => {
      try {
        const response = await fetch('/api/admin/logging/toggle', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setLoggingEnabled(data.loggingEnabled);
        }
      } catch (err) {
        console.error('Failed to check logging status:', err);
      }
    };
    checkLoggingStatus();
  }, []);

  const handleToggleLogging = async () => {
    try {
      const response = await fetch('/api/admin/logging/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ enabled: !loggingEnabled }),
      });
      if (response.ok) {
        const data = await response.json();
        setLoggingEnabled(data.loggingEnabled);
      }
    } catch (err) {
      console.error('Failed to toggle logging:', err);
    }
  };

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
    }, refreshRate);

    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, [autoRefresh, refreshRate, refetch]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelected(new Set(filteredLogs.map(log => log.id)));
    } else {
      setSelected(new Set());
    }
  };

  const handleSelectLog = (id: string, checked: boolean) => {
    const newSelected = new Set(selected);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelected(newSelected);
  };

  const handleDeleteLogs = async (ids: string[]) => {
    if (!window.confirm(`Delete ${ids.length} log(s)? This cannot be undone.`)) return;

    setDeleting(true);
    try {
      const response = await fetch('/api/admin/logs/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ logIds: ids }),
      });
      if (response.ok) {
        setSelected(new Set());
        refetch();
      }
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleExportLogs = (logs: LogEntry[]) => {
    const data = JSON.stringify(logs, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Unified Debug Logs</h3>
          <p className="text-sm text-gray-600">{filteredLogs.length} entries {selected.size > 0 && `• ${selected.size} selected`}</p>
          <p className={`text-sm font-semibold ${loggingEnabled ? 'text-green-600' : 'text-red-600'}`}>
            {loggingEnabled ? '✅ Logging Active' : '🚫 Logging Disabled'}
          </p>
          {error && <p className="text-sm text-red-600">Error: {error}</p>}
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleToggleLogging}
            className={`px-3 py-2 rounded text-sm font-semibold transition ${
              loggingEnabled
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-red-500 text-white hover:bg-red-600'
            }`}
          >
            {loggingEnabled ? '✅ Logging On' : '🚫 Logging Off'}
          </button>

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

          {autoRefresh && (
            <select
              value={refreshRate}
              onChange={e => setRefreshRate(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded bg-white text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value={1000}>1s</option>
              <option value={2000}>2s</option>
              <option value={5000}>5s</option>
              <option value={10000}>10s</option>
            </select>
          )}

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

          {filteredLogs.length > 0 && (
            <>
              <button
                onClick={() => handleExportLogs(filteredLogs)}
                className="px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 font-semibold"
              >
                📥 Export All
              </button>
              {selected.size > 0 && (
                <button
                  onClick={() => handleExportLogs(filteredLogs.filter(l => selected.has(l.id)))}
                  className="px-3 py-2 bg-blue-400 text-white rounded text-sm hover:bg-blue-500 font-semibold"
                >
                  📥 Export ({selected.size})
                </button>
              )}
            </>
          )}

          <button
            onClick={() => handleDeleteLogs(Array.from(selected))}
            disabled={selected.size === 0 || deleting}
            className="px-3 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:opacity-50 font-semibold"
          >
            🗑️ Delete ({selected.size})
          </button>

          {filteredLogs.length > 0 && (
            <button
              onClick={() => handleDeleteLogs(filteredLogs.map(l => l.id))}
              disabled={deleting}
              className="px-3 py-2 bg-red-700 text-white rounded text-sm hover:bg-red-800 disabled:opacity-50 font-semibold"
            >
              🗑️ Clear All
            </button>
          )}
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
          <>
            {filteredLogs.length > 0 && (
              <div className="flex items-center gap-2 pb-3 border-b border-gray-300">
                <input
                  type="checkbox"
                  checked={selected.size === filteredLogs.length && filteredLogs.length > 0}
                  onChange={e => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 cursor-pointer"
                />
                <span className="text-xs text-gray-600">Select all visible</span>
              </div>
            )}
            {filteredLogs.map(log => (
              <div key={log.id} className={`rounded p-3 ${getLevelColor(log.level)}`}>
                <div className="flex gap-2 items-center mb-1 flex-wrap">
                  <input
                    type="checkbox"
                    checked={selected.has(log.id)}
                    onChange={e => handleSelectLog(log.id, e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                  />
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
            ))}
          </>
        )}
      </div>
    </div>
  );
}
