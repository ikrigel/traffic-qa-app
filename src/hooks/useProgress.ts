import { useState, useEffect, useCallback } from 'react';

export interface QuestionProgress {
  id: string;
  user_id: string;
  question_id: number;
  attempts: number;
  correct_attempts: number;
  last_attempted_at: string;
  first_attempted_at: string;
  created_at: string;
  updated_at: string;
}

export interface UserStatistics {
  user_id: string;
  total_attempts: number;
  total_correct: number;
  accuracy_percentage: number;
  questions_mastered: number;
  streak_current: number;
  streak_longest: number;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useProgress = () => {
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [progress, setProgress] = useState<QuestionProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/progress', {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to load progress');

      const data = await response.json();
      setStatistics(data.statistics);
      setProgress(data.progress);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load progress';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const recordProgress = useCallback(async (questionId: number, isCorrect: boolean) => {
    try {
      const response = await fetch('/api/user/progress', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, isCorrect }),
      });

      if (!response.ok) throw new Error('Failed to record progress');

      // Refetch statistics
      await fetchProgress();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to record progress';
      setError(message);
      return false;
    }
  }, [fetchProgress]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  return {
    statistics,
    progress,
    loading,
    error,
    recordProgress,
    refetch: fetchProgress,
  };
};
