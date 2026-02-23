/**
 * Punto de entrada principal para todas las APIs
 * Exporta todas las funciones de API organizadas por módulo
 */

// Exportar configuración y tipos base
export { default as axiosInstance } from './axiosConfig';
export type { ApiResponse, ApiSuccessResponse, ApiErrorResponse } from './axiosConfig';

// Exportar APIs de autenticación
export * as authApi from './authApi';
export type {
  LoginCredentials,
  RegisterData,
  User,
  AuthResponse,
} from './authApi';

// Exportar APIs de levantamientos
export * as levantamientosApi from './levantamientosApi';
export type {
  ClienteLevantamiento,
  LevantamientoCreate,
  Levantamiento,
  HistorialEstado,
  LevantamientoFilters,
  CambiarEstadoData,
  AsignarEmpleadoData,
} from './levantamientosApi';

// Exportar APIs de cotizaciones
export * as cotizacionesApi from './cotizacionesApi';
export type {
  Medidas,
  HerrajeItem,
  CotizacionCreate,
  Cotizacion,
  HistorialEstadoCotizacion,
  CotizacionFilters,
  CambiarEstadoCotizacionData,
  CotizadorConfig,
} from './cotizacionesApi';

// Exportar APIs de catálogos
export * as catalogosApi from './catalogosApi';
export type {
  Material,
  Herraje,
} from './catalogosApi';

// Exportar APIs de usuarios
export * as usuariosApi from './usuariosApi';
export type {
  Usuario,
} from './usuariosApi';

// Exportar APIs de citas
export * as citasApi from './citasApi';
export type {
  ClienteCita,
  EspecificacionesInicio,
  CitaCreate,
  Cita,
  CitaUpdate,
  AsignarIngenieroData,
  IniciarCitaData,
  FinalizarCitaData,
  ActualizarEstadoData,
} from './citasApi';
