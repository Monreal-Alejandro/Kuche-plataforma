export type TaskStage = "citas" | "disenos" | "cotizacion" | "contrato";
export type TaskStatus = "pendiente" | "completada";

export type TaskFile = {
  id: string;
  name: string;
  type: "pdf" | "render" | "otro";
};

export type KanbanTask = {
  id: string;
  title: string;
  stage: TaskStage;
  status: TaskStatus;
  assignedTo: string;
  project: string;
  notes?: string;
  files?: TaskFile[];
};

export const kanbanColumns = [
  { id: "citas", label: "Citas" },
  { id: "disenos", label: "Diseños" },
  { id: "cotizacion", label: "Cotización Formal" },
  { id: "contrato", label: "Contrato" },
] as const;

export const initialKanbanTasks: KanbanTask[] = [
  {
    id: "t1",
    title: "Revisar medidas cliente Vega",
    stage: "citas",
    status: "pendiente",
    assignedTo: "Valeria",
    project: "Residencial Vega",
    files: [],
  },
  {
    id: "t2",
    title: "Cita showroom 10:30 AM",
    stage: "citas",
    status: "pendiente",
    assignedTo: "Luis",
    project: "Showroom",
    files: [],
  },
  {
    id: "t3",
    title: "Diseño cocina Solaris",
    stage: "disenos",
    status: "pendiente",
    assignedTo: "Valeria",
    project: "Solaris",
    files: [
      { id: "f1", name: "Render_Solaris_v2.jpg", type: "render" },
    ],
  },
  {
    id: "t4",
    title: "Cotizar clóset Estudio A",
    stage: "cotizacion",
    status: "pendiente",
    assignedTo: "Carlos",
    project: "Estudio A",
    files: [],
  },
  {
    id: "t5",
    title: "Cita instalación 4:00 PM",
    stage: "citas",
    status: "pendiente",
    assignedTo: "Luis",
    project: "Residencial Palma",
    files: [],
  },
  {
    id: "t6",
    title: "Entrega renders Torreón",
    stage: "disenos",
    status: "completada",
    assignedTo: "Majo",
    project: "Torreón",
    files: [
      { id: "f2", name: "Plano_Torreon.pdf", type: "pdf" },
      { id: "f3", name: "Render_Torreon_final.jpg", type: "render" },
    ],
  },
  {
    id: "t7",
    title: "Cita inicial cliente Lozano",
    stage: "citas",
    status: "pendiente",
    assignedTo: "Valeria",
    project: "Residencial Lozano",
    files: [],
  },
  {
    id: "t8",
    title: "Levantamiento para proyecto Mistral",
    stage: "citas",
    status: "pendiente",
    assignedTo: "Luis",
    project: "Mistral",
    files: [],
  },
  {
    id: "t9",
    title: "Diseño cocina Lomas",
    stage: "disenos",
    status: "pendiente",
    assignedTo: "Majo",
    project: "Lomas",
    files: [],
  },
  {
    id: "t10",
    title: "Ajustes de layout Colinas",
    stage: "disenos",
    status: "completada",
    assignedTo: "Carlos",
    project: "Colinas",
    files: [
      { id: "f4", name: "Render_Colinas_v3.jpg", type: "render" },
    ],
  },
  {
    id: "t11",
    title: "Cotización formal casa Roble",
    stage: "cotizacion",
    status: "pendiente",
    assignedTo: "Valeria",
    project: "Casa Roble",
    files: [],
  },
  {
    id: "t12",
    title: "Cotización formal Torre Sur",
    stage: "cotizacion",
    status: "pendiente",
    assignedTo: "Luis",
    project: "Torre Sur",
    files: [],
  },
  {
    id: "t13",
    title: "Revisión de contrato proyecto Niza",
    stage: "contrato",
    status: "pendiente",
    assignedTo: "Carlos",
    project: "Niza",
    files: [],
  },
  {
    id: "t14",
    title: "Contrato firmado Altavista",
    stage: "contrato",
    status: "completada",
    assignedTo: "Majo",
    project: "Altavista",
    files: [
      { id: "f5", name: "Contrato_Altavista.pdf", type: "pdf" },
    ],
  },
  {
    id: "t15",
    title: "Cita seguimiento cliente Pino",
    stage: "citas",
    status: "pendiente",
    assignedTo: "Luis",
    project: "Residencial Pino",
    files: [],
  },
  {
    id: "t16",
    title: "Diseño closet Alameda",
    stage: "disenos",
    status: "pendiente",
    assignedTo: "Valeria",
    project: "Alameda",
    files: [],
  },
  {
    id: "t17",
    title: "Cotización formal Loft 21",
    stage: "cotizacion",
    status: "completada",
    assignedTo: "Carlos",
    project: "Loft 21",
    files: [
      { id: "f6", name: "Cotizacion_Loft21.pdf", type: "pdf" },
    ],
  },
  {
    id: "t18",
    title: "Cita técnica proyecto Mirador",
    stage: "citas",
    status: "pendiente",
    assignedTo: "Majo",
    project: "Mirador",
    files: [],
  },
  {
    id: "t19",
    title: "Diseño cocina Encinos",
    stage: "disenos",
    status: "completada",
    assignedTo: "Valeria",
    project: "Encinos",
    files: [
      { id: "f7", name: "Render_Encinos_final.jpg", type: "render" },
    ],
  },
  {
    id: "t20",
    title: "Contrato por confirmar San Telmo",
    stage: "contrato",
    status: "pendiente",
    assignedTo: "Luis",
    project: "San Telmo",
    files: [],
  },
  {
    id: "t21",
    title: "Cotización formal Paseo Norte",
    stage: "cotizacion",
    status: "pendiente",
    assignedTo: "Majo",
    project: "Paseo Norte",
    files: [],
  },
];

export const kanbanStorageKey = "kuche-kanban-tasks";
export const activeCitaTaskStorageKey = "kuche-active-cita-task";
