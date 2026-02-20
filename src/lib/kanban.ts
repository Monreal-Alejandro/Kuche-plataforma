export type TaskType = "todo" | "cita" | "diseño";
export type TaskStatus = "pendiente" | "en-proceso" | "completada";

export type KanbanTask = {
  id: string;
  title: string;
  type: TaskType;
  status: TaskStatus;
  employee: string;
  project: string;
};

export const kanbanColumns = [
  { id: "pendiente", label: "Pendiente" },
  { id: "en-proceso", label: "En proceso" },
  { id: "completada", label: "Completadas" },
] as const;

export const initialKanbanTasks: KanbanTask[] = [
  {
    id: "t1",
    title: "Revisar medidas cliente Vega",
    type: "todo",
    status: "pendiente",
    employee: "Valeria",
    project: "Residencial Vega",
  },
  {
    id: "t2",
    title: "Cita showroom 10:30 AM",
    type: "cita",
    status: "pendiente",
    employee: "Luis",
    project: "Showroom",
  },
  {
    id: "t3",
    title: "Diseño cocina Solaris",
    type: "diseño",
    status: "en-proceso",
    employee: "Valeria",
    project: "Solaris",
  },
  {
    id: "t4",
    title: "Cotizar clóset Estudio A",
    type: "todo",
    status: "en-proceso",
    employee: "Carlos",
    project: "Estudio A",
  },
  {
    id: "t5",
    title: "Cita instalación 4:00 PM",
    type: "cita",
    status: "pendiente",
    employee: "Luis",
    project: "Residencial Palma",
  },
  {
    id: "t6",
    title: "Entrega renders Torreón",
    type: "diseño",
    status: "completada",
    employee: "Majo",
    project: "Torreón",
  },
];

export const kanbanStorageKey = "kuche-kanban-tasks";
