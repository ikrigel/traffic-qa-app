'use client';

import { Course } from '@/lib/questions';

interface CourseSelectorProps {
  courses: Course[];
  selectedCourseId: string;
  onSelectCourse: (courseId: string) => void;
}

export default function CourseSelector({
  courses,
  selectedCourseId,
  onSelectCourse,
}: CourseSelectorProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">📚 Select Course</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {courses.map((course) => (
          <button
            key={course.id}
            onClick={() => onSelectCourse(course.id)}
            className={`p-4 rounded-lg text-left transition ${
              selectedCourseId === course.id
                ? 'bg-blue-600 text-white border-2 border-blue-700'
                : 'bg-gray-50 text-gray-800 border-2 border-gray-200 hover:border-blue-400'
            }`}
          >
            <div className="font-bold text-base">{course.hebrewName}</div>
            <div className="text-sm opacity-80">{course.name}</div>
            {course.questions.length > 0 ? (
              <div className="text-xs mt-2 opacity-70">
                {course.questions.length} שאלות
              </div>
            ) : (
              <div className="text-xs mt-2 text-yellow-500 font-semibold">
                יעודכן בקרוב
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
