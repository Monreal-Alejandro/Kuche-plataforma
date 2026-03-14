export type TaskStage = "citas" | "disenos" | "cotizacion" | "contrato";
export type TaskStatus = "pendiente" | "completada";
export type TaskPriority = "alta" | "media" | "baja";
export type FollowUpStatus = "pendiente" | "confirmado" | "descartado";

export type TaskFile = {
  id: string;
  name: string;
  type: "pdf" | "render" | "otro";
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
};

/** Datos del cotizador formal guardados en la tarjeta del cliente (para regenerar PDF). */
export type CotizacionFormalData = PreliminarData; // Misma estructura por ahora; se puede ampliar

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
  dueDate?: string;
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
};

export const kanbanColumns = [
  { id: "citas", label: "Citas" },
  { id: "disenos", label: "Diseños" },
  { id: "cotizacion", label: "Cotización Formal" },
  { id: "contrato", label: "Seguimiento" },
] as const;

const ts = (n: number) => Date.now() - ((30 - n) * 24 * 60 * 60 * 1000);

export const initialKanbanTasks: KanbanTask[] = [
  { id: "t1", title: "Revisar medidas cliente Vega", stage: "citas", status: "pendiente", assignedTo: ["Valeria"], project: "Residencial Vega", files: [], priority: "alta", createdAt: ts(1) },
  { id: "t2", title: "Cita showroom 10:30 AM", stage: "citas", status: "pendiente", assignedTo: ["Luis"], project: "Showroom", files: [], priority: "media", createdAt: ts(2) },
  { id: "t3", title: "Diseño cocina Solaris", stage: "disenos", status: "pendiente", assignedTo: ["Valeria"], project: "Solaris", files: [{ id: "f1", name: "Render_Solaris_v2.jpg", type: "render" }], priority: "alta", createdAt: ts(3) },
  { id: "t4", title: "Cotizar clóset Estudio A", stage: "cotizacion", status: "pendiente", assignedTo: ["Carlos"], project: "Estudio A", files: [], priority: "media", createdAt: ts(4) },
  { id: "t5", title: "Cita instalación 4:00 PM", stage: "citas", status: "pendiente", assignedTo: ["Luis"], project: "Residencial Palma", files: [], priority: "media", createdAt: ts(5) },
  { id: "t6", title: "Entrega renders Torreón", stage: "disenos", status: "completada", assignedTo: ["Majo"], project: "Torreón", files: [{ id: "f2", name: "Plano_Torreon.pdf", type: "pdf" }, { id: "f3", name: "Render_Torreon_final.jpg", type: "render" }], priority: "baja", createdAt: ts(6) },
  { id: "t7", title: "Cita inicial cliente Lozano", stage: "citas", status: "pendiente", assignedTo: ["Valeria"], project: "Residencial Lozano", files: [], priority: "alta", createdAt: ts(7) },
  { id: "t8", title: "Levantamiento para proyecto Mistral", stage: "citas", status: "pendiente", assignedTo: ["Luis"], project: "Mistral", files: [], priority: "media", createdAt: ts(8) },
  { id: "t9", title: "Diseño cocina Lomas", stage: "disenos", status: "pendiente", assignedTo: ["Majo"], project: "Lomas", files: [{ id: "f8", name: "Render_Lomas_v1.jpg", type: "render" }], priority: "media", createdAt: ts(9), designApprovedByAdmin: true },
  { id: "t10", title: "Ajustes de layout Colinas", stage: "disenos", status: "completada", assignedTo: ["Carlos"], project: "Colinas", files: [{ id: "f4", name: "Render_Colinas_v3.jpg", type: "render" }], priority: "baja", createdAt: ts(10) },
  { id: "t11", title: "Cotización formal casa Roble", stage: "cotizacion", status: "pendiente", assignedTo: ["Valeria"], project: "Casa Roble", files: [], priority: "alta", createdAt: ts(11) },
  { id: "t12", title: "Cotización formal Torre Sur", stage: "cotizacion", status: "pendiente", assignedTo: ["Luis"], project: "Torre Sur", files: [], priority: "media", createdAt: ts(12) },
  { id: "t13", title: "Seguimiento cliente Niza", stage: "contrato", status: "pendiente", assignedTo: ["Carlos"], project: "Familia Niza", files: [], priority: "media", createdAt: ts(13), followUpEnteredAt: Date.now() - (7 * 24 * 60 * 60 * 1000), followUpStatus: "pendiente" },
  { id: "t14", title: "Proyecto confirmado Altavista", stage: "contrato", status: "completada", assignedTo: ["Majo"], project: "Familia Altavista", files: [{ id: "f5", name: "Contrato_Altavista.pdf", type: "pdf" }], priority: "baja", createdAt: ts(14), followUpEnteredAt: Date.now() - (10 * 24 * 60 * 60 * 1000), followUpStatus: "confirmado" },
  { id: "t15", title: "Cita seguimiento cliente Pino", stage: "citas", status: "pendiente", assignedTo: ["Luis"], project: "Residencial Pino", files: [], priority: "baja", createdAt: ts(15) },
  { id: "t16", title: "Diseño closet Alameda", stage: "disenos", status: "pendiente", assignedTo: ["Valeria"], project: "Alameda", files: [{ id: "f9", name: "Plano_Alameda.pdf", type: "pdf" }], priority: "media", createdAt: ts(16), designApprovedByAdmin: true },
  { id: "t17", title: "Cotización formal Loft 21", stage: "cotizacion", status: "completada", assignedTo: ["Carlos"], project: "Loft 21", files: [{ id: "f6", name: "Cotizacion_Loft21.pdf", type: "pdf" }], priority: "baja", createdAt: ts(17) },
  { id: "t18", title: "Cita técnica proyecto Mirador", stage: "citas", status: "pendiente", assignedTo: ["Majo"], project: "Mirador", files: [], priority: "media", createdAt: ts(18) },
  { id: "t19", title: "Diseño cocina Encinos", stage: "disenos", status: "completada", assignedTo: ["Valeria"], project: "Encinos", files: [{ id: "f7", name: "Render_Encinos_final.jpg", type: "render" }], priority: "baja", createdAt: ts(19) },
  { id: "t20", title: "Seguimiento cliente San Telmo", stage: "contrato", status: "pendiente", assignedTo: ["Luis"], project: "Familia San Telmo", files: [], priority: "alta", createdAt: ts(20), followUpEnteredAt: Date.now() - (4 * 24 * 60 * 60 * 1000), followUpStatus: "pendiente" },
  { id: "t21", title: "Cotización formal Paseo Norte", stage: "cotizacion", status: "pendiente", assignedTo: ["Majo"], project: "Paseo Norte", files: [], priority: "media", createdAt: ts(21) },
  { id: "t22", title: "Nuevo cliente Monterrey", stage: "contrato", status: "pendiente", assignedTo: ["Valeria"], project: "Familia García", files: [], priority: "media", createdAt: ts(22), followUpEnteredAt: Date.now() - (1 * 24 * 60 * 60 * 1000), followUpStatus: "pendiente" },
  { id: "t23", title: "Cocina integral confirmada", stage: "contrato", status: "completada", assignedTo: ["Carlos"], project: "Familia Rodríguez", files: [{ id: "f10", name: "Contrato_Rodriguez.pdf", type: "pdf" }, { id: "f11", name: "Render_Rodriguez_final.jpg", type: "render" }], priority: "alta", createdAt: ts(23), followUpEnteredAt: Date.now() - (12 * 24 * 60 * 60 * 1000), followUpStatus: "confirmado" },
  { id: "t24", title: "Proyecto residencial completo", stage: "contrato", status: "completada", assignedTo: ["Luis", "Valeria"], project: "Familia Mendoza", files: [{ id: "f12", name: "Contrato_Mendoza.pdf", type: "pdf" }], priority: "alta", createdAt: ts(24), followUpEnteredAt: Date.now() - (8 * 24 * 60 * 60 * 1000), followUpStatus: "confirmado" },
  { id: "t25", title: "Closet y cocina Polanco", stage: "contrato", status: "completada", assignedTo: ["Majo"], project: "Residencial Polanco", files: [{ id: "f13", name: "Cotizacion_Polanco.pdf", type: "pdf" }, { id: "f14", name: "Render_Polanco.jpg", type: "render" }], priority: "media", createdAt: ts(25), followUpEnteredAt: Date.now() - (15 * 24 * 60 * 60 * 1000), followUpStatus: "confirmado" },
  { id: "t26", title: "Remodelación cocina confirmada", stage: "contrato", status: "completada", assignedTo: ["Carlos"], project: "Familia Torres", files: [{ id: "f15", name: "Contrato_Torres.pdf", type: "pdf" }], priority: "media", createdAt: ts(26), followUpEnteredAt: Date.now() - (20 * 24 * 60 * 60 * 1000), followUpStatus: "confirmado" },
  { id: "t27", title: "Cocina premium Santa Fe", stage: "contrato", status: "completada", assignedTo: ["Valeria", "Majo"], project: "Residencial Santa Fe", files: [{ id: "f16", name: "Contrato_SantaFe.pdf", type: "pdf" }, { id: "f17", name: "Plano_SantaFe.pdf", type: "pdf" }, { id: "f18", name: "Render_SantaFe.jpg", type: "render" }], priority: "alta", createdAt: ts(27), followUpEnteredAt: Date.now() - (25 * 24 * 60 * 60 * 1000), followUpStatus: "confirmado" },
  { id: "t28", title: "Proyecto cancelado por presupuesto", stage: "contrato", status: "completada", assignedTo: ["Carlos"], project: "Familia Herrera", files: [{ id: "f19", name: "Cotizacion_Herrera.pdf", type: "pdf" }], priority: "media", createdAt: ts(28), followUpEnteredAt: Date.now() - (18 * 24 * 60 * 60 * 1000), followUpStatus: "descartado" },
  { id: "t29", title: "Cliente no respondió", stage: "contrato", status: "completada", assignedTo: ["Luis"], project: "Residencial Bosques", files: [], priority: "baja", createdAt: ts(29), followUpEnteredAt: Date.now() - (30 * 24 * 60 * 60 * 1000), followUpStatus: "descartado" },
  { id: "t30", title: "Decidió otra empresa", stage: "contrato", status: "completada", assignedTo: ["Valeria"], project: "Familia Reyes", files: [{ id: "f20", name: "Render_Reyes.jpg", type: "render" }], priority: "media", createdAt: ts(30), followUpEnteredAt: Date.now() - (22 * 24 * 60 * 60 * 1000), followUpStatus: "descartado" },
  { id: "t31", title: "Proyecto pospuesto indefinidamente", stage: "contrato", status: "completada", assignedTo: ["Majo"], project: "Depto Centro", files: [{ id: "f21", name: "Plano_Centro.pdf", type: "pdf" }], priority: "baja", createdAt: ts(31), followUpEnteredAt: Date.now() - (35 * 24 * 60 * 60 * 1000), followUpStatus: "descartado" },
  { id: "t32", title: "Sin respuesta tras cotización", stage: "contrato", status: "completada", assignedTo: ["Carlos", "Luis"], project: "Familia Ortega", files: [{ id: "f22", name: "Cotizacion_Ortega.pdf", type: "pdf" }, { id: "f23", name: "Render_Ortega.jpg", type: "render" }], priority: "media", createdAt: ts(32), followUpEnteredAt: Date.now() - (28 * 24 * 60 * 60 * 1000), followUpStatus: "descartado" },
];

export const kanbanStorageKey = "kuche-kanban-tasks";
export const activeCitaTaskStorageKey = "kuche-active-cita-task";
export const citaReturnUrlStorageKey = "kuche-cita-return-url";
export const activeCotizacionFormalTaskStorageKey = "kuche-active-cotizacion-formal-task";
