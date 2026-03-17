"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  Calculator,
  FileText,
  Loader2,
  MapPin,
  PencilLine,
  RefreshCw,
  Trash2,
  UserPlus,
} from "lucide-react";

import { useEscapeClose } from "@/hooks/useEscapeClose";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useAdminWorkflow } from "@/contexts/AdminWorkflowContext";
import {
  getAssignedLabel,
  type AdminWorkflowTask,
} from "@/lib/admin-workflow";
import { listarEmpleados, type Usuario } from "@/lib/axios/usuariosApi";
import { kanbanColumns, type TaskPriority, type TaskStage, type TaskStatus } from "@/lib/kanban";

const stageStyles: Record<TaskStage, { border: string; badge: string }> = {
  citas: { border: "border-sky-500", badge: "bg-sky-50 text-sky-600" },
  disenos: { border: "border-violet-500", badge: "bg-violet-50 text-violet-600" },
  cotizacion: { border: "border-emerald-500", badge: "bg-emerald-50 text-emerald-600" },
  contrato: { border: "border-amber-500", badge: "bg-amber-50 text-amber-700" },
};

const priorityStyles: Record<TaskPriority, string> = {
  alta: "bg-rose-100 text-rose-700",
  media: "bg-amber-100 text-amber-700",
  baja: "bg-emerald-100 text-emerald-700",
};

const statusStyles: Record<TaskStatus, string> = {
  pendiente: "bg-rose-50 text-rose-600",
  completada: "bg-emerald-50 text-emerald-600",
};

type TaskDraft = {
  title: string;
  project: string;
  assignedToId: string;
  notes: string;
  priority: TaskPriority;
  dueDate: string;
  location: string;
  mapsUrl: string;
  stage: TaskStage;
  status: TaskStatus;
  designApprovedByAdmin: boolean;
  followUpStatus: AdminWorkflowTask["followUpStatus"];
};

const emptyDraft: TaskDraft = {
  title: "",
  project: "",
  assignedToId: "",
  notes: "",
  priority: "media",
  dueDate: "",
  location: "",
  mapsUrl: "",
  stage: "citas",
  status: "pendiente",
  designApprovedByAdmin: false,
  followUpStatus: "pendiente",
};

const formatDate = (date?: string) => {
  if (!date) return "Sin fecha";
  return new Date(date).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
};

const formatTime = (isoDate?: string) => {
  if (!isoDate) return null;
  try {
    return new Intl.DateTimeFormat("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(isoDate));
  } catch {
    return null;
  }
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

export default function OperacionesPage() {
  const router = useRouter();
  const { refresh, moveTask, updateTask, createTask, deleteTask } = useAdminWorkflow();
  const [tasks, setTasks] = useState<AdminWorkflowTask[]>([]);
  const [employees, setEmployees] = useState<Usuario[]>([]);
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState<string>("Todos");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [taskDraft, setTaskDraft] = useState<TaskDraft>(emptyDraft);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newTaskProject, setNewTaskProject] = useState("");
  const [newTaskStage, setNewTaskStage] = useState<TaskStage>("citas");
  const [newTaskAssignedTo, setNewTaskAssignedTo] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>("media");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskLocation, setNewTaskLocation] = useState("");
  const [newTaskMapsUrl, setNewTaskMapsUrl] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);
  const taskModalRef = useRef<HTMLDivElement | null>(null);
  const createModalRef = useRef<HTMLDivElement | null>(null);

  useEscapeClose(isTaskModalOpen, () => setIsTaskModalOpen(false));
  useEscapeClose(isCreateModalOpen, () => setIsCreateModalOpen(false));
  useFocusTrap(isTaskModalOpen, taskModalRef);
  useFocusTrap(isCreateModalOpen, createModalRef);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const employeesResponse = await listarEmpleados();
      if (employeesResponse.success && employeesResponse.data) {
        setEmployees(employeesResponse.data);
      }

      const loadedTasks = await refresh();
      setTasks(loadedTasks);
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "No se pudieron cargar las operaciones");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const activeTask = useMemo(
    () => tasks.find((task) => task.id === activeTaskId) ?? null,
    [activeTaskId, tasks],
  );

  useEffect(() => {
    if (!activeTask) {
      setTaskDraft(emptyDraft);
      return;
    }
    setTaskDraft({
      title: activeTask.title,
      project: activeTask.project,
      assignedToId: activeTask.assignedToIds[0] ?? "",
      notes: activeTask.notes ?? "",
      priority: activeTask.priority ?? "media",
      dueDate: activeTask.dueDate ?? "",
      location: activeTask.location ?? "",
      mapsUrl: activeTask.mapsUrl ?? "",
      stage: activeTask.stage,
      status: activeTask.status,
      designApprovedByAdmin: Boolean(activeTask.designApprovedByAdmin),
      followUpStatus: activeTask.followUpStatus ?? "pendiente",
    });
  }, [activeTask]);

  const filteredTasks = useMemo(() => {
    if (selectedEmployeeFilter === "Todos") return tasks;
    return tasks.filter((task) =>
      task.assignedToIds.includes(selectedEmployeeFilter) ||
      task.assignedTo.some((name) => employees.find((employee) => employee._id === selectedEmployeeFilter)?.nombre === name),
    );
  }, [employees, selectedEmployeeFilter, tasks]);

  const openTaskModal = (taskId: string) => {
    setActiveTaskId(taskId);
    setModalError(null);
    setIsTaskModalOpen(true);
  };

  const openCreateModal = () => {
    setModalError(null);
    setNewTaskProject("");
    setNewTaskStage("citas");
    setNewTaskAssignedTo(employees[0]?._id ?? "");
    setNewTaskPriority("media");
    setNewTaskDueDate("");
    setNewTaskLocation("");
    setNewTaskMapsUrl("");
    setIsCreateModalOpen(true);
  };

  const moveTaskToStage = async (task: AdminWorkflowTask, stage: TaskStage) => {
    await moveTask(task, stage);
  };

  const handleDrop = async (stage: TaskStage) => {
    if (!draggedTaskId) return;
    const task = tasks.find((currentTask) => currentTask.id === draggedTaskId);
    setDraggedTaskId(null);
    if (!task || task.stage === stage) return;

    try {
      setIsSaving(true);
      await moveTaskToStage(task, stage);
      await loadData();
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "No se pudo mover la tarea");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateTask = async () => {
    const project = newTaskProject.trim();
    if (!project) {
      setModalError("Completa proyecto o cliente.");
      return;
    }

    try {
      setIsSaving(true);
      await createTask({
        titulo: project,
        proyecto: project,
        nombreProyecto: project,
        etapa: newTaskStage,
        estado: "pendiente",
        asignadoA: newTaskAssignedTo ? [newTaskAssignedTo] : [],
        prioridad: newTaskPriority,
        fechaLimite: newTaskDueDate || undefined,
        ubicacion: newTaskLocation.trim() || undefined,
        mapsUrl: newTaskMapsUrl.trim() || undefined,
        codigoProyecto: `K-${Date.now()}`,
      });
      setIsCreateModalOpen(false);
      await loadData();
    } catch (currentError) {
      setModalError(currentError instanceof Error ? currentError.message : "No se pudo crear la tarea");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTask = async () => {
    if (!activeTask) return;

    try {
      setIsSaving(true);
      await updateTask(activeTask, {
        title: taskDraft.title.trim() || activeTask.title,
        project: taskDraft.project.trim() || activeTask.project,
        notes: taskDraft.notes,
        priority: taskDraft.priority,
        dueDate: taskDraft.dueDate || undefined,
        location: taskDraft.location.trim() || undefined,
        mapsUrl: taskDraft.mapsUrl.trim() || undefined,
        stage: taskDraft.stage,
        status: taskDraft.status,
        assignedToIds: taskDraft.assignedToId ? [taskDraft.assignedToId] : [],
        assignedTo: taskDraft.assignedToId
          ? [employees.find((employee) => employee._id === taskDraft.assignedToId)?.nombre ?? "Sin asignar"]
          : ["Sin asignar"],
        designApprovedByAdmin: taskDraft.designApprovedByAdmin,
        followUpStatus: taskDraft.followUpStatus,
      });
      setIsTaskModalOpen(false);
      await loadData();
    } catch (currentError) {
      setModalError(currentError instanceof Error ? currentError.message : "No se pudo guardar la tarea");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!activeTask) return;

    try {
      setIsSaving(true);
      await deleteTask(activeTask);
      setIsTaskModalOpen(false);
      await loadData();
    } catch (currentError) {
      setModalError(currentError instanceof Error ? currentError.message : "No se pudo eliminar la tarea");
    } finally {
      setIsSaving(false);
    }
  };

  const columns = kanbanColumns.map((column) => ({
    ...column,
    tasks: filteredTasks.filter((task) => task.stage === column.id),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-secondary">
            Operaciones y taller
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900">
            Control de tareas y asignaciones
          </h1>
          <p className="mt-2 text-sm text-secondary">
            Toda la información del tablero se consume y persiste en backend.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedEmployeeFilter}
            onChange={(event) => setSelectedEmployeeFilter(event.target.value)}
            className="rounded-2xl border border-primary/10 bg-white px-4 py-2.5 text-sm font-medium text-secondary shadow-sm outline-none"
          >
            <option value="Todos">Ver todo</option>
            {employees.map((employee) => (
              <option key={employee._id} value={employee._id}>
                {employee.nombre}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void loadData()}
            className="flex items-center gap-2 rounded-2xl border border-primary/10 bg-white px-4 py-2.5 text-sm font-semibold text-secondary shadow-sm transition hover:bg-primary/5"
          >
            <RefreshCw className="h-4 w-4" />
            Recargar
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            <UserPlus className="h-4 w-4" />
            Asignar pendiente
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex items-center gap-3 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg backdrop-blur-md">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando tablero...
        </div>
      ) : (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid gap-4 xl:grid-cols-4"
        >
          {columns.map((column) => (
            <div
              key={column.id}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => void handleDrop(column.id)}
              className={`rounded-3xl border bg-white/80 p-4 shadow-lg backdrop-blur-md ${stageStyles[column.id].border}`}
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">{column.label}</h2>
                  <p className="text-xs text-secondary">{column.tasks.length} elementos</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${stageStyles[column.id].badge}`}>
                  {column.id}
                </span>
              </div>

              <div className="space-y-3">
                {column.tasks.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-primary/10 bg-white/50 px-4 py-6 text-center text-xs text-secondary">
                    Sin tareas en esta etapa.
                  </div>
                ) : (
                  column.tasks.map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      draggable
                      onDragStart={() => setDraggedTaskId(task.id)}
                      onClick={() => openTaskModal(task.id)}
                      className="w-full rounded-2xl border border-primary/10 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{task.project}</p>
                          <p className="mt-1 text-xs text-secondary">{task.title}</p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${priorityStyles[task.priority ?? "media"]}`}>
                          {task.priority ?? "media"}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-secondary">
                        <span className={`rounded-full px-2.5 py-1 font-semibold ${statusStyles[task.status]}`}>
                          {task.status}
                        </span>
                        <span>Asignado: {getAssignedLabel(task)}</span>
                      </div>
                      {task.scheduledAt ? (
                        <div className="mt-3 rounded-2xl bg-slate-50 px-3 py-2 text-[11px] text-secondary">
                          <p className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" />
                            <span>Fecha: {formatDate(task.scheduledAt.slice(0, 10))}</span>
                          </p>
                          {formatTime(task.scheduledAt) ? (
                            <p className="mt-1 pl-[18px]">Hora: {formatTime(task.scheduledAt)}</p>
                          ) : null}
                        </div>
                      ) : null}
                      {(task.location || (task.dueDate && !task.scheduledAt)) ? (
                        <div className="mt-3 space-y-1 text-[11px] text-secondary">
                          {task.location ? (
                            <p className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {task.location}
                            </p>
                          ) : null}
                          {task.dueDate && !task.scheduledAt ? (
                            <p className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(task.dueDate)}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </button>
                  ))
                )}
              </div>
            </div>
          ))}
        </motion.section>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg backdrop-blur-md">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <Calculator className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-[0.3em] text-secondary">Cotización</p>
              <h3 className="mt-1 text-xl font-semibold">Cotizador Pro</h3>
              <p className="mt-2 text-sm text-secondary">
                Genera estimaciones detalladas con desglose técnico completo para taller y cliente.
              </p>
              <button
                type="button"
                onClick={() => router.push("/dashboard/cotizador")}
                className="mt-4 rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
              >
                Abrir Cotizador Pro
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg backdrop-blur-md">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10">
              <FileText className="h-6 w-6 text-accent" />
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-[0.3em] text-secondary">Cotización</p>
              <h3 className="mt-1 text-xl font-semibold">Cotizador Preliminar</h3>
              <p className="mt-2 text-sm text-secondary">
                Crea una estimación rápida para prospectos antes de formalizar el proyecto.
              </p>
              <button
                type="button"
                onClick={() => router.push("/dashboard/cotizador-preliminar")}
                className="mt-4 rounded-2xl border border-primary/20 bg-white px-5 py-2.5 text-sm font-semibold text-primary shadow-sm transition hover:border-primary/40"
              >
                Abrir Preliminar
              </button>
            </div>
          </div>
        </div>
      </div>

      {isCreateModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            ref={createModalRef}
            tabIndex={-1}
            className="w-full max-w-lg rounded-3xl border border-white/70 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Asignar pendiente</h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-full border border-primary/10 px-3 py-1 text-xs font-semibold text-secondary"
              >
                Cerrar
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                Proyecto / Cliente
                <input
                  value={newTaskProject}
                  onChange={(event) => setNewTaskProject(event.target.value)}
                  placeholder="Ej. Residencial Vega"
                  className="mt-2 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                Etapa inicial
                <select
                  value={newTaskStage}
                  onChange={(event) => setNewTaskStage(event.target.value as TaskStage)}
                  className="mt-2 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                >
                  {kanbanColumns.map((column) => (
                    <option key={column.id} value={column.id}>
                      {column.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                Asignar a
                <select
                  value={newTaskAssignedTo}
                  onChange={(event) => setNewTaskAssignedTo(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                >
                  <option value="">Sin asignar</option>
                  {employees.map((employee) => (
                    <option key={employee._id} value={employee._id}>
                      {employee.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                Prioridad
                <select
                  value={newTaskPriority}
                  onChange={(event) => setNewTaskPriority(event.target.value as TaskPriority)}
                  className="mt-2 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                >
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                </select>
              </label>
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                Fecha límite
                <input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(event) => setNewTaskDueDate(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                Dirección / Localidad
                <input
                  value={newTaskLocation}
                  onChange={(event) => setNewTaskLocation(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                Enlace de Google Maps
                <input
                  type="url"
                  value={newTaskMapsUrl}
                  onChange={(event) => setNewTaskMapsUrl(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                />
              </label>
            </div>
            {modalError ? (
              <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-600">
                {modalError}
              </p>
            ) : null}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-2xl border border-primary/10 bg-white px-5 py-2 text-xs font-semibold text-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleCreateTask()}
                disabled={isSaving}
                className="rounded-2xl bg-primary px-5 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                Guardar pendiente
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <AnimatePresence>
        {isTaskModalOpen && activeTask ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => setIsTaskModalOpen(false)}
          >
            <motion.aside
              ref={taskModalRef}
              tabIndex={-1}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
              className="absolute right-0 top-0 flex h-full w-full max-w-lg flex-col rounded-l-3xl border border-white/40 bg-white/95 shadow-2xl backdrop-blur-md"
              onClick={(event) => event.stopPropagation()}
            >
              {/* Header fijo */}
              <div className="flex items-start justify-between gap-4 border-b border-primary/10 px-6 py-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-secondary">
                    Detalle de tarea
                  </p>
                  <h3 className="mt-1 text-xl font-semibold text-gray-900">
                    {activeTask.project}
                  </h3>
                  <p className="mt-0.5 text-sm text-secondary">{activeTask.title}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${stageStyles[activeTask.stage].badge}`}>
                      {kanbanColumns.find((col) => col.id === activeTask.stage)?.label ?? activeTask.stage}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[activeTask.status]}`}>
                      {activeTask.status}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityStyles[activeTask.priority ?? "media"]}`}>
                      {activeTask.priority ?? "media"}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="shrink-0 rounded-full border border-primary/10 px-3 py-2 text-xs font-semibold text-secondary transition hover:bg-primary/5"
                >
                  Cerrar
                </button>
              </div>

              {/* Contenido con scroll */}
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <div className="space-y-6">

                  {/* Responsable */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                      Responsable
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {getInitials(
                          employees.find((emp) => emp._id === taskDraft.assignedToId)?.nombre ??
                          activeTask.assignedTo[0] ??
                          "?"
                        )}
                      </span>
                      <select
                        value={taskDraft.assignedToId}
                        onChange={(event) => setTaskDraft((prev) => ({ ...prev, assignedToId: event.target.value }))}
                        className="w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm font-semibold text-gray-900 outline-none"
                      >
                        <option value="">Sin asignar</option>
                        {employees.map((employee) => (
                          <option key={employee._id} value={employee._id}>
                            {employee.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Configuración: etapa / estado / prioridad */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                      Configuración
                    </p>
                    <div className="mt-3 grid grid-cols-3 gap-3">
                      <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-secondary">
                        Etapa
                        <select
                          value={taskDraft.stage}
                          onChange={(event) => setTaskDraft((prev) => ({ ...prev, stage: event.target.value as TaskStage }))}
                          className="mt-1.5 w-full rounded-2xl border border-primary/10 bg-white px-3 py-2.5 text-xs outline-none"
                        >
                          {kanbanColumns.map((column) => (
                            <option key={column.id} value={column.id}>
                              {column.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-secondary">
                        Estado
                        <select
                          value={taskDraft.status}
                          onChange={(event) => setTaskDraft((prev) => ({ ...prev, status: event.target.value as TaskStatus }))}
                          className="mt-1.5 w-full rounded-2xl border border-primary/10 bg-white px-3 py-2.5 text-xs outline-none"
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="completada">Completada</option>
                        </select>
                      </label>
                      <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-secondary">
                        Prioridad
                        <select
                          value={taskDraft.priority}
                          onChange={(event) => setTaskDraft((prev) => ({ ...prev, priority: event.target.value as TaskPriority }))}
                          className="mt-1.5 w-full rounded-2xl border border-primary/10 bg-white px-3 py-2.5 text-xs outline-none"
                        >
                          <option value="alta">Alta</option>
                          <option value="media">Media</option>
                          <option value="baja">Baja</option>
                        </select>
                      </label>
                    </div>
                  </div>

                  {/* Identificación: título + proyecto */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                      Identificación
                    </p>
                    <div className="mt-3 space-y-3">
                      <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-secondary">
                        Título
                        <input
                          value={taskDraft.title}
                          onChange={(event) => setTaskDraft((prev) => ({ ...prev, title: event.target.value }))}
                          className="mt-1.5 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                        />
                      </label>
                      <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-secondary">
                        Proyecto / Cliente
                        <input
                          value={taskDraft.project}
                          onChange={(event) => setTaskDraft((prev) => ({ ...prev, project: event.target.value }))}
                          className="mt-1.5 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Agenda */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                      Agenda
                    </p>
                    <div className="mt-3 space-y-3">
                      <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-secondary">
                        Fecha límite
                        <input
                          type="date"
                          value={taskDraft.dueDate}
                          onChange={(event) => setTaskDraft((prev) => ({ ...prev, dueDate: event.target.value }))}
                          className="mt-1.5 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                        />
                      </label>
                      <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-secondary">
                        Dirección / Localidad
                        <input
                          value={taskDraft.location}
                          onChange={(event) => setTaskDraft((prev) => ({ ...prev, location: event.target.value }))}
                          placeholder="Ej. Col. Roma Norte, CDMX"
                          className="mt-1.5 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                        />
                      </label>
                      <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-secondary">
                        Enlace Google Maps
                        <input
                          type="url"
                          value={taskDraft.mapsUrl}
                          onChange={(event) => setTaskDraft((prev) => ({ ...prev, mapsUrl: event.target.value }))}
                          placeholder="https://maps.google.com/..."
                          className="mt-1.5 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Aprobación de diseño (solo en etapa disenos) */}
                  {taskDraft.stage === "disenos" ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                        Diseño
                      </p>
                      <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-2xl bg-violet-50 px-4 py-4 text-sm text-violet-800">
                        <input
                          type="checkbox"
                          checked={taskDraft.designApprovedByAdmin}
                          onChange={(event) =>
                            setTaskDraft((prev) => ({ ...prev, designApprovedByAdmin: event.target.checked }))
                          }
                          className="h-4 w-4 accent-violet-600"
                        />
                        <div>
                          <p className="font-semibold">Diseño aprobado</p>
                          <p className="text-xs text-violet-600">Aprobación interna por administración</p>
                        </div>
                      </label>
                    </div>
                  ) : null}

                  {/* Seguimiento comercial (solo en etapa contrato) */}
                  {taskDraft.stage === "contrato" ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                        Seguimiento comercial
                      </p>
                      <div className="mt-3 flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-3">
                        <span className="text-xs font-semibold text-amber-700">Estado actual:</span>
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 capitalize">
                          {taskDraft.followUpStatus ?? "pendiente"}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => setTaskDraft((prev) => ({ ...prev, followUpStatus: "confirmado", status: "completada" }))}
                          className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                        >
                          ✓ Confirmar cliente
                        </button>
                        <button
                          type="button"
                          onClick={() => setTaskDraft((prev) => ({ ...prev, followUpStatus: "descartado", status: "completada" }))}
                          className="w-full rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700"
                        >
                          ✕ Descartar cliente
                        </button>
                        <button
                          type="button"
                          onClick={() => setTaskDraft((prev) => ({ ...prev, followUpStatus: "pendiente", status: "pendiente" }))}
                          className="w-full rounded-2xl border border-amber-300 bg-white px-4 py-3 text-sm font-semibold text-amber-800 transition hover:bg-amber-50"
                        >
                          ↺ Reactivar seguimiento
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {/* Notas */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                      Notas internas
                    </p>
                    <textarea
                      value={taskDraft.notes}
                      onChange={(event) => setTaskDraft((prev) => ({ ...prev, notes: event.target.value }))}
                      placeholder="Agrega detalles, avances o instrucciones para el equipo."
                      className="mt-3 min-h-[120px] w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                    />
                  </div>

                  {/* Archivos adjuntos (solo lectura desde backend) */}
                  {(activeTask.files ?? []).length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                        Archivos adjuntos
                      </p>
                      <div className="mt-3 space-y-2">
                        {(activeTask.files ?? []).map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm"
                          >
                            <span className="truncate">{file.name}</span>
                            <span className="ml-3 shrink-0 text-xs uppercase text-secondary">{file.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                </div>
              </div>

              {/* Footer con acciones fijo al fondo */}
              <div className="border-t border-primary/10 px-6 py-4">
                {modalError ? (
                  <p className="mb-3 rounded-2xl bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-600">
                    {modalError}
                  </p>
                ) : null}
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => void handleDeleteTask()}
                    disabled={isSaving}
                    className="flex items-center gap-2 rounded-2xl border border-rose-200 px-4 py-2.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsTaskModalOpen(false)}
                      className="rounded-2xl border border-primary/10 bg-white px-4 py-2.5 text-xs font-semibold text-secondary transition hover:bg-primary/5"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleSaveTask()}
                      disabled={isSaving}
                      className="flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                    >
                      {isSaving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <PencilLine className="h-3.5 w-3.5" />
                      )}
                      Guardar
                    </button>
                  </div>
                </div>
              </div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
