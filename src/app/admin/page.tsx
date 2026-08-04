'use client';

import { useAuth } from '@/hooks/useAuth';
import AdminPanelContainer from '@/components/admin/AdminPanelContainer';

export default function AdminPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </main>
    );
  }

  if (!user || !user.role || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">You do not have permission to access the admin panel.</p>
          <a
            href="/"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
          >
            Back to Home
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">Admin Panel</h1>
          <a
            href="/"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
          >
            Back to Home
          </a>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {user && user.role && <AdminPanelContainer user={user as any} />}
      </div>
    </main>
  );
}
