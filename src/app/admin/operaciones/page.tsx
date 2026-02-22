"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, PenTool, UserPlus } from "lucide-react";

const kanbanColumns = ["Pendiente", "En Progreso", "Revisión", "Completado"];

const initialTeamMembers = [
  { id: "e1", name: "Valeria", role: "Arquitecta" },
  { id: "e2", name: "Majo", role: "Ventas" },
  { id: "e3", name: "Carlos", role: "Arquitecto" },
];

type TaskType = "Cita" | "Diseño";
type TaskPriority = "Baja" | "Media" | "Alta";

type Task = {
  id: string;
  title: string;
  client: string;
  type: TaskType;
  column: string;
  assignedTo: string;
  dueDate: string;
  priority: TaskPriority;
};

const initialTasks: Task[] = [
  {
    id: "t1",
    title: "Cita inicial cocina",
    client: "Mariana Fuentes",
    type: "Cita",
    column: "Pendiente",
    assignedTo: "e2",
    dueDate: "2026-02-28",
    priority: "Alta",
  },
  {
    id: "t2",
    title: "Render cocina L",
    client: "Héctor Salas",
    type: "Diseño",
    column: "En Progreso",
    assignedTo: "e1",
    dueDate: "2026-03-02",
    priority: "Media",
  },
  {
    id: "t3",
    title: "Cita revisión closet",
    client: "Grupo Aranda",
    type: "Cita",
    column: "Revisión",
    assignedTo: "e2",
    dueDate: "2026-03-04",
    priority: "Baja",
  },
  {
    id: "t4",
    title: "Diseño TV Unit",
    client: "Fabiola Martínez",
    type: "Diseño",
    column: "Pendiente",
    assignedTo: "e3",
    dueDate: "2026-03-08",
    priority: "Media",
  },
];

const TASKS_STORAGE_KEY = "kuche_kanban_tasks";
const TEAM_STORAGE_KEY = "kuche_team_members";

const initialsFromName = (value: string) =>
  value
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

const priorityStyles: Record<TaskPriority, string> = {
  Alta: "bg-rose-100 text-rose-700",
  Media: "bg-amber-100 text-amber-700",
  Baja: "bg-emerald-100 text-emerald-700",
};

const typeStyles: Record<TaskType, { className: string; icon: typeof Calendar }> = {
  Cita: { className: "bg-sky-100 text-sky-700", icon: Calendar },
  Diseño: { className: "bg-purple-100 text-purple-700", icon: PenTool },
};

export default function OperacionesPage() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState("Todos");
  const [teamMembers, setTeamMembers] = useState(initialTeamMembers);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [newEmployeeName, setNewEmployeeName] = useState("");
  const [newEmployeeRole, setNewEmployeeRole] = useState("Arquitecto/a");
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskClient, setNewTaskClient] = useState("");
  const [newTaskType, setNewTaskType] = useState<TaskType>("Cita");
  const [newTaskAssignee, setNewTaskAssignee] = useState(initialTeamMembers[0]?.id ?? "");
  const [newTaskDate, setNewTaskDate] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>("Media");
  const [taskError, setTaskError] = useState("");
  const [employeeError, setEmployeeError] = useState("");

  useEffect(() => {
    const storedTeam = window.localStorage.getItem(TEAM_STORAGE_KEY);
    if (storedTeam) {
      try {
        const parsedTeam = JSON.parse(storedTeam);
        if (Array.isArray(parsedTeam) && parsedTeam.length > 0) {
          setTeamMembers(parsedTeam);
          setNewTaskAssignee(parsedTeam[0]?.id ?? "");
        }
      } catch {
        // ignore corrupted storage
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(teamMembers));
  }, [teamMembers]);

  useEffect(() => {
    const stored = window.localStorage.getItem(TASKS_STORAGE_KEY);
    if (!stored) {
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const normalized = parsed.map((task) => {
          const safeType: TaskType = task?.type === "Diseño" ? "Diseño" : "Cita";
          const safePriority: TaskPriority =
            task?.priority === "Alta" || task?.priority === "Baja" ? task.priority : "Media";
          const fallbackMember = teamMembers[0]?.id ?? initialTeamMembers[0]?.id ?? "e1";
          return {
            id: String(task?.id ?? `t${Date.now().toString(36)}`),
            title: String(task?.title ?? "Pendiente sin título"),
            client: String(task?.client ?? "Cliente sin nombre"),
            type: safeType,
            column: kanbanColumns.includes(task?.column) ? task.column : "Pendiente",
            assignedTo: String(task?.assignedTo ?? fallbackMember),
            dueDate: String(task?.dueDate ?? ""),
            priority: safePriority,
          } as Task;
        });
        setTasks(normalized);
      }
    } catch {
      // ignore corrupted storage
    }
  }, [teamMembers]);

  useEffect(() => {
    window.localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    if (!isTaskModalOpen) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsTaskModalOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isTaskModalOpen]);

  useEffect(() => {
    if (!isEmployeeModalOpen) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsEmployeeModalOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isEmployeeModalOpen]);

  useEffect(() => {
    if (!newTaskAssignee && teamMembers.length > 0) {
      setNewTaskAssignee(teamMembers[0].id);
    }
  }, [newTaskAssignee, teamMembers]);

  const filteredTasks = useMemo(() => {
    if (selectedEmployee === "Todos") {
      return tasks;
    }
    return tasks.filter((task) => task.assignedTo === selectedEmployee);
  }, [selectedEmployee, tasks]);

  const tasksByColumn = useMemo(() => {
    return kanbanColumns.reduce<Record<string, Task[]>>((acc, column) => {
      acc[column] = filteredTasks.filter((task) => task.column === column);
      return acc;
    }, {});
  }, [filteredTasks]);

  const handleTaskDragStart = (taskId: string) => {
    setDraggedTaskId(taskId);
  };

  const handleDropOnColumn = (column: string) => {
    if (!draggedTaskId) {
      return;
    }
    setTasks((prev) =>
      prev.map((task) => (task.id === draggedTaskId ? { ...task, column } : task)),
    );
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const getMemberById = (id: string) => teamMembers.find((member) => member.id === id);

  const handleCreateTask = () => {
    const trimmedTitle = newTaskTitle.trim();
    const trimmedClient = newTaskClient.trim();
    if (!trimmedTitle || !trimmedClient || !newTaskDate || !newTaskAssignee) {
      setTaskError("Completa el título, cliente, fecha y asignación.");
      return;
    }
    const newTask: Task = {
      id: `t${Date.now().toString(36)}`,
      title: trimmedTitle,
      client: trimmedClient,
      type: newTaskType,
      column: "Pendiente",
      assignedTo: newTaskAssignee,
      dueDate: newTaskDate,
      priority: newTaskPriority,
    };
    setTasks((prev) => [...prev, newTask]);
    setIsTaskModalOpen(false);
    setNewTaskTitle("");
    setNewTaskClient("");
    setNewTaskType("Cita");
    setNewTaskAssignee(teamMembers[0]?.id ?? "");
    setNewTaskDate("");
    setNewTaskPriority("Media");
    setTaskError("");
  };

  const handleCreateEmployee = () => {
    const trimmedName = newEmployeeName.trim();
    if (!trimmedName) {
      setEmployeeError("Agrega el nombre del integrante.");
      return;
    }
    const isDuplicate = teamMembers.some(
      (member) => member.name.toLowerCase() === trimmedName.toLowerCase(),
    );
    if (isDuplicate) {
      setEmployeeError("Ya existe un integrante con ese nombre.");
      return;
    }
    const newMember = {
      id: `e${Date.now().toString(36)}`,
      name: trimmedName,
      role: newEmployeeRole,
    };
    setTeamMembers((prev) => [...prev, newMember]);
    setNewTaskAssignee((prev) => prev || newMember.id);
    setIsEmployeeModalOpen(false);
    setNewEmployeeName("");
    setNewEmployeeRole("Arquitecto/a");
    setEmployeeError("");
  };

  const handleUpdateEmployee = () => {
    const trimmedName = newEmployeeName.trim();
    if (!trimmedName || !editingEmployeeId) {
      setEmployeeError("Agrega el nombre del integrante.");
      return;
    }
    const isDuplicate = teamMembers.some(
      (member) =>
        member.id !== editingEmployeeId &&
        member.name.toLowerCase() === trimmedName.toLowerCase(),
    );
    if (isDuplicate) {
      setEmployeeError("Ya existe un integrante con ese nombre.");
      return;
    }
    setTeamMembers((prev) =>
      prev.map((member) =>
        member.id === editingEmployeeId ? { ...member, name: trimmedName, role: newEmployeeRole } : member,
      ),
    );
    setIsEmployeeModalOpen(false);
    setEditingEmployeeId(null);
    setNewEmployeeName("");
    setNewEmployeeRole("Arquitecto/a");
    setEmployeeError("");
  };

  const handleDeleteEmployee = (memberId: string) => {
    const target = teamMembers.find((member) => member.id === memberId);
    const message = target
      ? `¿Eliminar a ${target.name}? Esta acción no se puede deshacer.`
      : "¿Eliminar integrante? Esta acción no se puede deshacer.";
    if (!window.confirm(message)) {
      return;
    }
    setTeamMembers((prev) => {
      const nextMembers = prev.filter((member) => member.id !== memberId);
      if (newTaskAssignee === memberId) {
        setNewTaskAssignee(nextMembers[0]?.id ?? "");
      }
      return nextMembers;
    });
    setTasks((prev) =>
      prev.map((task) => (task.assignedTo === memberId ? { ...task, assignedTo: "" } : task)),
    );
    if (selectedEmployee === memberId) {
      setSelectedEmployee("Todos");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Control de Tareas y Citas</h1>
          <select
            value={selectedEmployee}
            onChange={(event) => setSelectedEmployee(event.target.value)}
            className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm outline-none"
          >
            <option value="Todos">Todos</option>
            {teamMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setNewEmployeeName("");
              setNewEmployeeRole("Arquitecto/a");
              setEmployeeError("");
              setEditingEmployeeId(null);
              setIsEmployeeModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <UserPlus className="h-4 w-4" />
            Nuevo empleado
          </button>
          <button
            type="button"
            onClick={() => {
              setNewTaskTitle("");
              setNewTaskClient("");
              setNewTaskType("Cita");
              setNewTaskAssignee(teamMembers[0]?.id ?? "");
              setNewTaskDate("");
              setNewTaskPriority("Media");
              setTaskError("");
              setIsTaskModalOpen(true);
            }}
            className="rounded-2xl bg-[#8B1C1C] px-5 py-2.5 text-sm font-semibold text-white shadow-sm"
          >
            Asignar pendiente
          </button>
        </div>
      </div>

      <div className="flex w-full gap-4 overflow-x-auto pb-4">
        {kanbanColumns.map((column) => (
          <div
            key={column}
            onDragOver={(event) => {
              event.preventDefault();
              setDragOverColumn(column);
            }}
            onDrop={() => handleDropOnColumn(column)}
            onDragLeave={() => setDragOverColumn(null)}
            className={`min-w-[280px] rounded-2xl border p-4 ${
              dragOverColumn === column ? "border-[#8B1C1C]/40 bg-[#8B1C1C]/5" : "border-gray-100 bg-gray-50/50"
            }`}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">{column}</h3>
              <span className="rounded-full bg-white px-2 py-1 text-xs text-gray-400 shadow-sm">
                {tasksByColumn[column]?.length ?? 0}
              </span>
            </div>
            <div className="space-y-3">
              {tasksByColumn[column]?.map((task) => {
                const assignedMember = getMemberById(task.assignedTo);
                const typeConfig = typeStyles[task.type] ?? typeStyles.Cita;
                const TypeIcon = typeConfig.icon;
                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleTaskDragStart(task.id)}
                    className="cursor-grab rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition active:cursor-grabbing"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span
                        className={`flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold ${typeConfig.className}`}
                      >
                        <TypeIcon className="h-3.5 w-3.5" />
                        {task.type}
                      </span>
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-semibold ${priorityStyles[task.priority]}`}
                      >
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{task.title}</p>
                    <p className="text-xs text-gray-500">{task.client}</p>
                    <div className="mt-4 flex items-center justify-between text-[11px] text-gray-400">
                      <span>Entrega: {task.dueDate}</span>
                      {assignedMember ? (
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-[10px] font-semibold text-gray-600">
                            {initialsFromName(assignedMember.name)}
                          </div>
                          <span className="text-xs text-gray-500">{assignedMember.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Sin asignar</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {isTaskModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-lg rounded-3xl border border-white/70 bg-white/95 p-6 shadow-2xl backdrop-blur">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Asignar pendiente</h3>
              <button
                type="button"
                onClick={() => setIsTaskModalOpen(false)}
                className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-500"
              >
                Cerrar
              </button>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-semibold text-gray-500 sm:col-span-2">
                Título
                <input
                  value={newTaskTitle}
                  onChange={(event) => setNewTaskTitle(event.target.value)}
                  placeholder="Ej. Cita inicial cocina"
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none"
                />
              </label>
              <label className="text-xs font-semibold text-gray-500 sm:col-span-2">
                Cliente
                <input
                  value={newTaskClient}
                  onChange={(event) => setNewTaskClient(event.target.value)}
                  placeholder="Ej. Mariana Fuentes"
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none"
                />
              </label>
              <label className="text-xs font-semibold text-gray-500">
                Tipo de tarea
                <select
                  value={newTaskType}
                  onChange={(event) => setNewTaskType(event.target.value as TaskType)}
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none"
                >
                  <option value="Cita">Cita</option>
                  <option value="Diseño">Diseño</option>
                </select>
              </label>
              <label className="text-xs font-semibold text-gray-500">
                Asignar a
                <select
                  value={newTaskAssignee}
                  onChange={(event) => setNewTaskAssignee(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none"
                >
                    {teamMembers.length === 0 ? (
                      <option value="">Sin integrantes</option>
                    ) : null}
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-semibold text-gray-500">
                Fecha
                <input
                  value={newTaskDate}
                  onChange={(event) => setNewTaskDate(event.target.value)}
                  type="date"
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none"
                />
              </label>
              <label className="text-xs font-semibold text-gray-500">
                Prioridad
                <select
                  value={newTaskPriority}
                  onChange={(event) =>
                    setNewTaskPriority(event.target.value as TaskPriority)
                  }
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none"
                >
                  <option value="Alta">Alta</option>
                  <option value="Media">Media</option>
                  <option value="Baja">Baja</option>
                </select>
              </label>
            </div>
            {taskError ? (
              <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-600">
                {taskError}
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsTaskModalOpen(false)}
                className="rounded-2xl border border-gray-200 bg-white px-5 py-2 text-xs font-semibold text-gray-600"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateTask}
                className="rounded-2xl bg-[#8B1C1C] px-5 py-2 text-xs font-semibold text-white"
              >
                Guardar pendiente
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isEmployeeModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
          onClick={() => setIsEmployeeModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-white/70 bg-white/95 p-6 shadow-2xl backdrop-blur"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {editingEmployeeId ? "Editar integrante" : "Agregar Integrante al Equipo"}
              </h3>
              <button
                type="button"
                onClick={() => setIsEmployeeModalOpen(false)}
                className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-500"
              >
                Cerrar
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <label className="text-xs font-semibold text-gray-500">
                Nombre completo
                <input
                  value={newEmployeeName}
                  onChange={(event) => setNewEmployeeName(event.target.value)}
                  placeholder="Ej. Valeria"
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none"
                />
              </label>
              <label className="text-xs font-semibold text-gray-500">
                Rol en la empresa
                <select
                  value={newEmployeeRole}
                  onChange={(event) => setNewEmployeeRole(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none"
                >
                  <option value="Arquitecto/a">Arquitecto/a</option>
                  <option value="Ventas">Ventas</option>
                  <option value="Taller / CNC">Taller / CNC</option>
                  <option value="Instalación">Instalación</option>
                </select>
              </label>
            </div>
            <div className="mt-5 space-y-3 rounded-2xl border border-gray-100 bg-gray-50/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                Integrantes actuales
              </p>
              <div className="space-y-2">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{member.name}</p>
                      <p className="text-xs text-gray-500">{member.role}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingEmployeeId(member.id);
                          setNewEmployeeName(member.name);
                          setNewEmployeeRole(member.role);
                          setEmployeeError("");
                        }}
                        className="rounded-full border border-gray-200 px-3 py-1 text-[11px] font-semibold text-gray-600"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteEmployee(member.id)}
                        className="rounded-full border border-rose-200 px-3 py-1 text-[11px] font-semibold text-rose-600"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
                {teamMembers.length === 0 ? (
                  <p className="text-xs text-gray-400">Sin integrantes registrados.</p>
                ) : null}
              </div>
            </div>
            {employeeError ? (
              <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-600">
                {employeeError}
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEmployeeModalOpen(false)}
                className="rounded-2xl border border-gray-200 bg-white px-5 py-2 text-xs font-semibold text-gray-600"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={editingEmployeeId ? handleUpdateEmployee : handleCreateEmployee}
                className="rounded-2xl bg-[#8B1C1C] px-5 py-2 text-xs font-semibold text-white"
              >
                {editingEmployeeId ? "Guardar cambios" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
