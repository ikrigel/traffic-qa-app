import { useState, useCallback } from 'react';

export interface QuestionOption {
  id?: string;
  text: string;
  is_correct: boolean;
}

export interface AdminQuestion {
  id: string;
  question_text: string;
  question_type: 'free_text' | 'multiple_choice';
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  is_published: boolean;
  created_by?: string;
  created_at?: string;
  options?: QuestionOption[];
  courses?: Array<{ id: string; title: string }>;
}

export function useAdminQuestions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = useCallback(async (): Promise<AdminQuestion[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/questions', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch questions');
      const data = await response.json();
      return data.questions || [];
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createQuestion = useCallback(
    async (
      question_text: string,
      question_type: 'free_text' | 'multiple_choice',
      options?: QuestionOption[],
      category?: string,
      difficulty?: string,
      course_ids?: string[]
    ): Promise<AdminQuestion | null> => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/admin/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ question_text, question_type, options, category, difficulty, course_ids }),
        });
        if (!response.ok) throw new Error('Failed to create question');
        const data = await response.json();
        return data.question;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteQuestion = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/questions/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete question');
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchQuestions, createQuestion, deleteQuestion, loading, error };
}
