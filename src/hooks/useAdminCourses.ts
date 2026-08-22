import { useState, useCallback } from 'react';

export interface Course {
  id: string;
  title: string;
  description?: string;
  category?: string;
  order_index: number;
  is_active: boolean;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export function useAdminCourses() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = useCallback(async (): Promise<Course[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/courses', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch courses');
      const data = await response.json();
      return data.courses || [];
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createCourse = useCallback(
    async (title: string, description?: string, category?: string): Promise<Course | null> => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/admin/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ title, description, category }),
        });
        if (!response.ok) throw new Error('Failed to create course');
        const data = await response.json();
        return data.course;
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

  const updateCourse = useCallback(
    async (id: string, updates: Partial<Course>): Promise<Course | null> => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/admin/courses/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(updates),
        });
        if (!response.ok) throw new Error('Failed to update course');
        const data = await response.json();
        return data.course;
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

  const deleteCourse = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/courses/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete course');
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchCourses, createCourse, updateCourse, deleteCourse, loading, error };
}
