import { useState, useCallback } from 'react';

export interface CourseQuestion {
  id: string;
  course_id: string;
  question_id: number;
  order_index: number;
  is_required: boolean;
  question?: any;
  created_at?: string;
}

export function useAdminCourseQuestions(courseId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCourseQuestions = useCallback(async (): Promise<CourseQuestion[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/courses/${courseId}/questions`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch course questions');
      const data = await response.json();
      return data.courseQuestions || [];
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      return [];
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  const addQuestion = useCallback(
    async (question_id: number, is_required?: boolean): Promise<CourseQuestion | null> => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/admin/courses/${courseId}/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ question_id, is_required }),
        });
        if (!response.ok) throw new Error('Failed to add question');
        const data = await response.json();
        return data.courseQuestion;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [courseId]
  );

  const removeQuestion = useCallback(
    async (courseQuestionId: string): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/admin/courses/${courseId}/questions/${courseQuestionId}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to remove question');
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setError(msg);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [courseId]
  );

  return { fetchCourseQuestions, addQuestion, removeQuestion, loading, error };
}
