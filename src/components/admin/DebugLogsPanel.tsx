'use client';

import { useState } from 'react';
import { useAdminLogs } from '@/hooks/useAdminLogs';

export default function DebugLogsPanel() {
  const [level, setLevel] = useState<'all' | 'info' | 'warn' | 'error'>('all');
  const { logs, loading, error, refetch } = useAdminLogs(level);

  const getLevelColor = (lvl: string) => {
    if (lvl === 'error') return 'bg-red-100 text-red-800 border-l-4 border-red-500';
    if (lvl === 'warn') return 'bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500';
    return 'bg-blue-100 text-blue-800 border-l-4 border-blue-500';
  };

  if (loading) return <div className="text-center text-gray-600">Loading logs...</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Debug Logs</h3>
          <p className="text-sm text-gray-600">{logs.length} entries</p>
        </div>
        <div className="flex gap-2">
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
            onClick={refetch}
            disabled={loading}
            className="px-3 py-2 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 disabled:opacity-50 transition font-semibold"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {logs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">📭 No logs found</p>
            <p className="text-sm">Logs will appear here as errors occur</p>
          </div>
        ) : (
          logs.map(log => (
            <div key={log.id} className={`rounded p-4 ${getLevelColor(log.level)}`}>
              <div className="flex gap-2 items-center mb-2">
                <span className="font-semibold text-xs uppercase">{log.level}</span>
                <span className="text-xs text-gray-600 font-mono">{log.source}</span>
                <span className="text-xs text-gray-500 ml-auto">
                  {new Date(log.created_at).toLocaleTimeString()}
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
