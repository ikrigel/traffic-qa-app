'use client';

import { useState, useEffect } from 'react';
import { useAdminCourses, type Course } from '@/hooks/useAdminCourses';

interface Props {
  onSelectCourse: (course: { id: string; title: string }) => void;
}

export default function CoursesListPanel({ onSelectCourse }: Props) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const { fetchCourses, createCourse, deleteCourse, loading, error } = useAdminCourses();

  useEffect(() => {
    const load = async () => {
      const data = await fetchCourses();
      setCourses(data);
    };
    load();
  }, [fetchCourses]);

  const handleCreate = async () => {
    if (!title.trim()) {
      alert('Title is required');
      return;
    }
    const newCourse = await createCourse(title, description, category);
    if (newCourse) {
      setCourses([...courses, newCourse]);
      setTitle('');
      setDescription('');
      setCategory('');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this course? This will also delete all materials and questions.')) return;
    const success = await deleteCourse(id);
    if (success) {
      setCourses(courses.filter(c => c.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📚 Courses</h3>
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <div className="bg-indigo-50 border border-indigo-300 rounded-lg p-4 space-y-3 mb-6">
          <h4 className="font-semibold text-indigo-900">Create New Course</h4>
          <input
            type="text"
            placeholder="Course title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="text"
            placeholder="Category (optional)"
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 font-semibold"
          >
            ➕ Create Course
          </button>
        </div>

        <div className="space-y-2">
          {courses.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No courses yet</p>
          ) : (
            courses.map(course => (
              <div
                key={course.id}
                className="bg-white border border-gray-300 rounded-lg p-4 flex justify-between items-start hover:shadow-md transition"
              >
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => onSelectCourse({ id: course.id, title: course.title })}
                >
                  <h4 className="font-semibold text-gray-800 hover:text-indigo-600">
                    {course.title}
                  </h4>
                  {course.description && (
                    <p className="text-sm text-gray-600">{course.description}</p>
                  )}
                  {course.category && (
                    <p className="text-xs text-gray-500 mt-1">📁 {course.category}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(course.id)}
                  disabled={loading}
                  className="ml-4 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:opacity-50"
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
