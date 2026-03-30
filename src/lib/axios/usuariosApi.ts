/**
 * API de Usuarios/Empleados
 * Endpoints para gestión de usuarios y empleados del sistema
 */

import axiosInstance, { ApiResponse } from './axiosConfig';

// Tipos de datos para Usuario
export interface Usuario {
  _id: string;
  nombre: string;
  correo: string;
  rol: 'admin' | 'arquitecto' | 'empleado';
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CrearUsuarioPayload {
  nombre: string;
  correo: string;
  rol: 'admin' | 'arquitecto' | 'empleado';
  password?: string;
}

/**
 * Listar todos los usuarios activos
 */
export const listarUsuarios = async (): Promise<ApiResponse<Usuario[]>> => {
  const response = await axiosInstance.get<ApiResponse<Usuario[]>>('/api/usuarios');
  return response.data;
};

/**
 * Listar empleados activos (alias para asignación)
 */
export const listarEmpleados = async (): Promise<ApiResponse<Usuario[]>> => {
  const response = await axiosInstance.get<ApiResponse<Usuario[]>>('/api/usuarios/empleados');
  return response.data;
};

/**
 * Obtener usuario por ID
 */
export const obtenerUsuario = async (id: string): Promise<ApiResponse<Usuario>> => {
  const response = await axiosInstance.get<ApiResponse<Usuario>>(`/api/usuarios/${id}`);
  return response.data;
};

/**
 * Crear nuevo usuario/empleado para asignaciones operativas
 */
export const crearUsuario = async (payload: CrearUsuarioPayload): Promise<ApiResponse<Usuario>> => {
  const response = await axiosInstance.post<ApiResponse<Usuario>>('/api/usuarios', payload);
  return response.data;
};
