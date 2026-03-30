import { fetchAdminWorkflowTasksSequentially, type AdminWorkflowTask, type AdminWorkflowLoadResult } from "@/lib/admin-workflow";
import axiosInstance from "@/lib/axios/axiosConfig";
import {
  actualizarCita,
  actualizarEstadoCita,
  asignarIngeniero,
  eliminarCita,
  type ActualizarEstadoData,
  type CitaUpdate,
} from "@/lib/axios/citasApi";
import {
  actualizarTarea,
  cambiarEtapa,
  crearTarea,
  eliminarTarea,
  type ActualizarTareaData,
  type CrearTareaData,
  type EtapaTarea,
} from "@/lib/axios/tareasApi";
import type { TaskStage } from "@/lib/kanban";

const stageToEtapa = (stage: TaskStage): EtapaTarea => stage;

export const cargarTableroAdmin = async (): Promise<AdminWorkflowLoadResult> => {
  return fetchAdminWorkflowTasksSequentially();
};

export const obtenerAlertasSeguimiento = async (dias = 3): Promise<number> => {
  const response = await axiosInstance.get<{ success: boolean; data?: { count?: number } }>(
    "/api/kanban/seguimiento/alertas",
    { params: { dias } },
  );

  if (!response.data?.success) {
    return 0;
  }

  return Number(response.data?.data?.count ?? 0);
};

export const moverTarjetaTarea = async (taskId: string, stage: TaskStage) => {
  const etapa = stageToEtapa(stage);
  const stageResponse = await cambiarEtapa(taskId, etapa).catch(() => null);
  if (stageResponse?.success) return stageResponse;
  return actualizarTarea(taskId, { etapa });
};

export const crearTareaWorkflow = async (data: CrearTareaData) => {
  return crearTarea(data);
};

export const actualizarTarjetaTarea = async (taskId: string, data: ActualizarTareaData) => {
  return actualizarTarea(taskId, data);
};

export const eliminarTarjetaTarea = async (taskId: string) => {
  return eliminarTarea(taskId);
};

export const actualizarTarjetaCita = async (
  citaId: string,
  payload: {
    cita?: CitaUpdate;
    ingenieroId?: string;
    estado?: ActualizarEstadoData["estado"];
  },
) => {
  if (payload.cita) {
    const citaResponse = await actualizarCita(citaId, payload.cita);
    if (!citaResponse.success) return citaResponse;
  }

  if (payload.ingenieroId !== undefined) {
    const asignacionResponse = await asignarIngeniero(citaId, { ingenieroId: payload.ingenieroId || undefined });
    if (!asignacionResponse.success) return asignacionResponse;
  }

  if (payload.estado) {
    return actualizarEstadoCita(citaId, { estado: payload.estado });
  }

  return { success: true };
};

export const eliminarTarjetaCita = async (citaId: string) => {
  return eliminarCita(citaId);
};

export const promoverCitaATarea = async (task: AdminWorkflowTask, stageDestino: Exclude<TaskStage, "citas">) => {
  const sourceCitaId = task.sourceId ?? task.sourceCitaId;

  try {
    const promotedResponse = await axiosInstance.post<{ success: boolean; message?: string }>(
      `/api/workflow/citas/${sourceCitaId}/promover`,
      { etapaDestino: stageDestino },
    );

    if (promotedResponse.data?.success) {
      return promotedResponse.data;
    }
  } catch (error: unknown) {
    const status =
      typeof error === "object" &&
      error !== null &&
      "response" in error &&
      typeof (error as { response?: { status?: number } }).response?.status === "number"
        ? (error as { response?: { status?: number } }).response?.status
        : undefined;

    if (status !== 404) {
      throw error;
    }
  }

  const createResponse = await crearTarea({
    titulo: task.title || task.project,
    proyecto: task.project || task.title,
    nombreProyecto: task.project || task.title,
    etapa: stageDestino,
    estado: task.status,
    asignadoA: task.assignedToIds,
    notas: task.notes,
    prioridad: task.priority,
    fechaLimite: task.dueDate,
    ubicacion: task.location,
    mapsUrl: task.mapsUrl,
    followUpEnteredAt: task.followUpEnteredAt,
    followUpStatus: task.followUpStatus,
    citaStarted: task.citaStarted,
    citaFinished: true,
    designApprovedByAdmin: task.designApprovedByAdmin,
    designApprovedByClient: task.designApprovedByClient,
    preliminarData: task.preliminarData,
    cotizacionFormalData: task.cotizacionFormalData,
    preliminarCotizaciones: task.preliminarCotizaciones,
    cotizacionesFormales: task.cotizacionesFormales,
    codigoProyecto: task.codigoProyecto,
  });

  if (!createResponse.success) {
    return createResponse;
  }

  await actualizarEstadoCita(sourceCitaId, { estado: "completada" });
  return createResponse;
};