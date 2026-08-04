import { useState, useEffect } from 'react';
import type { Role } from '@/types';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();

    // Re-check auth when user returns to page (e.g., after OAuth redirect)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkAuth();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/user', {
        credentials: 'include', // Ensure cookies are sent
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data: AuthUser = await response.json();
        setUser(data);
        console.log('✅ User authenticated:', data.email);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.log('Not authenticated:', errorData.reason || 'unknown reason');
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
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
