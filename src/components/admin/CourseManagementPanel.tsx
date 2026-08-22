'use client';

import { useState, useEffect } from 'react';
import { useAdminCourses } from '@/hooks/useAdminCourses';
import CoursesListPanel from './CoursesListPanel';
import CourseMaterialsPanel from './CourseMaterialsPanel';
import CourseQuestionsPanel from './CourseQuestionsPanel';

type Tab = 'courses' | 'materials' | 'questions';

interface SelectedCourse {
  id: string;
  title: string;
}

export default function CourseManagementPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('courses');
  const [selectedCourse, setSelectedCourse] = useState<SelectedCourse | null>(null);
  const { fetchCourses } = useAdminCourses();

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleSelectCourse = (course: SelectedCourse) => {
    setSelectedCourse(course);
    setActiveTab('materials');
  };

  const handleBackToCourses = () => {
    setSelectedCourse(null);
    setActiveTab('courses');
  };

  return (
    <div className="space-y-4">
      {selectedCourse ? (
        <>
          <div className="flex items-center gap-4 pb-4 border-b">
            <button
              onClick={handleBackToCourses}
              className="px-3 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 font-semibold"
            >
              ← Back
            </button>
            <h3 className="text-lg font-semibold text-gray-800">
              {selectedCourse.title}
            </h3>
          </div>

          <div className="flex gap-2 border-b">
            {(['materials', 'questions'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-semibold transition ${
                  activeTab === tab
                    ? 'text-indigo-700 border-b-2 border-indigo-700'
                    : 'text-gray-600 hover:text-indigo-600'
                }`}
              >
                {tab === 'materials' ? '📚 Materials' : '❓ Questions'}
              </button>
            ))}
          </div>

          {activeTab === 'materials' && (
            <CourseMaterialsPanel courseId={selectedCourse.id} />
          )}
          {activeTab === 'questions' && (
            <CourseQuestionsPanel courseId={selectedCourse.id} />
          )}
        </>
      ) : (
        <CoursesListPanel onSelectCourse={handleSelectCourse} />
      )}
    </div>
  );
}
