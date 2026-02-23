/**
 * API de Citas
 * Endpoints para gestión de citas de levantamiento
 */

import axiosInstance, { ApiResponse } from './axiosConfig';

// Tipos de datos para Citas
export interface ClienteCita {
  nombre: string;
  correo: string;
  telefono: string;
}

export interface EspecificacionesInicio {
  medidas?: string;
  estilo?: string;
  especificaciones?: string;
  materialesPreferidos?: string[];
}

export interface CitaCreate {
  fechaAgendada: Date | string | number;
  nombreCliente: string;
  correoCliente: string;
  telefonoCliente: string;
  ubicacion?: string;
  diseno?: string;
  informacionAdicional?: string;
}

export interface Cita {
  _id: string;
  fechaAgendada: string;
  fechaInicio?: string;
  fechaTermino?: string;
  nombreCliente: string;
  correoCliente: string;
  telefonoCliente: string;
  ubicacion?: string;
  diseno?: {
    _id: string;
    nombre: string;
    descripcion?: string;
    imagenes?: string[];
  };
  informacionAdicional?: string;
  estado: 'programada' | 'en_proceso' | 'completada' | 'cancelada';
  ingenieroAsignado?: {
    _id: string;
    nombre: string;
    correo: string;
    telefono?: string;
    rol: string;
  } | string;
  especificacionesInicio: EspecificacionesInicio;
  createdAt: string;
  updatedAt: string;
}

export interface CitaUpdate {
  fechaAgendada?: Date | string | number;
  fechaInicio?: Date | string | number;
  fechaTermino?: Date | string | number;
  nombreCliente?: string;
  correoCliente?: string;
  telefonoCliente?: string;
  ubicacion?: string;
  informacionAdicional?: string;
  estado?: 'programada' | 'en_proceso' | 'completada' | 'cancelada';
  diseno?: string;
  ingenieroAsignado?: string;
}

export interface AsignarIngenieroData {
  ingenieroId?: string;
}

export interface IniciarCitaData {
  medidas?: string;
  estilo?: string;
  especificaciones?: string;
  materialesPreferidos?: string[];
}

export interface FinalizarCitaData {
  ingenieroId?: string;
  fechaEstimadaFinalizacion?: Date | string;
  notasInternas?: string;
}

export interface ActualizarEstadoData {
  estado: 'programada' | 'en_proceso' | 'completada' | 'cancelada';
  fechaTermino?: Date | string;
}

/**
 * Crear nueva cita (PÚBLICA - No requiere autenticación)
 */
export const crearCita = async (data: CitaCreate): Promise<ApiResponse<Cita>> => {
  const response = await axiosInstance.post<ApiResponse<Cita>>('/api/citas/agregarCita', data);
  return response.data;
};

/**
 * Obtener todas las citas (Admin)
 */
export const obtenerTodasLasCitas = async (): Promise<ApiResponse<Cita[]>> => {
  try {
    const response = await axiosInstance.get('/api/citas/getAllCitas');
    
    // Si la respuesta es directamente un array (respuesta del backend)
    if (Array.isArray(response.data)) {
      return {
        success: true,
        data: response.data
      };
    }
    
    // Si ya viene con el formato ApiResponse
    return response.data;
  } catch (error) {
    console.error('Error en obtenerTodasLasCitas:', error);
    return {
      success: false,
      message: 'Error al obtener las citas',
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};

/**
 * Obtener citas del usuario autenticado
 */
export const obtenerCitas = async (): Promise<ApiResponse<Cita[]>> => {
  try {
    const response = await axiosInstance.get('/api/citas/verCitas');
    
    // Si la respuesta es directamente un array
    if (Array.isArray(response.data)) {
      return {
        success: true,
        data: response.data
      };
    }
    
    // Si ya viene con el formato ApiResponse
    return response.data;
  } catch (error) {
    console.error('Error en obtenerCitas:', error);
    return {
      success: false,
      message: 'Error al obtener las citas',
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};

/**
 * Obtener citas asignadas al ingeniero autenticado
 */
export const obtenerCitasIngeniero = async (): Promise<ApiResponse<{ message: string; total: number; citas: Cita[] }>> => {
  try {
    const response = await axiosInstance.get('/api/citas/misCitas');
    
    // Si la respuesta tiene la estructura esperada
    if (response.data && typeof response.data === 'object' && 'citas' in response.data) {
      return {
        success: true,
        data: response.data
      };
    }
    
    // Si ya viene con el formato ApiResponse
    return response.data;
  } catch (error) {
    console.error('Error en obtenerCitasIngeniero:', error);
    return {
      success: false,
      message: 'Error al obtener las citas del ingeniero',
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};

/**
 * Obtener citas por correo del cliente
 */
export const obtenerCitasPorCliente = async (correo: string): Promise<ApiResponse<Cita[]>> => {
  try {
    const response = await axiosInstance.get('/api/citas/porCliente', {
      params: { correo }
    });
    
    // Si la respuesta es directamente un array
    if (Array.isArray(response.data)) {
      return {
        success: true,
        data: response.data
      };
    }
    
    // Si ya viene con el formato ApiResponse
    return response.data;
  } catch (error) {
    console.error('Error en obtenerCitasPorCliente:', error);
    return {
      success: false,
      message: 'Error al obtener las citas del cliente',
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};

/**
 * Obtener cita por ID
 */
export const obtenerCita = async (id: string): Promise<ApiResponse<Cita>> => {
  try {
    const response = await axiosInstance.get(`/api/citas/verCita/${id}`);
    
    // Si la respuesta es directamente una cita
    if (response.data && response.data._id) {
      return {
        success: true,
        data: response.data
      };
    }
    
    // Si ya viene con el formato ApiResponse
    return response.data;
  } catch (error) {
    console.error('Error en obtenerCita:', error);
    return {
      success: false,
      message: 'Error al obtener la cita',
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};

/**
 * Actualizar cita
 */
export const actualizarCita = async (id: string, data: CitaUpdate): Promise<ApiResponse<Cita>> => {
  try {
    const response = await axiosInstance.put(`/api/citas/actualizarCita/${id}`, data);
    
    // Si la respuesta es directamente una cita
    if (response.data && response.data._id) {
      return {
        success: true,
        data: response.data
      };
    }
    
    // Si ya viene con el formato ApiResponse
    return response.data;
  } catch (error) {
    console.error('Error en actualizarCita:', error);
    return {
      success: false,
      message: 'Error al actualizar la cita',
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};

/**
 * Asignar ingeniero a una cita (Solo admin)
 */
export const asignarIngeniero = async (
  id: string,
  data: AsignarIngenieroData
): Promise<ApiResponse<{ message: string; cita: Cita }>> => {
  const response = await axiosInstance.put<ApiResponse<{ message: string; cita: Cita }>>(
    `/api/citas/${id}/asignarIngeniero`,
    data
  );
  return response.data;
};

/**
 * Cancelar cita
 */
export const cancelarCita = async (id: string): Promise<ApiResponse<{ message: string; cita: Cita }>> => {
  const response = await axiosInstance.post<ApiResponse<{ message: string; cita: Cita }>>(
    `/api/citas/${id}/cancel`
  );
  return response.data;
};

/**
 * Iniciar cita (cambia estado a en_proceso)
 */
export const iniciarCita = async (
  id: string,
  data?: IniciarCitaData
): Promise<ApiResponse<{ message: string; cita: Cita }>> => {
  const response = await axiosInstance.put<ApiResponse<{ message: string; cita: Cita }>>(
    `/api/citas/${id}/iniciar`,
    data || {}
  );
  return response.data;
};

/**
 * Actualizar especificaciones de una cita (solo ingeniero asignado)
 */
export const actualizarEspecificaciones = async (
  id: string,
  data: IniciarCitaData
): Promise<ApiResponse<{ message: string; cita: Cita }>> => {
  const response = await axiosInstance.put<ApiResponse<{ message: string; cita: Cita }>>(
    `/api/citas/${id}/especificaciones`,
    data
  );
  return response.data;
};

/**
 * Finalizar cita (cambia estado a completada y crea orden de trabajo)
 */
export const finalizarCita = async (
  id: string,
  data?: FinalizarCitaData
): Promise<ApiResponse<{ message: string; cita: Cita; ordenTrabajo: any }>> => {
  const response = await axiosInstance.put<ApiResponse<{ message: string; cita: Cita; ordenTrabajo: any }>>(
    `/api/citas/${id}/finalizar`,
    data || {}
  );
  return response.data;
};

/**
 * Actualizar estado de cita
 */
export const actualizarEstadoCita = async (
  id: string,
  data: ActualizarEstadoData
): Promise<ApiResponse<Cita>> => {
  const response = await axiosInstance.put<ApiResponse<Cita>>(`/api/citas/updateEstado/${id}`, data);
  return response.data;
};

/**
 * Eliminar cita
 */
export const eliminarCita = async (id: string): Promise<ApiResponse<{ message: string }>> => {
  const response = await axiosInstance.delete<ApiResponse<{ message: string }>>(
    `/api/citas/eliminarCita/${id}`
  );
  return response.data;
};
