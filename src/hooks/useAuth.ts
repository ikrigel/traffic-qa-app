/* eslint-disable no-console */
import { useState, useEffect } from 'react';
import type { Role } from '@/types';
import { APP_VERSION } from '@/lib/constants';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

const BUILD_ID = `v${APP_VERSION}-${new Date().toISOString().split('T')[0]}`;

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log(`[AUTH BUILD ${BUILD_ID}] useAuth mounted, starting checkAuth`);
    checkAuth();

    // Re-check auth when user returns to page (e.g., after OAuth redirect)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log(`[AUTH BUILD ${BUILD_ID}] Page visible, re-checking auth`);
        checkAuth();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const checkAuth = async () => {
    console.log(`[AUTH BUILD ${BUILD_ID}] checkAuth called, preparing fetch to /api/user`);
    try {
      console.log(`[AUTH BUILD ${BUILD_ID}] Fetch config: credentials="include", method=GET`);
      const response = await fetch('/api/user', {
        credentials: 'include', // Ensure cookies are sent
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log(`[AUTH BUILD ${BUILD_ID}] /api/user response status: ${response.status}`);

      if (response.ok) {
        const data: AuthUser = await response.json();
        console.log(`[AUTH BUILD ${BUILD_ID}] ✅ User authenticated:`, data);
        setUser(data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.log(`[AUTH BUILD ${BUILD_ID}] ❌ Auth failed. Status: ${response.status}, Reason: ${errorData.reason || 'unknown'}`);
        console.log(`[AUTH BUILD ${BUILD_ID}] Full error response:`, errorData);
        setUser(null);
      }
    } catch (error) {
      console.error(`[AUTH BUILD ${BUILD_ID}] Auth check exception:`, error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    try {
      const response = await fetch('/api/auth?action=login');
      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth?action=logout');
      setUser(null);
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isSuperAdmin = user?.role === 'super_admin';

  return { user, loading, login, logout, isAdmin, isSuperAdmin };
};
