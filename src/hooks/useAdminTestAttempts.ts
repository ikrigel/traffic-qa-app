import { useState, useEffect } from 'react';

export interface TestAttempt {
  id: string;
  user_id: string;
  question_id: number;
  question_text: string;
  correct_answer: string;
  user_answer: string;
  input_method: 'typed' | 'voice';
  verdict: 'correct' | 'partial' | 'incorrect';
  metrics?: Record<string, number>;
  feedback?: string;
  created_at: string;
}

export const useAdminTestAttempts = () => {
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAttempts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/test-attempts', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch test attempts');
      const data = await response.json();
      setAttempts(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttempts();
  }, []);

  return { attempts, loading, error, refetch: fetchAttempts };
};
