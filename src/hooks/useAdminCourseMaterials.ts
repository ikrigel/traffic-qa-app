import { useState, useCallback } from 'react';

export interface CourseMaterial {
  id: string;
  course_id: string;
  title: string;
  content?: string;
  material_type: 'lesson' | 'resource' | 'video' | 'document';
  order_index: number;
  is_published: boolean;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export function useAdminCourseMaterials(courseId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMaterials = useCallback(async (): Promise<CourseMaterial[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/courses/${courseId}/materials`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch materials');
      const data = await response.json();
      return data.materials || [];
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      return [];
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  const addMaterial = useCallback(
    async (
      title: string,
      content?: string,
      material_type?: string,
      is_published?: boolean
    ): Promise<CourseMaterial | null> => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/admin/courses/${courseId}/materials`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ title, content, material_type, is_published }),
        });
        if (!response.ok) throw new Error('Failed to add material');
        const data = await response.json();
        return data.material;
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

  const deleteMaterial = useCallback(
    async (materialId: string): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/admin/courses/${courseId}/materials/${materialId}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to delete material');
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

  return { fetchMaterials, addMaterial, deleteMaterial, loading, error };
}
