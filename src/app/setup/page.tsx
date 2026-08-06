'use client';

import { useAuth } from '@/hooks/useAuth';
import SetupWizard from '@/components/SetupWizard';
import Link from 'next/link';

export default function SetupPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </main>
    );
  }

  // Restrict setup page to super_admin (developers only)
  if (!user || user.role !== 'super_admin') {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            The setup wizard is only for application developers. Regular users should add API keys in the Settings modal.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition"
          >
            ← Back to Home
          </Link>
        </div>
      </main>
    );
  }

  return <SetupWizard />;
}
