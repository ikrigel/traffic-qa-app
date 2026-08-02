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
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/user');
      if (response.ok) {
        const data: AuthUser = await response.json();
        setUser(data);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
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
