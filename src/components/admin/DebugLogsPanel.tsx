'use client';

import { useState, useEffect } from 'react';

interface DebugLog {
  id: string;
  level: 'info' | 'warn' | 'error';
  source: string;
  message: string;
  created_at: string;
}

export default function DebugLogsPanel() {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [level, setLevel] = useState<'all' | 'info' | 'warn' | 'error'>('all');
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const query = level === 'all' ? '' : `?level=${level}`;
      const response = await fetch(`/api/admin/logs${query}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch logs');
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [level]);

  const getLevelColor = (lvl: string) => {
    if (lvl === 'error') return 'bg-red-100 text-red-800';
    if (lvl === 'warn') return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Debug Logs ({logs.length})</h3>
        <div className="flex gap-2">
          <select
            value={level}
            onChange={e => setLevel(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 rounded bg-white text-sm"
          >
            <option value="all">All Levels</option>
            <option value="info">Info</option>
            <option value="warn">Warn</option>
            <option value="error">Error</option>
          </select>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 disabled:opacity-50 transition"
          >
            🔄
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {logs.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No logs found</p>
        ) : (
          logs.map(log => (
            <div key={log.id} className="border border-gray-200 rounded p-3 hover:bg-gray-50">
              <div className="flex gap-2 items-start mb-1">
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getLevelColor(log.level)}`}>
                  {log.level.toUpperCase()}
                </span>
                <span className="text-xs text-gray-600">{log.source}</span>
                <span className="text-xs text-gray-400 ml-auto">
                  {new Date(log.created_at).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm text-gray-700">{log.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
