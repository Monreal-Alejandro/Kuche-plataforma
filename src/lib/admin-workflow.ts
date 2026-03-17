import {
  obtenerKanbanCitas,
  obtenerKanbanDisenos,
  obtenerKanbanCotizacion,
  obtenerKanbanContrato,
  type KanbanItem,
} from "@/lib/axios/kanbanApi";
import type { Usuario } from "@/lib/axios/usuariosApi";
import {
  type EtapaTarea,
  type EstadoTarea,
  type SeguimientoTarea,
} from "@/lib/axios/tareasApi";
import {
  getCotizacionesFormalesList,
  getPreliminarList,
  type FollowUpStatus,
  type KanbanTask,
  type TaskPriority,
  type TaskStage,
  type TaskStatus,
} from "@/lib/kanban";

export type AdminWorkflowTask = KanbanTask & {
  sourceId: string;
  assignedToIds: string[];
  backendSource: "tarea" | "cita";
  scheduledAt?: string;
  sourceCitaId?: string;
  sourceDisenoId?: string;
};

export type AdminWorkflowLoadResult = {
  tasks: AdminWorkflowTask[];
  errors: string[];
};

const stageMap: Record<string, TaskStage> = {
  citas: "citas",
  cita: "citas",
  disenos: "disenos",
  diseño: "disenos",
  diseno: "disenos",
  cotizacion: "cotizacion",
  "cotización": "cotizacion",
  cotizacion_formal: "cotizacion",
  contrato: "contrato",
  seguimiento: "contrato",
};

const statusMap: Record<string, TaskStatus> = {
  pendiente: "pendiente",
  completada: "completada",
  completado: "completada",
  done: "completada",
};

const priorityMap: Record<string, TaskPriority> = {
  alta: "alta",
  media: "media",
  baja: "baja",
};

const followUpMap: Record<string, FollowUpStatus> = {
  pendiente: "pendiente",
  confirmado: "confirmado",
  descartado: "descartado",
};

const ensureStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return [value.trim()];
  }
  return [];
};

const normalizeStage = (value: unknown): TaskStage => {
  if (typeof value !== "string") return "citas";
  return stageMap[value.toLowerCase()] ?? "citas";
};

const normalizeStatus = (value: unknown): TaskStatus => {
  if (typeof value !== "string") return "pendiente";
  return statusMap[value.toLowerCase()] ?? "pendiente";
};

const normalizePriority = (value: unknown): TaskPriority => {
  if (typeof value !== "string") return "media";
  return priorityMap[value.toLowerCase()] ?? "media";
};

const normalizeFollowUpStatus = (value: unknown): FollowUpStatus => {
  if (typeof value !== "string") return "pendiente";
  return followUpMap[value.toLowerCase()] ?? "pendiente";
};

const toTimestamp = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
};

const toBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === "boolean") return value;
  return undefined;
};

const toString = (value: unknown): string | undefined => {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
};

const toIsoString = (value: unknown): string | undefined => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  return undefined;
};

const isCitaCard = (item: KanbanItem) => {
  const candidate = (item.raw ?? item) as Record<string, unknown>;
  return Boolean(
    candidate.fechaAgendada ||
      candidate.nombreCliente ||
      (typeof candidate.cliente === "object" && candidate.cliente !== null),
  );
};

const getCitaClientName = (raw: Record<string, unknown>, fallbackTitle: string) => {
  const cliente = raw.cliente;
  if (typeof cliente === "object" && cliente !== null && "nombre" in cliente) {
    const nombre = toString((cliente as Record<string, unknown>).nombre);
    if (nombre) return nombre;
  }
  return toString(raw.nombreCliente) ?? fallbackTitle;
};

const getAssignedFromCita = (raw: Record<string, unknown>) => {
  const ingeniero = raw.ingenieroAsignado;
  if (typeof ingeniero === "string" && ingeniero.trim().length > 0) {
    return {
      assignedTo: [ingeniero.trim()],
      assignedToIds: [ingeniero.trim()],
    };
  }

  if (typeof ingeniero === "object" && ingeniero !== null) {
    const data = ingeniero as Record<string, unknown>;
    const id = toString(data._id);
    const nombre = toString(data.nombre);
    return {
      assignedTo: nombre ? [nombre] : ["Sin asignar"],
      assignedToIds: id ? [id] : [],
    };
  }

  return {
    assignedTo: ["Sin asignar"],
    assignedToIds: [],
  };
};

const normalizeCitaStatus = (value: unknown): TaskStatus => {
  if (typeof value !== "string") return "pendiente";
  const normalized = value.toLowerCase();
  if (normalized === "completada" || normalized === "cancelada") return "completada";
  return "pendiente";
};

export const getEmployeeName = (employee: Usuario | null | undefined) => employee?.nombre ?? "Sin asignar";

export const getAssignedNames = (task: AdminWorkflowTask): string[] =>
  task.assignedTo.filter((name) => typeof name === "string" && name.trim().length > 0);

export const getAssignedLabel = (task: AdminWorkflowTask) => {
  const names = getAssignedNames(task);
  return names.length > 0 ? names.join(", ") : "Sin asignar";
};

export const isTaskConfirmed = (task: AdminWorkflowTask) => task.followUpStatus === "confirmado";
export const isTaskDiscarded = (task: AdminWorkflowTask) => task.followUpStatus === "descartado";
export const isTaskInProgress = (task: AdminWorkflowTask) => !isTaskConfirmed(task) && !isTaskDiscarded(task);

export const mapKanbanItemToAdminTask = (item: KanbanItem): AdminWorkflowTask => {
  const raw = (item.raw ?? item) as Record<string, unknown>;
  if (isCitaCard(item)) {
    const fallbackTitle = toString((item as unknown as Record<string, unknown>).title) ?? "Cita";
    const clientName = getCitaClientName(raw, fallbackTitle);
    const { assignedTo, assignedToIds } = getAssignedFromCita(raw);
    const scheduledAt = toIsoString(raw.fechaAgendada);
    const citaStatus = normalizeCitaStatus(raw.estado);

    return {
      id: item._id,
      sourceId: item._id,
      title: toString(raw.informacionAdicional) ?? fallbackTitle,
      stage: normalizeStage(raw.etapa ?? item.etapa ?? "citas"),
      status: citaStatus,
      assignedTo,
      assignedToIds,
      project: clientName,
      notes: toString(raw.informacionAdicional) ?? "",
      files: [],
      priority: citaStatus === "completada" ? "alta" : normalizePriority(raw.prioridad ?? raw.priority),
      dueDate: scheduledAt ? scheduledAt.slice(0, 10) : undefined,
      location: toString(raw.ubicacion ?? raw.location),
      mapsUrl: toString(raw.mapsUrl),
      createdAt: toTimestamp(raw.createdAt ?? item.createdAt),
      followUpEnteredAt: undefined,
      followUpStatus: "pendiente",
      citaStarted: typeof raw.estado === "string" ? raw.estado === "en_proceso" || raw.estado === "completada" : false,
      citaFinished: typeof raw.estado === "string" ? raw.estado === "completada" : false,
      designApprovedByAdmin: false,
      designApprovedByClient: false,
      preliminarData: undefined,
      cotizacionFormalData: undefined,
      preliminarCotizaciones: undefined,
      cotizacionesFormales: undefined,
      codigoProyecto: toString(raw.codigoProyecto),
      backendSource: "cita",
      scheduledAt,
      sourceCitaId: toString(raw.sourceCitaId) ?? item._id,
      sourceDisenoId: toString(raw.sourceDisenoId),
    };
  }

  const assignedTo = ensureStringArray(item.asignadoANombre);
  const assignedToIds = ensureStringArray(item.asignadoA);

  return {
    id: item._id,
    sourceId: item._id,
    title: item.titulo,
    stage: normalizeStage(item.etapa),
    status: normalizeStatus(item.estado),
    assignedTo: assignedTo.length > 0 ? assignedTo : ["Sin asignar"],
    assignedToIds,
    project: item.nombreProyecto || item.titulo || "Proyecto sin nombre",
    notes: item.notas || "",
    files: (item.archivos || []).map((file) => ({
      id: file.id,
      name: file.nombre,
      type: file.tipo,
      src: file.url,
    })),
    priority: normalizePriority(raw.prioridad ?? raw.priority),
    dueDate: toString(raw.fechaLimite ?? raw.dueDate),
    location: toString(raw.ubicacion ?? raw.location),
    mapsUrl: toString(raw.mapsUrl),
    createdAt: toTimestamp(item.createdAt),
    followUpEnteredAt: toTimestamp(raw.followUpEnteredAt),
    followUpStatus: normalizeFollowUpStatus(raw.followUpStatus) as SeguimientoTarea,
    citaStarted: toBoolean(raw.citaStarted) ?? false,
    citaFinished: toBoolean(raw.citaFinished) ?? false,
    designApprovedByAdmin: toBoolean(raw.designApprovedByAdmin) ?? false,
    designApprovedByClient: toBoolean(raw.designApprovedByClient) ?? false,
    preliminarData:
      raw.preliminarData && typeof raw.preliminarData === "object"
        ? (raw.preliminarData as KanbanTask["preliminarData"])
        : undefined,
    cotizacionFormalData:
      raw.cotizacionFormalData && typeof raw.cotizacionFormalData === "object"
        ? (raw.cotizacionFormalData as KanbanTask["cotizacionFormalData"])
        : undefined,
    preliminarCotizaciones: Array.isArray(raw.preliminarCotizaciones)
      ? (raw.preliminarCotizaciones as KanbanTask["preliminarCotizaciones"])
      : undefined,
    cotizacionesFormales: Array.isArray(raw.cotizacionesFormales)
      ? (raw.cotizacionesFormales as KanbanTask["cotizacionesFormales"])
      : undefined,
    codigoProyecto: toString(raw.codigoProyecto),
    backendSource: "tarea",
    scheduledAt: undefined,
    sourceCitaId: toString(raw.sourceCitaId),
    sourceDisenoId: toString(raw.sourceDisenoId),
  };
};

export const buildTaskUpdatePayload = (task: AdminWorkflowTask): Partial<KanbanItem> & Record<string, unknown> => ({
  titulo: task.title,
  etapa: task.stage as EtapaTarea,
  estado: task.status as EstadoTarea,
  asignadoA: task.assignedToIds,
  nombreProyecto: task.project,
  notas: task.notes ?? "",
  prioridad: task.priority ?? "media",
  fechaLimite: task.dueDate,
  ubicacion: task.location,
  mapsUrl: task.mapsUrl,
  followUpEnteredAt: task.followUpEnteredAt,
  followUpStatus: task.followUpStatus ?? "pendiente",
  citaStarted: task.citaStarted ?? false,
  citaFinished: task.citaFinished ?? false,
  designApprovedByAdmin: task.designApprovedByAdmin ?? false,
  designApprovedByClient: task.designApprovedByClient ?? false,
  preliminarData: task.preliminarData,
  cotizacionFormalData: task.cotizacionFormalData,
  preliminarCotizaciones: getPreliminarList(task),
  cotizacionesFormales: getCotizacionesFormalesList(task),
  codigoProyecto: task.codigoProyecto,
});

export async function fetchAdminWorkflowTasksSequentially(): Promise<AdminWorkflowLoadResult> {
  const requests: Array<{ label: string; load: () => Promise<{ success: boolean; data?: KanbanItem[]; message?: string }> }> = [
    { label: "citas", load: obtenerKanbanCitas },
    { label: "disenos", load: obtenerKanbanDisenos },
    { label: "cotizacion", load: obtenerKanbanCotizacion },
    { label: "contrato", load: obtenerKanbanContrato },
  ];

  const tasks: AdminWorkflowTask[] = [];
  const errors: string[] = [];

  for (const request of requests) {
    try {
      const response = await request.load();
      if (response.success && response.data) {
        tasks.push(...response.data.map(mapKanbanItemToAdminTask));
      } else if (response.message) {
        errors.push(`${request.label}: ${response.message}`);
      }
    } catch (error) {
      errors.push(
        `${request.label}: ${error instanceof Error ? error.message : "Error desconocido"}`,
      );
    }
  }

  return { tasks, errors };
}
