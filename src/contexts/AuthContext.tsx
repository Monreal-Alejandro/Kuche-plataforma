/**
 * Context de Autenticación
 * Provee el estado de autenticación a toda la aplicación
 */

'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, type User } from '@/lib/axios';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (correo: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Verificar si hay usuario guardado
    const storedUser = authApi.getUserFromStorage();
    if (storedUser) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const login = async (correo: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> => {
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
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      setUser(null);
      router.push('/login');
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext debe usarse dentro de un AuthProvider');
  }
  return context;
}
