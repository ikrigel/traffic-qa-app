import { useState, useEffect } from 'react';

export interface RagDocument {
  id: string;
  title: string;
  source?: string;
  content: string;
  embedding?: number[];
  metadata?: Record<string, any>;
  created_by?: string;
  created_at: string;
}

export const useAdminRagDocuments = () => {
  const [documents, setDocuments] = useState<RagDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/rag-documents', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch documents');
      const data = await response.json();
      setDocuments(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async (title: string, content: string, source?: string) => {
    try {
      const response = await fetch('/api/admin/rag-documents', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, source }),
      });
      if (!response.ok) throw new Error('Failed to upload document');
      await fetchDocuments();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  return { documents, loading, error, uploadDocument, refetch: fetchDocuments };
};
