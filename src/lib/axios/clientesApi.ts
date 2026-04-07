import axiosInstance, { type ApiResponse } from "./axiosConfig";

export type ClienteResumen = {
  _id: string;
  codigo: string;
  nombre: string;
  correo: string;
  telefono: string;
  createdAt: string;
  updatedAt: string;
};

export type PanelClienteProyecto = {
  _id: string;
  nombre: string;
  clienteRef: string | null;
  clienteId: string;
  nombreCliente: string;
  tipo: string;
  estado: string;
  timelineActual: string;
  presupuestoTotal: number;
  anticipo: number;
  segundoPago: number;
  liquidacion: number;
  empleadoAsignado: string | null;
  nombreEmpleadoAsignado: string;
  createdAt: string;
  updatedAt: string;
};

export type PanelClienteTarea = {
  _id: string;
  etapa: string;
  estado: string;
  proyectoId: string | null;
  nombreProyecto: string;
  prioridad: string;
  followUpStatus: string;
  cliente: {
    nombre: string;
    correo: string;
    telefono: string;
  };
  clienteRef: string | null;
  clienteId: string;
  createdAt: string;
  updatedAt: string;
};

export type PanelClienteCita = {
  _id: string;
  fechaAgendada: string;
  nombreCliente: string;
  correoCliente: string;
  telefonoCliente: string;
  clienteRef: string | null;
  clienteId: string;
  estado: string;
  ubicacion: string;
  informacionAdicional: string;
  ingenieroAsignado: string | null;
  nombreIngenieroAsignado: string;
  createdAt: string;
  updatedAt: string;
};

export type PanelClienteResponse = {
  cliente: ClienteResumen;
  resumen: {
    totalProyectos: number;
    totalTareas: number;
    totalCitas: number;
  };
  proyectos: PanelClienteProyecto[];
  tareas: PanelClienteTarea[];
  citas: PanelClienteCita[];
};

const normalizeCodigo = (value: string) => value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6);

const normalizeApiResponse = <T,>(data: unknown): ApiResponse<T> => {
  if (data && typeof data === "object" && "success" in data) {
    return data as ApiResponse<T>;
  }

  return {
    success: true,
    data: data as T,
  };
};

export const buscarCodigoCliente = async (
  params: { correo?: string; telefono?: string },
): Promise<ApiResponse<ClienteResumen>> => {
  const response = await axiosInstance.get<ApiResponse<ClienteResumen>>("/api/clientes/buscar-codigo", {
    params: {
      correo: params.correo?.trim() || undefined,
      telefono: params.telefono?.trim() || undefined,
    },
  });

  return normalizeApiResponse<ClienteResumen>(response.data);
};

export const obtenerPanelCliente = async (
  codigo: string,
): Promise<ApiResponse<PanelClienteResponse>> => {
  const normalized = normalizeCodigo(codigo);
  const response = await axiosInstance.get<ApiResponse<PanelClienteResponse>>(
    `/api/clientes/panel/${normalized}`,
  );

  return normalizeApiResponse<PanelClienteResponse>(response.data);
};