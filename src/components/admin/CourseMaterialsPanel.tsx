'use client';

import { useState, useEffect } from 'react';
import { useAdminCourseMaterials, type CourseMaterial } from '@/hooks/useAdminCourseMaterials';

interface Props {
  courseId: string;
}

export default function CourseMaterialsPanel({ courseId }: Props) {
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [materialType, setMaterialType] = useState<'lesson' | 'resource' | 'video' | 'document'>('lesson');
  const [isPublished, setIsPublished] = useState(false);
  const { fetchMaterials, addMaterial, deleteMaterial, loading, error } = useAdminCourseMaterials(courseId);

  useEffect(() => {
    const load = async () => {
      const data = await fetchMaterials();
      setMaterials(data);
    };
    load();
  }, [fetchMaterials]);

  const handleAdd = async () => {
    if (!title.trim()) {
      alert('Title is required');
      return;
    }
    const material = await addMaterial(title, content, materialType, isPublished);
    if (material) {
      setMaterials([...materials, material]);
      setTitle('');
      setContent('');
      setMaterialType('lesson');
      setIsPublished(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this material?')) return;
    const success = await deleteMaterial(id);
    if (success) {
      setMaterials(materials.filter(m => m.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-green-50 border border-green-300 rounded-lg p-4 space-y-3">
        <h4 className="font-semibold text-green-900">Add Material</h4>
        <input
          type="text"
          placeholder="Material title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
        />
        <textarea
          placeholder="Content (optional)"
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
        />
        <div className="flex gap-3">
          <select
            value={materialType}
            onChange={e => setMaterialType(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
          >
            <option value="lesson">📖 Lesson</option>
            <option value="resource">📄 Resource</option>
            <option value="video">🎥 Video</option>
            <option value="document">📋 Document</option>
          </select>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={e => setIsPublished(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-700">Publish</span>
          </label>
        </div>
        <button
          onClick={handleAdd}
          disabled={loading}
          className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 font-semibold"
        >
          ➕ Add Material
        </button>
      </div>

      <div className="space-y-2">
        {materials.length === 0 ? (
          <p className="text-center py-8 text-gray-500">No materials yet</p>
        ) : (
          materials.map(material => (
            <div key={material.id} className="bg-white border border-gray-300 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold text-gray-800">{material.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {material.material_type.toUpperCase()} {material.is_published ? '✅ Published' : '⏱️ Draft'}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(material.id)}
                  disabled={loading}
                  className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:opacity-50"
                >
                  🗑️
                </button>
              </div>
              {material.content && (
                <p className="text-sm text-gray-700 line-clamp-2">{material.content}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
