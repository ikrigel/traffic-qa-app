import { useState, useEffect } from 'react';

export interface DebugLog {
  id: string;
  level: 'info' | 'warn' | 'error';
  source: string;
  message: string;
  context?: Record<string, any>;
  created_at: string;
}

export const useAdminLogs = (level: 'all' | 'info' | 'warn' | 'error' = 'all') => {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const query = level === 'all' ? '' : `?level=${level}`;
      const response = await fetch(`/api/admin/logs${query}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch logs');
      const data = await response.json();
      setLogs(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [level]);

  return { logs, loading, error, refetch: fetchLogs };
};
