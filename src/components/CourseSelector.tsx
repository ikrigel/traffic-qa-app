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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 mb-4 sm:mb-6">
      <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">📚 בחר קורס</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        {courses.map((course) => (
          <button
            key={course.id}
            onClick={() => onSelectCourse(course.id)}
            className={`p-3 sm:p-4 rounded-lg text-left transition active:scale-95 ${
              selectedCourseId === course.id
                ? 'bg-blue-600 text-white border-2 border-blue-700 shadow-md'
                : 'bg-gray-50 text-gray-800 border-2 border-gray-200 hover:border-blue-400'
            }`}
          >
            <div className="font-bold text-sm sm:text-base">{course.hebrewName}</div>
            <div className="text-xs sm:text-sm opacity-80">{course.name}</div>
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
