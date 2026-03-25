import type { LevantamientoDetalle } from "@/lib/levantamiento-catalog";

export type TaskStage = "citas" | "disenos" | "cotizacion" | "contrato";
export type TaskStatus = "pendiente" | "completada";
export type TaskPriority = "alta" | "media" | "baja";
export type FollowUpStatus = "pendiente" | "confirmado" | "descartado";

export type TaskFile = {
  id: string;
  name: string;
  type: "pdf" | "render" | "otro";
  /** Data URL (base64): vista previa y descarga en admin; opcional si falló la lectura o es dato legado. */
  src?: string;
};

/** Datos del cotizador preliminar guardados en la tarjeta del cliente (para regenerar PDF). */
export type PreliminarData = {
  client: string;
  projectType: string;
  location: string;
  date: string;
  rangeLabel: string;
  cubierta: string;
  frente: string;
  herraje: string;
  /** Medidas y comentarios por sección del levantamiento detallado (opcional). */
  levantamiento?: LevantamientoDetalle;
};

/** Datos del cotizador formal guardados en la tarjeta del cliente. */
export type CotizacionFormalData = PreliminarData & {
  /** Clave en IndexedDB donde está guardado el PDF formal (evita exceder cuota de localStorage). */
  formalPdfKey?: string;
  /** Clave en IndexedDB de la hoja de taller generada junto con esta cotización formal. */
  workshopPdfKey?: string;
  /** @deprecated PDF en data URL; ya no se persiste en la tarea (usa formalPdfKey + IndexedDB). */
  pdfDataUrl?: string;
};

export type KanbanTask = {
  id: string;
  title: string;
  stage: TaskStage;
  status: TaskStatus;
  /** Uno o más responsables (permite que 2+ empleados tengan la misma actividad). */
  assignedTo: string[];
  project: string;
  notes?: string;
  files?: TaskFile[];
  priority?: TaskPriority;
  /** Fecha límite o cita: `YYYY-MM-DD` o `YYYY-MM-DDTHH:mm` (hora local). */
  dueDate?: string;
  /** Dirección / localidad del cliente; se muestra debajo del nombre en la tarjeta. */
  location?: string;
  /** Enlace de Google Maps; en la tarjeta se muestra como "Ver en Maps" para abrir la ubicación. */
  mapsUrl?: string;
  createdAt?: number;
  /** Para tareas en seguimiento: fecha en que entró a la columna de seguimiento */
  followUpEnteredAt?: number;
  /** Estado del seguimiento: pendiente, confirmado o descartado */
  followUpStatus?: FollowUpStatus;
  /** Citas/Cotización: si se inició la cita */
  citaStarted?: boolean;
  /** Citas/Cotización: si se terminó la cita */
  citaFinished?: boolean;
  /** Diseños: si el admin aprobó el diseño */
  designApprovedByAdmin?: boolean;
  /** Diseños: si el cliente aprobó el diseño */
  designApprovedByClient?: boolean;
  /** Datos de la cotización preliminar (cita); para ver/descargar PDF en Clientes en proceso */
  preliminarData?: PreliminarData;
  /** Datos de la cotización formal; para ver/descargar PDF en Clientes en proceso */
  cotizacionFormalData?: CotizacionFormalData;
  /** Varias cotizaciones preliminares (ej. cocina, clóset, baño) en la misma tarjeta. Si existe, tiene prioridad sobre preliminarData. */
  preliminarCotizaciones?: PreliminarData[];
  /** Varias cotizaciones formales en la misma tarjeta. Si existe, tiene prioridad sobre cotizacionFormalData. */
  cotizacionesFormales?: CotizacionFormalData[];
  /** Código para que el cliente acceda a /seguimiento (ej. K-8821). Se genera al crear la tarea. */
  codigoProyecto?: string;
};

/** Lista efectiva de cotizaciones preliminares (array nuevo o migrado desde preliminarData). */
export function getPreliminarList(task: KanbanTask): PreliminarData[] {
  if (task.preliminarCotizaciones && task.preliminarCotizaciones.length > 0) {
    return task.preliminarCotizaciones;
  }
  return task.preliminarData ? [task.preliminarData] : [];
}

/** Lista efectiva de cotizaciones formales (array nuevo o migrado desde cotizacionFormalData). */
export function getCotizacionesFormalesList(task: KanbanTask): CotizacionFormalData[] {
  if (task.cotizacionesFormales && task.cotizacionesFormales.length > 0) {
    return task.cotizacionesFormales;
  }
  return task.cotizacionFormalData ? [task.cotizacionFormalData] : [];
}

export const kanbanColumns = [
  { id: "citas", label: "Citas" },
  { id: "disenos", label: "Diseños" },
  { id: "cotizacion", label: "Cotización Formal" },
  { id: "contrato", label: "Seguimiento" },
] as const;

/** Lista inicial de tareas del tablero. Vacía para que el tablero se llene solo con "Asignar pendiente". */
export const initialKanbanTasks: KanbanTask[] = [];

export const kanbanStorageKey = "kuche-kanban-tasks";
export const activeCitaTaskStorageKey = "kuche-active-cita-task";
export const citaReturnUrlStorageKey = "kuche-cita-return-url";
export const activeCotizacionFormalTaskStorageKey = "kuche-active-cotizacion-formal-task";

/** Prefijo para guardar datos de seguimiento por código: kuche_project_${codigoProyecto} */
export const seguimientoProjectStoragePrefix = "kuche_project_";

function isQuotaExceededError(e: unknown): boolean {
  return (
    (typeof DOMException !== "undefined" && e instanceof DOMException && e.name === "QuotaExceededError") ||
    (typeof e === "object" &&
      e !== null &&
      "name" in e &&
      (e as { name: string }).name === "QuotaExceededError")
  );
}

function stripFormalPdfDataUrlIfRedundant(d: CotizacionFormalData): CotizacionFormalData {
  if (d.pdfDataUrl && d.formalPdfKey) {
    const { pdfDataUrl: _drop, ...rest } = d;
    return rest as CotizacionFormalData;
  }
  return d;
}

/** Quita adjuntos pesados antes de serializar (localStorage ~5MB). El PDF formal sigue en IndexedDB por `formalPdfKey`. */
export function stripKanbanTasksForStorage(tasks: KanbanTask[]): KanbanTask[] {
  return tasks.map((task) => {
    const next: KanbanTask = { ...task };
    if (next.files?.length) {
      next.files = next.files.map(({ src: _s, ...rest }) => rest);
    }
    if (next.cotizacionFormalData) {
      next.cotizacionFormalData = stripFormalPdfDataUrlIfRedundant(next.cotizacionFormalData);
    }
    if (next.cotizacionesFormales?.length) {
      next.cotizacionesFormales = next.cotizacionesFormales.map(stripFormalPdfDataUrlIfRedundant);
    }
    return next;
  });
}

function stripAllFormalPdfDataUrl(tasks: KanbanTask[]): KanbanTask[] {
  const dropUrl = (d: CotizacionFormalData): CotizacionFormalData => {
    if (!d.pdfDataUrl) return d;
    const { pdfDataUrl: _u, ...rest } = d;
    return rest as CotizacionFormalData;
  };
  return stripKanbanTasksForStorage(tasks).map((task) => {
    const next = { ...task };
    if (next.cotizacionFormalData?.pdfDataUrl) {
      next.cotizacionFormalData = dropUrl(next.cotizacionFormalData);
    }
    if (next.cotizacionesFormales?.length) {
      next.cotizacionesFormales = next.cotizacionesFormales.map(dropUrl);
    }
    return next;
  });
}

/** Último recurso: quita el detalle de levantamiento embebido (el PDF en IndexedDB / seguimiento puede seguir existiendo). */
function stripPreliminarLevantamiento(d: PreliminarData): PreliminarData {
  if (!d.levantamiento) return d;
  const { levantamiento: _l, ...rest } = d;
  return rest;
}

function stripAllPreliminarLevantamiento(tasks: KanbanTask[]): KanbanTask[] {
  return stripAllFormalPdfDataUrl(tasks).map((task) => {
    const next = { ...task };
    if (next.preliminarData) {
      next.preliminarData = stripPreliminarLevantamiento(next.preliminarData);
    }
    if (next.preliminarCotizaciones?.length) {
      next.preliminarCotizaciones = next.preliminarCotizaciones.map(stripPreliminarLevantamiento);
    }
    return next;
  });
}

/**
 * Persiste tareas en localStorage recortando datos pesados. Reintenta con estrategias más agresivas si se excede la cuota.
 * La UI puede seguir teniendo `files[].src` en memoria hasta recargar; no muta el arreglo recibido.
 */
export function saveKanbanTasksToLocalStorage(tasks: KanbanTask[]): boolean {
  if (typeof window === "undefined") return false;
  const attempts: (() => KanbanTask[])[] = [
    () => stripKanbanTasksForStorage(tasks),
    () => stripAllFormalPdfDataUrl(tasks),
    () => stripAllPreliminarLevantamiento(tasks),
  ];
  for (const build of attempts) {
    try {
      const payload = build();
      window.localStorage.setItem(kanbanStorageKey, JSON.stringify(payload));
      return true;
    } catch (e) {
      if (!isQuotaExceededError(e)) {
        console.error("saveKanbanTasksToLocalStorage", e);
        return false;
      }
    }
  }
  return false;
}
