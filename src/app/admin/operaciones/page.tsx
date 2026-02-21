"use client";

import { useEffect, useMemo, useState } from "react";
import { GripVertical } from "lucide-react";

const teamMembers = [
  { id: "e1", name: "Valeria", role: "Diseño", color: "bg-purple-100 text-purple-700" },
  { id: "e2", name: "Carlos", role: "CNC / Producción", color: "bg-blue-100 text-blue-700" },
  { id: "e3", name: "Luis", role: "Instalación", color: "bg-orange-100 text-orange-700" },
];

const columns = ["Pendiente", "Corte CNC", "Ensamble", "Instalación", "Completado"];

type Task = {
  id: string;
  title: string;
  client: string;
  column: string;
  assignedTo: string | null;
};

const initialTasks: Task[] = [
  { id: "t1", title: "Cocina Lineal", client: "Mariana Fuentes", column: "Pendiente", assignedTo: null },
  { id: "t2", title: "Closet Principal", client: "Héctor Salas", column: "Corte CNC", assignedTo: "e2" },
  { id: "t3", title: "TV Unit Minimal", client: "Grupo Aranda", column: "Ensamble", assignedTo: "e1" },
  { id: "t4", title: "Isla con granito", client: "Fabiola Martínez", column: "Instalación", assignedTo: "e3" },
];

const STORAGE_KEY = "kuche_kanban_tasks";

const initialsFromName = (value: string) =>
  value
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

export default function OperacionesPage() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [draggedMemberId, setDraggedMemberId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskClient, setNewTaskClient] = useState("");
  const [newTaskColumn, setNewTaskColumn] = useState(columns[0]);
  const [newTaskAssignee, setNewTaskAssignee] = useState<string | null>(null);
  const [taskError, setTaskError] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setTasks(parsed);
      }
    } catch {
      // ignore corrupted storage
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const tasksByColumn = useMemo(() => {
    return columns.reduce<Record<string, Task[]>>((acc, column) => {
      acc[column] = tasks.filter((task) => task.column === column);
      return acc;
    }, {});
  }, [tasks]);

  const handleTaskDragStart = (taskId: string) => {
    setDraggedTaskId(taskId);
    setDraggedMemberId(null);
  };

  const handleMemberDragStart = (memberId: string) => {
    setDraggedMemberId(memberId);
    setDraggedTaskId(null);
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

  const handleDropOnTask = (taskId: string) => {
    if (!draggedMemberId) {
      return;
    }
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, assignedTo: draggedMemberId } : task)),
    );
    setDraggedMemberId(null);
    setDragOverTaskId(null);
  };

  const getMemberById = (id: string | null) => teamMembers.find((member) => member.id === id);

  const handleCreateTask = () => {
    const trimmedTitle = newTaskTitle.trim();
    const trimmedClient = newTaskClient.trim();
    if (!trimmedTitle || !trimmedClient) {
      setTaskError("Completa el título y el cliente.");
      return;
    }
    const newTask: Task = {
      id: `t${Date.now().toString(36)}`,
      title: trimmedTitle,
      client: trimmedClient,
      column: newTaskColumn,
      assignedTo: newTaskAssignee,
    };
    setTasks((prev) => [...prev, newTask]);
    setIsTaskModalOpen(false);
    setNewTaskTitle("");
    setNewTaskClient("");
    setNewTaskColumn(columns[0]);
    setNewTaskAssignee(null);
    setTaskError("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operaciones y Taller</h1>
          <p className="mt-2 text-sm text-gray-500">
            Organiza el flujo de producción y asigna responsables por tarea.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setNewTaskTitle("");
            setNewTaskClient("");
            setNewTaskColumn(columns[0]);
            setNewTaskAssignee(null);
            setTaskError("");
            setIsTaskModalOpen(true);
          }}
          className="rounded-2xl bg-[#8B1C1C] px-5 py-2.5 text-sm font-semibold text-white shadow-sm"
        >
          Nueva tarea
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 lg:gap-8">
        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Equipo Activo</h2>
            <span className="text-xs text-gray-400">Arrastra para asignar</span>
          </div>
          <div className="space-y-3">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                draggable
                onDragStart={() => handleMemberDragStart(member.id)}
                className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3 text-sm text-gray-700 shadow-sm"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold ${member.color}`}
                >
                  {initialsFromName(member.name)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{member.name}</p>
                  <p className="text-xs text-gray-500">{member.role}</p>
                </div>
                <GripVertical className="h-4 w-4 text-gray-300" />
              </div>
            ))}
          </div>
        </section>

        <section className="lg:col-span-3">
          <div className="flex gap-4 overflow-x-auto pb-4">
            {columns.map((column) => (
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
                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={() => handleTaskDragStart(task.id)}
                        onDragOver={(event) => {
                          if (!draggedMemberId) {
                            return;
                          }
                          event.preventDefault();
                          setDragOverTaskId(task.id);
                        }}
                        onDrop={() => handleDropOnTask(task.id)}
                        onDragLeave={() => setDragOverTaskId(null)}
                        className={`cursor-grab rounded-xl border bg-white p-4 shadow-sm transition active:cursor-grabbing ${
                          dragOverTaskId === task.id ? "border-[#8B1C1C]/40" : "border-gray-100"
                        }`}
                      >
                        <p className="text-sm font-semibold text-gray-900">{task.title}</p>
                        <p className="text-xs text-gray-500">{task.client}</p>
                        <div className="mt-4">
                          {assignedMember ? (
                            <div className="flex items-center gap-2">
                              <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold ${assignedMember.color}`}
                              >
                                {initialsFromName(assignedMember.name)}
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-gray-700">
                                  {assignedMember.name}
                                </p>
                                <p className="text-[10px] text-gray-400">{assignedMember.role}</p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400">Sin asignar</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {isTaskModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-lg rounded-3xl border border-white/70 bg-white/95 p-6 shadow-2xl backdrop-blur">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Nueva tarea</h3>
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
                  placeholder="Ej. Cocina en L"
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
                Columna
                <select
                  value={newTaskColumn}
                  onChange={(event) => setNewTaskColumn(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none"
                >
                  {columns.map((column) => (
                    <option key={column} value={column}>
                      {column}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-semibold text-gray-500">
                Asignado
                <select
                  value={newTaskAssignee ?? ""}
                  onChange={(event) =>
                    setNewTaskAssignee(event.target.value ? event.target.value : null)
                  }
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none"
                >
                  <option value="">Sin asignar</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
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
                Guardar tarea
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
