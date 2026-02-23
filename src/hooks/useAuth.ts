/**
 * Hook personalizado para manejar autenticación
 * Maneja login, logout y estado del usuario
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, type User } from '@/lib/axios';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      if (authApi.isAuthenticated()) {
        const storedUser = authApi.getUserFromStorage();
        if (storedUser) {
          setUser(storedUser);
        } else {
          // Intentar obtener usuario del backend
          const response = await authApi.getCurrentUser();
          if (response.success) {
            setUser(response.data);
          }
        }
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      // Si hay error, limpiar autenticación
      authApi.logout();
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (correo: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> => {
    try {
      const response = await authApi.login({ correo, password });
      if (response.success) {
        setUser(response.data.user);
        return { success: true, user: response.data.user };
      }
      return { success: false, error: response.message || 'Error al iniciar sesión' };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Error al conectar con el servidor';
      return { success: false, error: errorMessage };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      setUser(null);
      router.push('/login');
    }
  }, [router]);

  const isAuthenticated = !!user;

  return {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    checkAuth,
  };
}
