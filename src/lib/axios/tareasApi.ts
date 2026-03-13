/**
 * API de Tareas
 * Endpoints para gestión del tablero Kanban de tareas
 * 
 * Backend URL: http://localhost:3001/api/tareas
 * Estado: ✅ Implementado y funcionando
 */

import axiosInstance, { ApiResponse } from './axiosConfig';

/* ========================================================================
   TYPES & INTERFACES
   ======================================================================== */

export interface ArchivoTarea {
  id: string;
  nombre: string;
  tipo: "pdf" | "render" | "otro";
  url?: string;
  createdAt?: Date;
}

export interface Tarea {
  _id: string;
  titulo: string;
  etapa: "citas" | "disenos" | "cotizacion" | "contrato";
  estado: "pendiente" | "completada";
  asignadoA: string;              // ID del usuario
  asignadoANombre: string;        // Nombre del usuario (populado por backend)
  proyecto: string;               // ID del proyecto
  nombreProyecto: string;         // Nombre del proyecto (populado por backend)
  notas?: string;
  archivos?: ArchivoTarea[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CrearTareaData {
  titulo: string;
  etapa: "citas" | "disenos" | "cotizacion" | "contrato";
  estado?: "pendiente" | "completada";
  asignadoA: string;  // ID del usuario
  proyecto: string;   // ID del proyecto
  notas?: string;
}

export interface ActualizarTareaData {
  titulo?: string;
  etapa?: "citas" | "disenos" | "cotizacion" | "contrato";
  estado?: "pendiente" | "completada";
  asignadoA?: string;
  notas?: string;
}

export interface FiltrosTareas {
  etapa?: string;
  stage?: string;
  estado?: string;
  asignadoA?: string;
  proyecto?: string;
}

/* ========================================================================
   API FUNCTIONS
   ======================================================================== */

/**
 * Obtener todas las tareas con filtros opcionales
 * @param filtros - Filtros opcionales (etapa, estado, asignadoA, proyecto)
 * @returns Promise con array de tareas
 */
export const obtenerTareas = async (
  filtros?: FiltrosTareas
): Promise<ApiResponse<Tarea[]>> => {
  const response = await axiosInstance.get<ApiResponse<Tarea[]>>('/api/tareas', {
    params: filtros,
  });
  return response.data;
};

/**
 * Obtener una tarea por ID
 * @param id - ID de la tarea
 * @returns Promise con la tarea
 */
export const obtenerTarea = async (id: string): Promise<ApiResponse<Tarea>> => {
  const response = await axiosInstance.get<ApiResponse<Tarea>>(`/api/tareas/${id}`);
  return response.data;
};

/**
 * Crear nueva tarea
 * @param data - Datos de la tarea a crear
 * @returns Promise con la tarea creada
 */
export const crearTarea = async (
  data: CrearTareaData
): Promise<ApiResponse<Tarea>> => {
  const response = await axiosInstance.post<ApiResponse<Tarea>>('/api/tareas', data);
  return response.data;
};

/**
 * Actualizar tarea completa
 * @param id - ID de la tarea
 * @param data - Datos a actualizar
 * @returns Promise con la tarea actualizada
 */
export const actualizarTarea = async (
  id: string,
  data: ActualizarTareaData
): Promise<ApiResponse<Tarea>> => {
  const response = await axiosInstance.put<ApiResponse<Tarea>>(`/api/tareas/${id}`, data);
  return response.data;
};

/**
 * Cambiar etapa de una tarea (para drag & drop en Kanban)
 * @param id - ID de la tarea
 * @param etapa - Nueva etapa
 * @returns Promise con la tarea actualizada
 */
export const cambiarEtapa = async (
  id: string,
  etapa: "citas" | "disenos" | "cotizacion" | "contrato"
): Promise<ApiResponse<Tarea>> => {
  const response = await axiosInstance.patch<ApiResponse<Tarea>>(
    `/api/tareas/${id}/etapa`,
    { etapa }
  );
  return response.data;
};

/**
 * Cambiar estado de una tarea (pendiente/completada)
 * @param id - ID de la tarea
 * @param estado - Nuevo estado
 * @returns Promise con la tarea actualizada
 */
export const cambiarEstado = async (
  id: string,
  estado: "pendiente" | "completada"
): Promise<ApiResponse<Tarea>> => {
  const response = await axiosInstance.patch<ApiResponse<Tarea>>(
    `/api/tareas/${id}/estado`,
    { estado }
  );
  return response.data;
};

/**
 * Agregar archivos a una tarea
 * @param id - ID de la tarea
 * @param archivos - Array de archivos a agregar
 * @returns Promise con la tarea actualizada
 */
export const agregarArchivos = async (
  id: string,
  archivos: Array<{ nombre: string; tipo: string; url: string }>
): Promise<ApiResponse<Tarea>> => {
  const response = await axiosInstance.post<ApiResponse<Tarea>>(
    `/api/tareas/${id}/archivos`,
    { archivos }
  );
  return response.data;
};

/**
 * Eliminar tarea
 * @param id - ID de la tarea a eliminar
 * @returns Promise con respuesta de éxito
 */
export const eliminarTarea = async (id: string): Promise<ApiResponse<null>> => {
  const response = await axiosInstance.delete<ApiResponse<null>>(`/api/tareas/${id}`);
  return response.data;
};
