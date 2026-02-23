/**
 * API de Catálogos
 * Endpoints para obtener catálogos de materiales, herrajes y otras opciones
 */

import axiosInstance, { ApiResponse } from './axiosConfig';

// Tipos de datos para Catálogos
export interface Material {
  _id: string;
  id: string;
  nombre: string;
  precioMetroLineal: number;
  descripcion?: string;
  activo: boolean;
}

export interface Herraje {
  _id: string;
  id: string;
  nombre: string;
  precioUnitario: number;
  descripcion?: string;
  categoria?: string;
  activo: boolean;
}

/**
 * Obtener catálogo de materiales base
 */
export const obtenerMateriales = async (): Promise<ApiResponse<Material[]>> => {
  const response = await axiosInstance.get<ApiResponse<Material[]>>('/api/catalogos/materiales');
  return response.data;
};

/**
 * Obtener catálogo de herrajes
 */
export const obtenerHerrajes = async (): Promise<ApiResponse<Herraje[]>> => {
  const response = await axiosInstance.get<ApiResponse<Herraje[]>>('/api/catalogos/herrajes');
  return response.data;
};

/**
 * Obtener lista de colores/texturas disponibles
 */
export const obtenerColores = async (): Promise<ApiResponse<string[]>> => {
  const response = await axiosInstance.get<ApiResponse<string[]>>('/api/catalogos/colores');
  return response.data;
};

/**
 * Obtener tipos de proyecto disponibles
 */
export const obtenerTiposProyecto = async (): Promise<ApiResponse<string[]>> => {
  const response = await axiosInstance.get<ApiResponse<string[]>>('/api/catalogos/tipos-proyecto');
  return response.data;
};

/**
 * Obtener tipos de cubierta disponibles
 */
export const obtenerTiposCubierta = async (): Promise<ApiResponse<string[]>> => {
  const response = await axiosInstance.get<ApiResponse<string[]>>('/api/catalogos/tipos-cubierta');
  return response.data;
};
