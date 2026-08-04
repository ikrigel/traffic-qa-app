'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import QuestionList from '@/components/QuestionList';
import CourseSelector from '@/components/CourseSelector';
import HelpModal from '@/components/HelpModal';
import AboutModal from '@/components/AboutModal';
import ChatAssistant from '@/components/ChatAssistant';
import { COURSES, getCourseQuestions } from '@/lib/questions';
import { downloadPDF } from '@/lib/pdfGenerator';

export default function Home() {
  const { user, loading, login, logout } = useAuth();
  const [selectedCourseId, setSelectedCourseId] = useState('traffic-laws');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const courseQuestions = getCourseQuestions(selectedCourseId);
  const selectedCourse = COURSES.find(c => c.id === selectedCourseId);

  const handleDownloadPDF = async () => {
    if (courseQuestions.length === 0) {
      alert('No questions available for this course');
      return;
    }
    try {
      const questionsForPDF = courseQuestions.map(q => ({
        id: q.id,
        question: q.question,
        answer: q.answer,
        priority: q.priority,
      }));
      await downloadPDF(questionsForPDF, selectedCourse?.hebrewName || 'Study Materials');
    } catch (error) {
      console.error('PDF download failed:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex justify-between items-center gap-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-blue-600 truncate">Traffic Laws Q&A</h1>
            <p className="text-xs sm:text-sm text-gray-600 line-clamp-1">קורס 54 - דרכים 2000 - פותח על ידי יגאל קריגל</p>
          </div>
          <div className="flex gap-1 sm:gap-2">
            {user && courseQuestions.length > 0 && (
              <button
                onClick={handleDownloadPDF}
                className="px-2 sm:px-3 py-2 text-xs sm:text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-semibold whitespace-nowrap transition"
                title="Download PDF"
              >
                📥
              </button>
            )}
            <button
              onClick={() => setIsHelpOpen(true)}
              className="px-2 sm:px-3 py-2 text-xs sm:text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold whitespace-nowrap transition"
              title="עזרה"
            >
              ❓
            </button>
            <button
              onClick={() => setIsAboutOpen(true)}
              className="px-2 sm:px-3 py-2 text-xs sm:text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold whitespace-nowrap transition"
              title="אודות"
            >
              ℹ️
            </button>
            {user && user.role !== 'user' && (
              <a
                href="/admin"
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold whitespace-nowrap inline-block transition"
              >
                פאנל ניהול
              </a>
            )}
            {user && (
              <button
                onClick={logout}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold whitespace-nowrap transition"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-12">
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 md:p-8 lg:p-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2 sm:mb-3 text-gray-800">
            Traffic Laws Q&A
          </h2>
          <p className="text-center text-gray-600 mb-6 sm:mb-8 md:mb-12 text-base sm:text-lg">
            Study Israeli traffic laws for your driving exam
          </p>

          {!user ? (
            <div className="text-center">
              <button
                onClick={login}
                className="px-6 sm:px-8 py-3 sm:py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-base sm:text-lg transition active:scale-95"
              >
                📧 Login with Gmail
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* User Profile Card */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 sm:p-6 border border-blue-200">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-bold flex-shrink-0">
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-xs sm:text-sm text-gray-600">Logged in as</p>
                    <p className="text-base sm:text-lg font-semibold text-gray-800 break-all">{user.email}</p>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div className="bg-blue-50 rounded-lg p-3 sm:p-4 text-center border border-blue-200">
                  <div className="text-xl sm:text-2xl font-bold text-blue-600">0</div>
                  <div className="text-xs sm:text-sm text-gray-600">שאלות</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 sm:p-4 text-center border border-green-200">
                  <div className="text-xl sm:text-2xl font-bold text-green-600">0%</div>
                  <div className="text-xs sm:text-sm text-gray-600">התקדמות</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 sm:p-4 text-center border border-purple-200">
                  <div className="text-xl sm:text-2xl font-bold text-purple-600">0</div>
                  <div className="text-xs sm:text-sm text-gray-600">נכונות</div>
                </div>
              </div>

              {/* Courses Section */}
              <div className="mt-8">
                <CourseSelector
                  courses={COURSES}
                  selectedCourseId={selectedCourseId}
                  onSelectCourse={setSelectedCourseId}
                />

                {/* Course Content */}
                {courseQuestions.length > 0 ? (
                  <div>
                    <h3 className="text-2xl font-bold mb-6 text-gray-800">
                      📚 {selectedCourse?.hebrewName}
                    </h3>
                    <QuestionList
                      questions={courseQuestions}
                      showAnswers={false}
                      enableTesting={!!user}
                    />
                  </div>
                ) : (
                  <div className="bg-yellow-50 rounded-lg p-8 text-center border-2 border-yellow-200">
                    <p className="text-2xl font-bold text-yellow-700 mb-2">
                      {selectedCourse?.hebrewName}
                    </p>
                    <p className="text-lg text-yellow-600">יעודכן בקרוב</p>
                    <p className="text-sm text-yellow-600 mt-2">
                      קורס זה יהיה זמין בקרוב עם שאלות ותשובות
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 sm:mt-8 text-xs sm:text-sm text-gray-600 px-2">
          <p>Built with Next.js, React, and Supabase</p>
        </div>
      </div>

      {/* Chat Assistant - only for logged-in users */}
      {user && <ChatAssistant />}

      {/* Modals */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </main>
  );
}
