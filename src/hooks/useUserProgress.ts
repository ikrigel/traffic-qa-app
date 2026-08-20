import { useEffect, useState } from 'react';

export interface UserStats {
  total_attempts: number;
  total_correct: number;
  total_partial: number;
  total_incorrect: number;
  overall_accuracy: number;
  questions_mastered: number;
  questions_proficient: number;
  questions_learning: number;
  questions_unstarted: number;
  last_activity_at?: string;
}

export interface QuestionProgress {
  question_id: number;
  times_attempted: number;
  times_correct: number;
  times_partial: number;
  times_incorrect: number;
  mastery_level: 'unstarted' | 'learning' | 'proficient' | 'mastered';
  last_attempted_at?: string;
  first_correct_at?: string;
}

export const useUserProgress = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [progress, setProgress] = useState<QuestionProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/progress', {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch progress');

      const data = await response.json();
      setStats(data.stats);
      setProgress(data.progress);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading progress');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  const getMasteryIcon = (level: string) => {
    switch (level) {
      case 'mastered':
        return '🏆';
      case 'proficient':
        return '✅';
      case 'learning':
        return '📚';
      default:
        return '⭕';
    }
  };

  const getMasteryColor = (level: string) => {
    switch (level) {
      case 'mastered':
        return 'text-green-600 bg-green-50';
      case 'proficient':
        return 'text-blue-600 bg-blue-50';
      case 'learning':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return {
    stats,
    progress,
    loading,
    error,
    refetch: fetchProgress,
    getMasteryIcon,
    getMasteryColor,
  };
};
