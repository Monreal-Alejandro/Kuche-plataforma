/**
 * API de Autenticación
 * Maneja login, registro, logout y gestión de sesión
 */

import axiosInstance, { ApiResponse } from './axiosConfig';

// Tipos de datos para autenticación
export interface LoginCredentials {
  correo: string;
  password: string;
}

export interface RegisterData {
  nombre: string;
  correo: string;
  password: string;
  rol?: 'admin' | 'arquitecto' | 'empleado';
}

export interface User {
  _id: string;
  nombre: string;
  correo: string;
  rol: 'admin' | 'arquitecto' | 'empleado';
  activo: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

/**
 * Realizar login
 */
export const login = async (credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> => {
  const response = await axiosInstance.post<ApiResponse<AuthResponse>>('/api/auth/login', credentials);
  
  // Si el login es exitoso, guardar token y usuario
  if (response.data.success && 'data' in response.data) {
    const { token, user } = response.data.data;
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
  }
  
  return response.data;
};

/**
 * Realizar registro
 */
export const register = async (data: RegisterData): Promise<ApiResponse<AuthResponse>> => {
  const response = await axiosInstance.post<ApiResponse<AuthResponse>>('/api/auth/register', data);
  
  // Si el registro es exitoso, guardar token y usuario
  if (response.data.success && 'data' in response.data) {
    const { token, user } = response.data.data;
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
  }
  
  return response.data;
};

/**
 * Cerrar sesión
 */
export const logout = async (): Promise<void> => {
  try {
    await axiosInstance.post('/api/auth/logout');
  } finally {
    // Limpiar datos locales independientemente del resultado
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }
};

/**
 * Obtener usuario actual
 */
export const getCurrentUser = async (): Promise<ApiResponse<User>> => {
  const response = await axiosInstance.get<ApiResponse<User>>('/api/auth/me');
  return response.data;
};

/**
 * Verificar si el usuario está autenticado
 */
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('authToken');
  return !!token;
};

/**
 * Obtener usuario del localStorage
 */
export const getUserFromStorage = (): User | null => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr) as User;
  } catch {
    return null;
  }
};

/**
 * Actualizar contraseña
 */
export const updatePassword = async (oldPassword: string, newPassword: string): Promise<ApiResponse<void>> => {
  const response = await axiosInstance.patch<ApiResponse<void>>('/api/auth/password', {
    oldPassword,
    newPassword,
  });
  return response.data;
};

/**
 * Solicitar recuperación de contraseña
 */
export const requestPasswordReset = async (correo: string): Promise<ApiResponse<void>> => {
  const response = await axiosInstance.post<ApiResponse<void>>('/api/auth/forgot-password', { correo });
  return response.data;
};

/**
 * Restablecer contraseña con token
 */
export const resetPassword = async (token: string, newPassword: string): Promise<ApiResponse<void>> => {
  const response = await axiosInstance.post<ApiResponse<void>>('/api/auth/reset-password', {
    token,
    newPassword,
  });
  return response.data;
};
