/**
 * API de Cotizaciones
 * Endpoints para cotizaciones detalladas con especificaciones técnicas
 */

import axiosInstance, { ApiResponse } from './axiosConfig';

// Tipos de datos para Cotización
export interface Medidas {
  largo: number;
  alto: number;
  fondo: number;
  metrosLineales: number;
}

export interface HerrajeItem {
  herrajeId?: string;
  nombre: string;
  precioUnitario: number;
  enabled: boolean;
  cantidad: number;
}

export interface CotizacionCreate {
  cliente: string;
  clienteRef?: string;
  tipoProyecto: 'Cocina' | 'Closet' | 'vestidor' | 'Mueble para el baño';
  ubicacion: string;
  fechaInstalacion: string;
  medidas: Medidas;
  escenarioSeleccionado?: 'esencial' | 'tendencia' | 'premium';
  materialBase: 'melamina' | 'mdf' | 'tech';
  colorTextura: 'Blanco Nieve' | 'Nogal Calido' | 'Gris Grafito' | 'Fresno Arena';
  grosorTablero?: '16' | '19';
  herrajes?: HerrajeItem[];
  manoDeObra?: number;
  flete?: number;
  instalacion?: number;
  desinstalacion?: number;
  notas?: string;
}

export interface Cotizacion extends CotizacionCreate {
  _id: string;
  materialBaseRef?: string;
  precioMaterialPorMetro: number;
  multiplicadorEscenario?: number;
  factorGrosor: number;
  subtotalMateriales: number;
  subtotalHerrajes: number;
  subtotalManoObra: number;
  precioFinal: number;
  estado: 'borrador' | 'enviada' | 'aprobada' | 'en_produccion' | 'lista_instalacion' | 'instalada' | 'rechazada' | 'archivada';
  historialEstados: HistorialEstadoCotizacion[];
  empleadoAsignado?: string;
  origenLevantamiento?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HistorialEstadoCotizacion {
  estado: string;
  fecha: string;
  usuario: string;
  notas?: string;
}

export interface CotizacionFilters {
  estado?: string;
  tipoProyecto?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  page?: number;
  limit?: number;
}

export interface CambiarEstadoCotizacionData {
  estado: 'borrador' | 'enviada' | 'aprobada' | 'en_produccion' | 'lista_instalacion' | 'instalada' | 'rechazada' | 'archivada';
  notas?: string;
}

export interface CotizadorConfig {
  projectTypes: string[];
  baseMaterials: Array<{
    id: string;
    label: string;
    pricePerMeter: number;
  }>;
  scenarios: Array<{
    id: string;
    title: string;
    subtitle: string;
    multiplier: number;
    image: string;
    tags: string[];
  }>;
  materialColors: string[];
  hardwareCatalog: Array<{
    id: string;
    label: string;
    unitPrice: number;
  }>;
}

/**
 * Obtener configuración del cotizador (PÚBLICA - no requiere auth)
 */
export const obtenerConfigCotizador = async (): Promise<ApiResponse<CotizadorConfig>> => {
  const response = await axiosInstance.get<ApiResponse<CotizadorConfig>>('/api/cotizaciones/config');
  return response.data;
};

/**
 * Crear nueva cotización
 */
export const crearCotizacion = async (
  data: CotizacionCreate
): Promise<ApiResponse<Cotizacion>> => {
  const response = await axiosInstance.post<ApiResponse<Cotizacion>>('/api/cotizaciones', data);
  return response.data;
};

/**
 * Guardar cotización como borrador
 */
export const guardarBorrador = async (
  data: CotizacionCreate
): Promise<ApiResponse<Cotizacion>> => {
  const response = await axiosInstance.post<ApiResponse<Cotizacion>>('/api/cotizaciones/borrador', data);
  return response.data;
};

/**
 * Listar cotizaciones con filtros y paginación
 */
export const listarCotizaciones = async (
  filters?: CotizacionFilters
): Promise<ApiResponse<Cotizacion[]>> => {
  const response = await axiosInstance.get<ApiResponse<Cotizacion[]>>('/api/cotizaciones', {
    params: filters,
  });
  return response.data;
};

/**
 * Obtener cotización por ID
 */
export const obtenerCotizacion = async (id: string): Promise<ApiResponse<Cotizacion>> => {
  const response = await axiosInstance.get<ApiResponse<Cotizacion>>(`/api/cotizaciones/${id}`);
  return response.data;
};

/**
 * Actualizar cotización
 */
export const actualizarCotizacion = async (
  id: string,
  data: Partial<CotizacionCreate>
): Promise<ApiResponse<Cotizacion>> => {
  const response = await axiosInstance.patch<ApiResponse<Cotizacion>>(
    `/api/cotizaciones/${id}`,
    data
  );
  return response.data;
};

/**
 * Cambiar estado de la cotización
 */
export const cambiarEstadoCotizacion = async (
  id: string,
  data: CambiarEstadoCotizacionData
): Promise<ApiResponse<Cotizacion>> => {
  const response = await axiosInstance.patch<ApiResponse<Cotizacion>>(
    `/api/cotizaciones/${id}/estado`,
    data
  );
  return response.data;
};

/**
 * Eliminar cotización
 */
export const eliminarCotizacion = async (id: string): Promise<ApiResponse<void>> => {
  const response = await axiosInstance.delete<ApiResponse<void>>(`/api/cotizaciones/${id}`);
  return response.data;
};

/**
 * Generar PDF para cliente
 */
export const generarPDFCliente = async (id: string): Promise<ApiResponse<any>> => {
  const response = await axiosInstance.post<ApiResponse<any>>(`/api/cotizaciones/${id}/pdf-cliente`);
  return response.data;
};

/**
 * Generar hoja de taller
 */
export const generarHojaTaller = async (id: string): Promise<ApiResponse<any>> => {
  const response = await axiosInstance.post<ApiResponse<any>>(`/api/cotizaciones/${id}/hoja-taller`);
  return response.data;
};
