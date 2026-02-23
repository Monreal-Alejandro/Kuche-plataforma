/**
 * Configuración base de Axios para toda la aplicación
 * Incluye interceptores para manejo de tokens y errores
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// URL base del backend
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Crear instancia de axios
const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 segundos
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  },
  withCredentials: true, // Para enviar cookies automáticamente
});

// Interceptor de request - Agrega el token JWT si existe
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Intentar obtener el token del localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Agregar timestamp a peticiones GET para evitar caché del navegador
    if (config.method === 'get') {
      const separator = config.url?.includes('?') ? '&' : '?';
      config.url = `${config.url}${separator}_t=${Date.now()}`;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Interceptor de response - Manejo de errores global
axiosInstance.interceptors.response.use(
  (response) => {
    // Respuesta exitosa, retornar data directamente
    // Incluye manejo de 304 Not Modified
    if (response.status === 304) {
      console.warn('Respuesta 304 - Usando datos en caché. Considera desactivar caché.');
    }
    return response;
  },
  (error: AxiosError<ApiErrorResponse>) => {
    // Manejo de errores común
    if (error.response) {
      const { status, data } = error.response;
      
      // Token expirado o no autorizado
      if (status === 401) {
        // Limpiar token del localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        }
        
        // Redirigir a login si no estamos ya ahí
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      
      // Forbidden
      if (status === 403) {
        console.error('Acceso prohibido:', data?.message || 'Sin permisos');
      }
      
      // Not found
      if (status === 404) {
        console.error('Recurso no encontrado:', data?.message || 'No encontrado');
      }
      
      // Error del servidor
      if (status >= 500) {
        console.error('Error del servidor:', data?.message || 'Error interno');
      }
    } else if (error.request) {
      // Request hecho pero no hay respuesta
      console.error('No se recibió respuesta del servidor');
    } else {
      // Error al configurar el request
      console.error('Error al configurar la petición:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Tipos de respuesta de la API
export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  error?: string;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

export default axiosInstance;
