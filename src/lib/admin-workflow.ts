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
  visita?: {
    fechaProgramada?: string;
    aprobadaPorAdmin?: boolean;
    aprobadaPorCliente?: boolean;
  };
  sourceType?: "cita" | "diseno" | null;
  cita?: {
    fechaAgendada?: string;
    nombreCliente?: string;
    correoCliente?: string;
    telefonoCliente?: string;
    ubicacion?: string;
    informacionAdicional?: string;
  };
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
  // Compatibilidad con payloads legacy del backend/BD.
  descartado: "inactivo",
  inactivo: "inactivo",
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

const extractVisitaPayload = (raw: Record<string, unknown>) => {
  const visita = asRecord(raw.visita);
  if (!visita) return null;
  return {
    fechaProgramada: toIsoString(visita.fechaProgramada),
    aprobadaPorAdmin: toBoolean(visita.aprobadaPorAdmin),
    aprobadaPorCliente: toBoolean(visita.aprobadaPorCliente),
  };
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;

const extractCitaPayload = (raw: Record<string, unknown>) => {
  const fromNested = asRecord(raw.cita);
  if (fromNested) return fromNested;

  if (raw.fechaAgendada || raw.nombreCliente || raw.correoCliente || raw.telefonoCliente || raw.ubicacion) {
    return raw;
  }

  return null;
};

const isCitaCard = (item: KanbanItem, raw: Record<string, unknown>, citaPayload: Record<string, unknown> | null) => {
  const sourceType = toString(raw.sourceType)?.toLowerCase();
  if (sourceType === "cita") return true;

  return Boolean(
    citaPayload &&
      (item.etapa === "citas" || toString(raw.etapa)?.toLowerCase() === "citas" || raw.sourceCitaId),
  );
};

const getCitaClientName = (
  raw: Record<string, unknown>,
  citaPayload: Record<string, unknown> | null,
  fallbackTitle: string,
) => {
  const cliente = citaPayload?.cliente ?? raw.cliente;
  if (typeof cliente === "object" && cliente !== null && "nombre" in cliente) {
    const nombre = toString((cliente as Record<string, unknown>).nombre);
    if (nombre) return nombre;
  }
  return toString(citaPayload?.nombreCliente ?? raw.nombreCliente) ?? fallbackTitle;
};

const getAssignedFromTask = (item: KanbanItem, raw: Record<string, unknown>) => {
  const assignedToIds = ensureStringArray(raw.asignadoA ?? item.asignadoA);
  const assignedToNames = ensureStringArray(raw.asignadoANombre ?? item.asignadoANombre);

  if (assignedToIds.length > 0 || assignedToNames.length > 0) {
    return {
      assignedTo: assignedToNames.length > 0 ? assignedToNames : ["Sin asignar"],
      assignedToIds,
    };
  }

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
  if (normalized === "pendiente") return "pendiente";
  if (normalized === "completada") return "completada";
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
export const isTaskDiscarded = (task: AdminWorkflowTask) => task.followUpStatus === "inactivo";
export const isTaskInProgress = (task: AdminWorkflowTask) => !isTaskConfirmed(task) && !isTaskDiscarded(task);

export const mapKanbanItemToAdminTask = (item: KanbanItem): AdminWorkflowTask => {
  const raw = (item.raw ?? item) as Record<string, unknown>;
  const citaPayload = extractCitaPayload(raw);
  const visitaPayload = extractVisitaPayload(raw);

  if (isCitaCard(item, raw, citaPayload)) {
    const stage = normalizeStage(raw.etapa ?? item.etapa ?? "citas");
    const isCitasStage = stage === "citas";
    const fallbackTitle = toString((item as unknown as Record<string, unknown>).title) ?? "Cita";
    const clientName = getCitaClientName(raw, citaPayload, fallbackTitle);
    const { assignedTo, assignedToIds } = getAssignedFromTask(item, raw);
    const scheduledAt = toIsoString(citaPayload?.fechaAgendada ?? raw.fechaAgendada);
    const citaStatus = normalizeCitaStatus(item.estado ?? raw.estado);
    const citaSourceId = toString(raw.sourceId) ?? toString(raw.sourceCitaId) ?? item._id;
    const citaInfo = toString(citaPayload?.informacionAdicional ?? raw.informacionAdicional ?? item.notas);
    const visitScheduledAt = visitaPayload?.fechaProgramada ?? toIsoString(raw.visitScheduledAt);
    const designApprovedByAdmin =
      visitaPayload?.aprobadaPorAdmin ?? toBoolean(raw.designApprovedByAdmin) ?? false;
    const designApprovedByClient =
      visitaPayload?.aprobadaPorCliente ?? toBoolean(raw.designApprovedByClient) ?? false;
    const archivosFuente = Array.isArray(item.archivos)
      ? item.archivos
      : Array.isArray(raw.archivos)
        ? (raw.archivos as KanbanItem["archivos"])
        : [];

    return {
      id: item._id,
      sourceId: isCitasStage ? citaSourceId : item._id,
      title: citaInfo ?? fallbackTitle,
      stage,
      status: citaStatus,
      assignedTo,
      assignedToIds,
      project: clientName,
      notes: citaInfo ?? toString(item.notas) ?? "",
      files: (archivosFuente || []).map((file) => ({
        id: file.id,
        name: file.nombre,
        type: file.tipo,
        src: file.url,
      })),
      priority: citaStatus === "completada" ? "alta" : normalizePriority(raw.prioridad ?? item.prioridad),
      dueDate: scheduledAt ? scheduledAt.slice(0, 10) : undefined,
      location: toString(citaPayload?.ubicacion ?? raw.ubicacion ?? raw.location),
      mapsUrl: toString(raw.mapsUrl),
      createdAt: toTimestamp(raw.createdAt ?? item.createdAt),
      followUpEnteredAt: undefined,
      followUpStatus: "pendiente",
      citaStarted: typeof raw.estado === "string" ? raw.estado === "en_proceso" || raw.estado === "completada" : false,
      citaFinished: typeof raw.estado === "string" ? raw.estado === "completada" : false,
      designApprovedByAdmin,
      designApprovedByClient,
      visitScheduledAt,
      visita: {
        fechaProgramada: visitScheduledAt,
        aprobadaPorAdmin: designApprovedByAdmin,
        aprobadaPorCliente: designApprovedByClient,
      },
      preliminarData: undefined,
      cotizacionFormalData: undefined,
      preliminarCotizaciones: undefined,
      cotizacionesFormales: undefined,
      codigoProyecto: toString(raw.codigoProyecto),
      backendSource: isCitasStage ? "cita" : "tarea",
      sourceType: "cita",
      cita: citaPayload
        ? {
            fechaAgendada: toIsoString(citaPayload.fechaAgendada),
            nombreCliente: toString(citaPayload.nombreCliente),
            correoCliente: toString(citaPayload.correoCliente),
            telefonoCliente: toString(citaPayload.telefonoCliente),
            ubicacion: toString(citaPayload.ubicacion),
            informacionAdicional: toString(citaPayload.informacionAdicional),
          }
        : undefined,
      scheduledAt,
      sourceCitaId: toString(raw.sourceCitaId) ?? citaSourceId,
      sourceDisenoId: toString(raw.sourceDisenoId),
    };
  }

  const assignedTo = ensureStringArray(item.asignadoANombre);
  const assignedToIds = ensureStringArray(item.asignadoA);

  return {
    id: item._id,
    sourceId: item._id,
    title: item.titulo || item.notas || "Tarea",
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
    designApprovedByAdmin:
      visitaPayload?.aprobadaPorAdmin ?? toBoolean(raw.designApprovedByAdmin) ?? false,
    designApprovedByClient:
      visitaPayload?.aprobadaPorCliente ?? toBoolean(raw.designApprovedByClient) ?? false,
    visitScheduledAt: visitaPayload?.fechaProgramada ?? toIsoString(raw.visitScheduledAt),
    visita: {
      fechaProgramada: visitaPayload?.fechaProgramada ?? toIsoString(raw.visitScheduledAt),
      aprobadaPorAdmin: visitaPayload?.aprobadaPorAdmin ?? toBoolean(raw.designApprovedByAdmin) ?? false,
      aprobadaPorCliente: visitaPayload?.aprobadaPorCliente ?? toBoolean(raw.designApprovedByClient) ?? false,
    },
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
    sourceType: (toString(raw.sourceType) as AdminWorkflowTask["sourceType"]) ?? null,
    cita: asRecord(raw.cita)
      ? {
          fechaAgendada: toIsoString((raw.cita as Record<string, unknown>).fechaAgendada),
          nombreCliente: toString((raw.cita as Record<string, unknown>).nombreCliente),
          correoCliente: toString((raw.cita as Record<string, unknown>).correoCliente),
          telefonoCliente: toString((raw.cita as Record<string, unknown>).telefonoCliente),
          ubicacion: toString((raw.cita as Record<string, unknown>).ubicacion),
          informacionAdicional: toString((raw.cita as Record<string, unknown>).informacionAdicional),
        }
      : undefined,
    scheduledAt: undefined,
    sourceCitaId: toString(raw.sourceCitaId),
    sourceDisenoId: toString(raw.sourceDisenoId),
  };
};

export const buildTaskUpdatePayload = (task: AdminWorkflowTask): Partial<KanbanItem> & Record<string, unknown> => {
  const approvedByAdmin = task.designApprovedByAdmin ?? task.visita?.aprobadaPorAdmin ?? false;
  const approvedByClient = task.designApprovedByClient ?? task.visita?.aprobadaPorCliente ?? false;
  const visitScheduledAt = task.visitScheduledAt ?? task.visita?.fechaProgramada;

  return {
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
    designApprovedByAdmin: approvedByAdmin,
    designApprovedByClient: approvedByClient,
    visitScheduledAt,
    visita: {
      fechaProgramada: visitScheduledAt,
      aprobadaPorAdmin: approvedByAdmin,
      aprobadaPorCliente: approvedByClient,
    },
    preliminarData: task.preliminarData,
    cotizacionFormalData: task.cotizacionFormalData,
    preliminarCotizaciones: getPreliminarList(task),
    cotizacionesFormales: getCotizacionesFormalesList(task),
    codigoProyecto: task.codigoProyecto,
    sourceType: task.sourceType ?? undefined,
    sourceId: task.sourceType ? task.sourceId : undefined,
    cita: task.sourceType === "cita" && task.cita
      ? {
          ...task.cita,
          nombreCliente: task.project || task.cita.nombreCliente,
          informacionAdicional: task.notes || task.title || task.cita.informacionAdicional,
          ubicacion: task.location ?? task.cita.ubicacion,
        }
      : undefined,
  };
};

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
