import { useState, useEffect } from 'react';

export interface RagEvaluation {
  id: string;
  question: string;
  expected_answer: string;
  ai_answer: string;
  retrieved_document_ids?: string[];
  metrics: Record<string, number>;
  created_by?: string;
  created_at: string;
}

export const useAdminEvaluations = () => {
  const [evaluations, setEvaluations] = useState<RagEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/evaluations', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch evaluations');
      const data = await response.json();
      setEvaluations(data.evaluations || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const runEvaluation = async (question: string, expectedAnswer: string) => {
    try {
      const response = await fetch('/api/admin/evaluations', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, expectedAnswer }),
      });
      if (!response.ok) throw new Error('Failed to run evaluation');
      const result = await response.json();
      await fetchEvaluations();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  };

  useEffect(() => {
    fetchEvaluations();
  }, []);

  return { evaluations, loading, error, runEvaluation, refetch: fetchEvaluations };
};
