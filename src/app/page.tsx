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
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-4">
          Traffic Laws Q&A
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Study Israeli traffic laws for your driving exam
        </p>

        {!user ? (
          <div className="text-center">
            <button
              onClick={login}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              Login with Gmail
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className="mb-6 text-gray-700">
              Welcome, <span className="font-semibold">{user.email}</span>!
            </p>
            <button
              onClick={logout}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
