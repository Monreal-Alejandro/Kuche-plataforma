/**
 * API de Levantamientos Rápidos
 * Endpoints para estimaciones rápidas de proyectos
 */

import axiosInstance, { ApiResponse } from './axiosConfig';

// Tipos de datos para Levantamiento
export interface ClienteLevantamiento {
  nombre: string;
  direccion: string;
  telefono: string;
}

export interface LevantamientoCreate {
  cliente: ClienteLevantamiento;
  metrosLineales: number;
  requiereIsla?: boolean;
  alacenasAltas?: boolean;
  tipoCubierta: 'Granito Básico' | 'Cuarzo' | 'Piedra Sinterizada';
  escenarioSeleccionado: 'esencial' | 'tendencia' | 'premium';
  empleadoAsignado?: string;
  notas?: string;
}

export interface Levantamiento extends LevantamientoCreate {
  _id: string;
  precioBase: number;
  factorMaterial: number;
  multiplicadorEscenario: number;
  precioEstimado: number;
  rangoMin: number;
  rangoMax: number;
  estado: 'pendiente' | 'en_revision' | 'contactado' | 'cotizado' | 'rechazado' | 'archivado';
  historialEstados: HistorialEstado[];
  convertidoACotizacion: boolean;
  cotizacionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HistorialEstado {
  estado: string;
  fecha: string;
  usuario: string;
  notas?: string;
}

export interface LevantamientoFilters {
  estado?: string;
  empleadoAsignado?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  page?: number;
  limit?: number;
}

export interface CambiarEstadoData {
  estado: 'pendiente' | 'en_revision' | 'contactado' | 'cotizado' | 'rechazado' | 'archivado';
  notas?: string;
}

export interface AsignarEmpleadoData {
  empleadoId: string;
}

/**
 * Crear nuevo levantamiento
 */
export const crearLevantamiento = async (
  data: LevantamientoCreate
): Promise<ApiResponse<Levantamiento>> => {
  const response = await axiosInstance.post<ApiResponse<Levantamiento>>('/api/levantamientos', data);
  return response.data;
};

/**
 * Listar levantamientos con filtros y paginación
 */
export const listarLevantamientos = async (
  filters?: LevantamientoFilters
): Promise<ApiResponse<Levantamiento[]>> => {
  const response = await axiosInstance.get<ApiResponse<Levantamiento[]>>('/api/levantamientos', {
    params: filters,
  });
  return response.data;
};

/**
 * Obtener levantamiento por ID
 */
export const obtenerLevantamiento = async (id: string): Promise<ApiResponse<Levantamiento>> => {
  const response = await axiosInstance.get<ApiResponse<Levantamiento>>(`/api/levantamientos/${id}`);
  return response.data;
};

/**
 * Actualizar levantamiento
 */
export const actualizarLevantamiento = async (
  id: string,
  data: Partial<LevantamientoCreate>
): Promise<ApiResponse<Levantamiento>> => {
  const response = await axiosInstance.patch<ApiResponse<Levantamiento>>(
    `/api/levantamientos/${id}`,
    data
  );
  return response.data;
};

/**
 * Cambiar estado del levantamiento
 */
export const cambiarEstadoLevantamiento = async (
  id: string,
  data: CambiarEstadoData
): Promise<ApiResponse<Levantamiento>> => {
  const response = await axiosInstance.patch<ApiResponse<Levantamiento>>(
    `/api/levantamientos/${id}/estado`,
    data
  );
  return response.data;
};

/**
 * Asignar empleado al levantamiento
 */
export const asignarEmpleadoLevantamiento = async (
  id: string,
  data: AsignarEmpleadoData
): Promise<ApiResponse<Levantamiento>> => {
  const response = await axiosInstance.patch<ApiResponse<Levantamiento>>(
    `/api/levantamientos/${id}/asignar`,
    data
  );
  return response.data;
};

/**
 * Eliminar levantamiento
 */
export const eliminarLevantamiento = async (id: string): Promise<ApiResponse<void>> => {
  const response = await axiosInstance.delete<ApiResponse<void>>(`/api/levantamientos/${id}`);
  return response.data;
};

/**
 * Convertir levantamiento a cotización
 */
export const convertirLevantamientoACotizacion = async (
  id: string
): Promise<ApiResponse<any>> => {
  const response = await axiosInstance.post<ApiResponse<any>>(
    `/api/levantamientos/${id}/convertir-cotizacion`
  );
  return response.data;
};
