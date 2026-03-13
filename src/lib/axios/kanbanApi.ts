import axiosInstance, { type ApiResponse } from './axiosConfig';
import { obtenerTareas, type Tarea } from './tareasApi';

export interface KanbanItem extends Tarea {
  raw?: Record<string, unknown>;
}

const getKanbanColumn = async (endpoint: string, fallbackStage: string): Promise<ApiResponse<KanbanItem[]>> => {
  try {
    const response = await axiosInstance.get<ApiResponse<KanbanItem[]>>(endpoint, {
      headers: {
        Accept: 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.warn(`Fallo ${endpoint}, usando fallback /api/tareas?etapa=${fallbackStage}`, error);
    return obtenerTareas({ etapa: fallbackStage }) as Promise<ApiResponse<KanbanItem[]>>;
  }
};

export const obtenerKanbanCitas = async (): Promise<ApiResponse<KanbanItem[]>> =>
  getKanbanColumn('/api/kanban/citas', 'citas');

export const obtenerKanbanDisenos = async (): Promise<ApiResponse<KanbanItem[]>> =>
  getKanbanColumn('/api/kanban/disenos', 'disenos');

export const obtenerKanbanCotizacion = async (): Promise<ApiResponse<KanbanItem[]>> =>
  getKanbanColumn('/api/kanban/cotizacion', 'cotizacion');

export const obtenerKanbanContrato = async (): Promise<ApiResponse<KanbanItem[]>> =>
  getKanbanColumn('/api/kanban/contrato', 'contrato');

export const actualizarDisenoKanban = async (
  id: string,
  data: Record<string, unknown>,
): Promise<ApiResponse<Record<string, unknown>>> => {
  const response = await axiosInstance.put<ApiResponse<Record<string, unknown>>>(`/api/disenos/${id}`, data, {
    headers: { Accept: 'application/json' },
  });
  return response.data;
};

export const actualizarCotizacionKanban = async (
  id: string,
  data: Record<string, unknown>,
): Promise<ApiResponse<Record<string, unknown>>> => {
  const response = await axiosInstance.put<ApiResponse<Record<string, unknown>>>(`/api/cotizaciones/${id}`, data, {
    headers: { Accept: 'application/json' },
  });
  return response.data;
};

export const actualizarProyectoKanban = async (
  id: string,
  data: Record<string, unknown>,
): Promise<ApiResponse<Record<string, unknown>>> => {
  const response = await axiosInstance.put<ApiResponse<Record<string, unknown>>>(`/api/proyectos/${id}`, data, {
    headers: { Accept: 'application/json' },
  });
  return response.data;
};