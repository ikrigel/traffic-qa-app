'use client';

import { useAuth } from '@/hooks/useAuth';

export default function Home() {
  const { user, loading, login, logout } = useAuth();

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
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-blue-600">Traffic Laws Q&A</h1>
            <p className="text-sm text-gray-600">קורס 54 - דרכים 2000 - פותח על ידי יגאל קריגל</p>
          </div>
          {user && (
            <button
              onClick={logout}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
            >
              Logout
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          <h2 className="text-3xl font-bold text-center mb-3 text-gray-800">
            Traffic Laws Q&A
          </h2>
          <p className="text-center text-gray-600 mb-12 text-lg">
            Study Israeli traffic laws for your driving exam
          </p>

          {!user ? (
            <div className="text-center">
              <button
                onClick={login}
                className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg transition"
              >
                📧 Login with Gmail
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* User Profile Card */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Logged in as</p>
                    <p className="text-lg font-semibold text-gray-800">{user.email}</p>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">0</div>
                  <div className="text-sm text-gray-600">Questions Answered</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                  <div className="text-2xl font-bold text-green-600">0%</div>
                  <div className="text-sm text-gray-600">Progress</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center border border-purple-200">
                  <div className="text-2xl font-bold text-purple-600">0</div>
                  <div className="text-sm text-gray-600">Correct</div>
                </div>
              </div>

              {/* Coming Soon */}
              <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
                <p className="text-center text-gray-700">
                  ✨ <span className="font-semibold">Coming Soon:</span> Q&A questions, theme switching, and progress tracking!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>Built with Next.js, React, and Supabase</p>
        </div>
      </div>
    </main>
  );
}
