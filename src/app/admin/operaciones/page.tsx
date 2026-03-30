"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { UserPlus, Calculator, FileText, MapPin, Calendar, Loader2, CheckCircle2, Clock, PencilLine } from "lucide-react";

import { useEscapeClose } from "@/hooks/useEscapeClose";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useAdminWorkflow } from "@/contexts/AdminWorkflowContext";
import {
  activeCitaTaskStorageKey,
  activeCotizacionFormalTaskStorageKey,
  citaReturnUrlStorageKey,
  finishedCitaTaskStorageKey,
  kanbanColumns,
  kanbanStorageKey,
  type TaskStage,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/kanban";
import { runtimeStore } from "@/lib/runtime-store";
import { crearUsuario, listarEmpleados, listarUsuarios, type Usuario } from "@/lib/axios/usuariosApi";
import type { AdminWorkflowTask } from "@/lib/admin-workflow";
import { VisitScheduleModal } from "@/components/admin/VisitScheduleModal";

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

const statusStyles: Record<"pendiente" | "completada", string> = {
  pendiente: "bg-sky-50 text-sky-600",
  completada: "bg-emerald-50 text-emerald-700",
};

const formatDate = (date?: string) => {
  if (!date) return "Sin fecha";
  return new Date(date).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
};

const pad = (value: number) => value.toString().padStart(2, "0");

const toLocalSlot = (isoDateTime?: string) => {
  if (!isoDateTime) return null;
  const date = new Date(isoDateTime);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const formatDateTime = (isoDateTime?: string) => {
  if (!isoDateTime) return "Sin agenda";
  const date = new Date(isoDateTime);
  if (Number.isNaN(date.getTime())) return "Sin agenda";
  return date.toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const FOLLOW_UP_WARNING_DAYS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

const getFollowUpDays = (enteredAt?: number, createdAt?: number, now = Date.now()) => {
  const reference = enteredAt ?? createdAt;
  if (!reference) return 0;
  return Math.max(0, Math.floor((now - reference) / DAY_MS));
};

type TaskDraft = {
  title: string;
  project: string;
  assignedToIds: string[];
  notes: string;
  priority: TaskPriority;
  dueDate: string;
  location: string;
  mapsUrl: string;
  stage: TaskStage;
  status: TaskStatus;
};

const emptyDraft: TaskDraft = {
  title: "",
  project: "",
  assignedToIds: [],
  notes: "",
  priority: "media",
  dueDate: "",
  location: "",
  mapsUrl: "",
  stage: "citas",
  status: "pendiente",
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const prettyJson = (value: unknown) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "No se pudo serializar a JSON";
  }
};

export default function OperacionesPage() {
  const router = useRouter();
  const { tasks, isLoading, refresh, moveTask, updateTask, createTask } = useAdminWorkflow();
  
  const [employees, setEmployees] = useState<Usuario[]>([]);
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState<string>("Todos");
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [assignError, setAssignError] = useState("");
  const [teamError, setTeamError] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<Usuario["rol"]>("empleado");
  const [newMemberPassword, setNewMemberPassword] = useState("");
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newTaskProject, setNewTaskProject] = useState("");
  const [newTaskStage, setNewTaskStage] = useState<TaskStage>("citas");
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>("media");
  const [newTaskAssignedToIds, setNewTaskAssignedToIds] = useState<string[]>([]);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [visitModalTaskId, setVisitModalTaskId] = useState<string | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskDraft, setTaskDraft] = useState<TaskDraft>(emptyDraft);
  const [taskModalError, setTaskModalError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [isApplyingFinishedCita, setIsApplyingFinishedCita] = useState(false);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const assignModalRef = useRef<HTMLDivElement | null>(null);
  const teamModalRef = useRef<HTMLDivElement | null>(null);
  const taskModalRef = useRef<HTMLDivElement | null>(null);

  useEscapeClose(isAssignModalOpen, () => setIsAssignModalOpen(false));
  useEscapeClose(isTeamModalOpen, () => setIsTeamModalOpen(false));
  useEscapeClose(isTaskModalOpen, () => setIsTaskModalOpen(false));
  useFocusTrap(isAssignModalOpen, assignModalRef);
  useFocusTrap(isTeamModalOpen, teamModalRef);
  useFocusTrap(isTaskModalOpen, taskModalRef);

  const loadEmployees = async () => {
    const usersResponse = await listarUsuarios().catch(() => null);
    const employeesResponse = await listarEmpleados().catch(() => null);

    const source =
      usersResponse?.success && usersResponse.data
        ? usersResponse.data
        : employeesResponse?.success && employeesResponse.data
          ? employeesResponse.data
          : [];

    const activeUsers = source.filter((user) => user.activo !== false);
    setEmployees(activeUsers);

    if (activeUsers.length > 0) {
      console.log("[Operaciones] users for assignment JSON:\n", prettyJson(activeUsers));
    }
  };

  useEffect(() => {
    void refresh();
    void loadEmployees();
  }, [refresh]);

  useEffect(() => {
    const interval = setInterval(() => {
      setClockNow(Date.now());
      void refresh();
    }, 60_000);

    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    console.log("[Operaciones] tasks JSON:\n", prettyJson(tasks));
  }, [tasks]);

  useEffect(() => {
    const finishedTaskId = runtimeStore.getItem(finishedCitaTaskStorageKey);
    if (!finishedTaskId || isApplyingFinishedCita) return;

    const task = tasks.find((currentTask) => currentTask.id === finishedTaskId);
    if (!task) return;

    const alreadyFinished =
      task.status === "completada" &&
      task.citaFinished === true &&
      (task.priority ?? "media") === "alta";

    if (alreadyFinished) {
      runtimeStore.removeItem(finishedCitaTaskStorageKey);
      return;
    }

    setIsApplyingFinishedCita(true);
    void (async () => {
      try {
        await updateTask(task, {
          citaStarted: true,
          citaFinished: true,
          status: "completada",
          priority: "alta",
        });
      } catch (error) {
        console.error("[Operaciones] Error al sincronizar cierre de cita desde cotizador:", error);
      } finally {
        runtimeStore.removeItem(finishedCitaTaskStorageKey);
        setIsApplyingFinishedCita(false);
      }
    })();
  }, [isApplyingFinishedCita, tasks, updateTask]);

  const handleAssignPending = async () => {
    const project = newTaskProject.trim();
    if (!project) {
      setAssignError("Ingresa un proyecto o cliente.");
      return;
    }
    try {
      setIsSaving(true);
      await createTask({
        titulo: project,
        etapa: newTaskStage,
        estado: "pendiente",
        asignadoA: newTaskAssignedToIds,
        proyecto: project,
        nombreProyecto: project,
        prioridad: newTaskPriority,
        codigoProyecto: `OP-${Date.now()}`,
      });
      setAssignError("");
      setIsAssignModalOpen(false);
      setNewTaskProject("");
      setNewTaskStage("citas");
      setNewTaskPriority("media");
      setNewTaskAssignedToIds([]);
    } catch (error) {
      setAssignError(error instanceof Error ? error.message : "Error al asignar");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTaskAction = async (task: AdminWorkflowTask, action: string) => {
    try {
      setIsSaving(true);
      setActionFeedback(null);

      if (action === "start-cita") {
        await updateTask(task, { citaStarted: true, status: "pendiente" });
        runtimeStore.setItem(kanbanStorageKey, JSON.stringify(tasks));
        runtimeStore.setItem(activeCitaTaskStorageKey, task.id);
        runtimeStore.setItem(citaReturnUrlStorageKey, window.location.pathname);
        router.push("/dashboard/cotizador-preliminar");
      }
      if (action === "finish-cita") {
        await updateTask(task, { citaFinished: true, status: "completada", priority: "alta" });
      }
      if (action === "approve-design-admin") {
        await updateTask(task, { designApprovedByAdmin: true });
        setVisitModalTaskId(task.id);
      }
      if (action === "approve-design-client") {
        await updateTask(task, {
          designApprovedByClient: true,
          stage: "cotizacion",
          status: "pendiente",
          citaStarted: false,
          citaFinished: false,
        });
      }
      if (action === "start-cotizacion") {
        await updateTask(task, { citaStarted: true, citaFinished: false, status: "pendiente" });
        runtimeStore.setItem(activeCotizacionFormalTaskStorageKey, task.id);
        runtimeStore.setItem(citaReturnUrlStorageKey, window.location.pathname);
        router.push("/dashboard/cotizador");
      }
      if (action === "finish-cotizacion") {
        await updateTask(task, { citaFinished: true, status: "completada", priority: "alta" });
      }
      if (action === "pass-to-seguimiento") {
        await updateTask(task, {
          stage: "contrato",
          status: "pendiente",
          followUpStatus: "pendiente",
          followUpEnteredAt: Date.now(),
          citaStarted: false,
          citaFinished: false,
        });
      }
      if (action === "confirm-client") {
        await updateTask(task, { followUpStatus: "confirmado", status: "completada" });
        const reloaded = await refresh();
        const updated = reloaded.find((item) => item.id === task.id);
        if (updated?.followUpStatus !== "confirmado") {
          setActionFeedback("El backend no guardo 'confirmado'. Revisa el contrato del endpoint PATCH /api/tareas/:id.");
        } else {
          setActionFeedback("Cliente confirmado correctamente.");
        }
      }
      if (action === "discard-client") {
        await updateTask(task, { followUpStatus: "inactivo", status: "completada" });
        const reloaded = await refresh();
        const updated = reloaded.find((item) => item.id === task.id);
        if (updated?.followUpStatus !== "inactivo") {
          setActionFeedback("El backend no guardo 'inactivo'. Revisa el contrato del endpoint PATCH /api/tareas/:id.");
        } else {
          setActionFeedback("Proyecto marcado como inactivo correctamente.");
        }
      }
      if (action === "reactivate-client") {
        await updateTask(task, {
          followUpStatus: "pendiente",
          status: "pendiente",
          followUpEnteredAt: Date.now(),
        });
        setActionFeedback("Seguimiento reactivado.");
      }
    } catch (error) {
      console.error("Error de acción de tarjeta:", error);
      setActionFeedback(error instanceof Error ? error.message : "No se pudo completar la accion.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddMember = async () => {
    const nombre = newMemberName.trim();
    const correo = newMemberEmail.trim();
    const password = newMemberPassword.trim();

    if (!nombre || !correo) {
      setTeamError("Nombre y correo son obligatorios.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      setTeamError("Ingresa un correo valido.");
      return;
    }

    try {
      setIsSaving(true);
      setTeamError("");

      const response = await crearUsuario({
        nombre,
        correo,
        rol: newMemberRole,
        password: password || undefined,
      });

      if (!response.success) {
        throw new Error(response.message || "No se pudo crear el integrante");
      }

      setNewMemberName("");
      setNewMemberEmail("");
      setNewMemberRole("empleado");
      setNewMemberPassword("");
      await loadEmployees();
    } catch (error) {
      setTeamError(error instanceof Error ? error.message : "No se pudo crear el integrante");
    } finally {
      setIsSaving(false);
    }
  };

  const openAssignModal = () => {
    setAssignError("");
    setNewTaskProject("");
    setNewTaskStage("citas");
    setNewTaskPriority("media");
    setNewTaskAssignedToIds([]);
    setIsAssignModalOpen(true);
  };

  const openTeamModal = () => {
    setTeamError("");
    setNewMemberName("");
    setNewMemberEmail("");
    setNewMemberRole("empleado");
    setNewMemberPassword("");
    setIsTeamModalOpen(true);
  };

  const filteredTasks = useMemo(() => {
    if (selectedEmployeeFilter === "Todos") return tasks;
    return tasks.filter((task) =>
      task.assignedToIds.includes(selectedEmployeeFilter)
    );
  }, [selectedEmployeeFilter, tasks]);

  const columns = kanbanColumns.map((column) => ({
    ...column,
    tasks: filteredTasks.filter((task) => task.stage === column.id),
  }));

  const activeTask = useMemo(
    () => tasks.find((task) => task.id === activeTaskId) ?? null,
    [activeTaskId, tasks],
  );

  const visitModalTask = useMemo(
    () => tasks.find((task) => task.id === visitModalTaskId) ?? null,
    [tasks, visitModalTaskId],
  );

  const occupiedVisitSlots = useMemo(
    () =>
      tasks
        .filter((task) => task.id !== visitModalTaskId)
        .map((task) => toLocalSlot(task.visitScheduledAt ?? task.scheduledAt ?? task.cita?.fechaAgendada))
        .filter((slot): slot is string => Boolean(slot)),
    [tasks, visitModalTaskId],
  );

  const handleSaveVisitForTask = async (task: AdminWorkflowTask, isoDateTime: string) => {
    try {
      setIsSaving(true);
      await updateTask(task, {
        designApprovedByAdmin: true,
        visitScheduledAt: isoDateTime,
      });
      setVisitModalTaskId(null);
    } catch (error) {
      console.error("Error al agendar visita:", error);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!activeTask) {
      setTaskDraft(emptyDraft);
      return;
    }
    setTaskDraft({
      title: activeTask.title || "",
      project: activeTask.project || "",
      assignedToIds: activeTask.assignedToIds ?? [],
      notes: activeTask.notes ?? "",
      priority: activeTask.priority ?? "media",
      dueDate: activeTask.dueDate ?? "",
      location: activeTask.location ?? "",
      mapsUrl: activeTask.mapsUrl ?? "",
      stage: activeTask.stage,
      status: activeTask.status,
    });
  }, [activeTask]);

  const openTaskModal = (taskId: string) => {
    setTaskModalError(null);
    setActiveTaskId(taskId);
    setIsTaskModalOpen(true);
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
        assignedToIds: taskDraft.assignedToIds,
        assignedTo:
          taskDraft.assignedToIds.length > 0
            ? taskDraft.assignedToIds
                .map((employeeId) => employees.find((employee) => employee._id === employeeId)?.nombre)
                .filter((name): name is string => Boolean(name && name.trim().length > 0))
            : ["Sin asignar"],
      });
      setTaskModalError(null);
      setIsTaskModalOpen(false);
    } catch (error) {
      setTaskModalError(error instanceof Error ? error.message : "No se pudo guardar la tarea");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDrop = async (stage: TaskStage) => {
    if (!draggedTaskId) return;
    const task = tasks.find((t) => t.id === draggedTaskId);
    setDraggedTaskId(null);
    if (!task || task.stage === stage) return;

    try {
      setIsSaving(true);
      await moveTask(task, stage);
    } catch (error) {
      console.error("Error al mover tarea:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-secondary">
            Operaciones y taller
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900">
            Control de tareas y citas
          </h1>
          <p className="mt-2 text-sm text-secondary">
            Flujo: Citas → Diseño → Cotización formal → Seguimiento.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedEmployeeFilter}
            onChange={(e) => setSelectedEmployeeFilter(e.target.value)}
            className="rounded-2xl border border-primary/10 bg-white px-4 py-2.5 text-sm font-medium text-secondary shadow-sm outline-none"
          >
            <option value="Todos">Ver todo</option>
            {employees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.nombre}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={openTeamModal}
            className="flex items-center gap-2 rounded-2xl border border-primary/10 bg-white px-4 py-2.5 text-sm font-semibold text-secondary shadow-sm transition hover:bg-primary/5"
          >
            <UserPlus className="h-4 w-4" />
            Integrantes
          </button>
          <button
            type="button"
            onClick={openAssignModal}
            className="rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            Asignar pendiente
          </button>
        </div>
      </div>

      {isLoading ? (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-3 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg backdrop-blur-md"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando tablero...
        </motion.section>
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
              onDragOver={(e) => e.preventDefault()}
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
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => setDraggedTaskId(task.id)}
                      onClick={() => openTaskModal(task.id)}
                      className={`flex min-h-[220px] flex-col rounded-2xl border border-primary/10 bg-white px-4 py-4 text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${stageStyles[task.stage].border ? `border-l-4 ${stageStyles[task.stage].border}` : ""}`}
                    >
                      {/** Contador de seguimiento: a los 3 dias muestra aviso de contacto. */}
                      {(() => {
                        const followUpDays = getFollowUpDays(task.followUpEnteredAt, task.createdAt, clockNow);
                        const remainingDays = Math.max(0, FOLLOW_UP_WARNING_DAYS - followUpDays);
                        const isFollowUpWarning =
                          task.stage === "contrato" &&
                          task.followUpStatus === "pendiente" &&
                          followUpDays >= FOLLOW_UP_WARNING_DAYS;

                        return (
                      <div className="flex flex-wrap items-center gap-2">
                        {task.stage === "contrato" && task.followUpStatus === "pendiente" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-700">
                            <Clock className="h-3 w-3" />
                            {isFollowUpWarning
                              ? `Dar seguimiento (${followUpDays} dia${followUpDays === 1 ? "" : "s"})`
                              : `Seguimiento en ${remainingDays} dia${remainingDays === 1 ? "" : "s"}`}
                          </span>
                        ) : (
                          <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${statusStyles[task.status]}`}>
                            {task.status === "completada" ? "Completada" : "Pendiente"}
                          </span>
                        )}
                        {task.stage === "contrato" && task.followUpStatus === "confirmado" ? (
                          <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                            Cliente confirmado
                          </span>
                        ) : null}
                        {task.stage === "contrato" && task.followUpStatus === "inactivo" ? (
                          <span className="inline-flex rounded-full bg-gray-200 px-2 py-1 text-[10px] font-semibold text-gray-700">
                            Proyecto inactivo
                          </span>
                        ) : null}
                        {task.stage !== "contrato" ? (
                          <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${priorityStyles[task.priority ?? "media"]}`}>
                            {(task.priority ?? "media").charAt(0).toUpperCase() + (task.priority ?? "media").slice(1)}
                          </span>
                        ) : null}
                      </div>
                        );
                      })()}

                      <div className="mt-3 flex flex-1 flex-col">
                        <div className="min-h-[3.75rem] max-h-[3.75rem]">
                          <p className="line-clamp-2 break-words text-base font-semibold leading-6 text-gray-900" title={task.project}>
                            {task.project}
                          </p>
                          {task.location || task.mapsUrl ? (
                            <p className="mt-1 line-clamp-1 break-words text-xs leading-4 text-secondary">
                              {task.location}
                              {task.mapsUrl ? (
                                <>
                                  {task.location ? " · " : ""}
                                  <a href={task.mapsUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:no-underline">Ver en Maps</a>
                                </>
                              ) : null}
                            </p>
                          ) : null}
                          {task.title && task.title !== task.project ? (
                            <p className="mt-1 line-clamp-1 break-words text-xs leading-4 text-secondary" title={task.title}>
                              {task.title}
                            </p>
                          ) : null}
                        </div>

                        <div className="mt-3 min-h-[1.75rem]">
                          <div className="flex flex-wrap gap-2">
                            {task.stage === "citas" && task.status === "pendiente" && !task.citaStarted ? (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void handleTaskAction(task, "start-cita");
                                }}
                                className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-white"
                                disabled={isSaving}
                              >
                                Iniciar cita
                              </button>
                            ) : null}
                            {task.stage === "citas" && task.citaStarted && !task.citaFinished ? (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void handleTaskAction(task, "finish-cita");
                                }}
                                className="inline-flex items-center rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white"
                                disabled={isSaving}
                              >
                                Terminar cita
                              </button>
                            ) : null}
                            {task.stage === "citas" && task.status === "completada" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                                <CheckCircle2 className="h-3 w-3" />
                                Cita completada
                              </span>
                            ) : null}

                            {task.stage === "disenos" && !task.designApprovedByAdmin ? (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void handleTaskAction(task, "approve-design-admin");
                                }}
                                className="inline-flex items-center rounded-full bg-violet-600 px-3 py-1 text-[11px] font-semibold text-white"
                                disabled={isSaving}
                              >
                                Aprobar admin
                              </button>
                            ) : null}
                            {task.stage === "disenos" && task.designApprovedByAdmin && !task.designApprovedByClient ? (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setVisitModalTaskId(task.id);
                                }}
                                className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${
                                  task.visitScheduledAt ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                                }`}
                                disabled={isSaving}
                              >
                                {task.visitScheduledAt ? `Visita: ${formatDateTime(task.visitScheduledAt)}` : "Falta agendar visita"}
                              </button>
                            ) : null}
                            {task.stage === "disenos" && task.designApprovedByAdmin && !task.designApprovedByClient ? (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void handleTaskAction(task, "approve-design-client");
                                }}
                                className="inline-flex items-center rounded-full bg-violet-700 px-3 py-1 text-[11px] font-semibold text-white"
                                disabled={isSaving}
                              >
                                Aprobar cliente
                              </button>
                            ) : null}

                            {task.stage === "cotizacion" && !task.citaStarted ? (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void handleTaskAction(task, "start-cotizacion");
                                }}
                                className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-white"
                                disabled={isSaving}
                              >
                                Iniciar cotizacion
                              </button>
                            ) : null}
                            {task.stage === "cotizacion" && task.citaStarted && !task.citaFinished ? (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void handleTaskAction(task, "finish-cotizacion");
                                }}
                                className="inline-flex items-center rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white"
                                disabled={isSaving}
                              >
                                Terminar cotizacion
                              </button>
                            ) : null}
                            {task.stage === "cotizacion" && task.citaStarted && task.citaFinished ? (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void handleTaskAction(task, "pass-to-seguimiento");
                                }}
                                className="inline-flex items-center rounded-full bg-emerald-700 px-3 py-1 text-[11px] font-semibold text-white"
                                disabled={isSaving}
                              >
                                Pasar a seguimiento
                              </button>
                            ) : null}

                            {task.stage === "contrato" ? (
                              <div className="grid w-full grid-cols-1 gap-2">
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    void handleTaskAction(task, "confirm-client");
                                  }}
                                  className="w-full rounded-2xl bg-emerald-600 px-3 py-2 text-[11px] font-semibold text-white"
                                  disabled={isSaving}
                                >
                                  Confirmar cliente
                                </button>
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    void handleTaskAction(task, "discard-client");
                                  }}
                                  className="w-full rounded-2xl bg-rose-600 px-3 py-2 text-[11px] font-semibold text-white"
                                  disabled={isSaving}
                                >
                                  Marcar inactivo
                                </button>
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    void handleTaskAction(task, "reactivate-client");
                                  }}
                                  className="w-full rounded-2xl border border-amber-300 bg-white px-3 py-2 text-[11px] font-semibold text-amber-800"
                                  disabled={isSaving}
                                >
                                  Reactivar seguimiento
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      {task.location ? (
                        <div className="mt-3 flex items-center gap-1.5 rounded-2xl bg-slate-50 px-3 py-2 text-[11px] text-secondary">
                          <MapPin className="h-3 w-3" />
                          <span>{task.location}</span>
                        </div>
                      ) : null}
                      {task.dueDate ? (
                        <div className="mt-3 flex items-center gap-1.5 rounded-2xl bg-slate-50 px-3 py-2 text-[11px] text-secondary">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(task.dueDate)}</span>
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </motion.section>
      )}

      {actionFeedback ? (
        <div className="rounded-2xl border border-primary/20 bg-white/90 px-4 py-3 text-sm text-primary shadow-sm">
          {actionFeedback}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg backdrop-blur-md">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <Calculator className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-[0.3em] text-secondary">Cotizacion</p>
              <h3 className="mt-1 text-xl font-semibold">Cotizador Pro</h3>
              <p className="mt-2 text-sm text-secondary">
                Genera estimaciones detalladas con desglose tecnico completo para el taller.
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
              <p className="text-xs uppercase tracking-[0.3em] text-secondary">Cotizacion</p>
              <h3 className="mt-1 text-xl font-semibold">Cotizador Preliminar</h3>
              <p className="mt-2 text-sm text-secondary">
                Crea una estimacion rapida para prospectos antes de formalizar el proyecto.
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

      <VisitScheduleModal
        isOpen={Boolean(visitModalTask)}
        taskLabel={visitModalTask?.project ?? "Proyecto"}
        initialIso={visitModalTask?.visitScheduledAt}
        occupiedSlots={occupiedVisitSlots}
        isSaving={isSaving}
        onClose={() => setVisitModalTaskId(null)}
        onConfirm={async (isoDateTime) => {
          if (!visitModalTask) return;
          await handleSaveVisitForTask(visitModalTask, isoDateTime);
        }}
      />

      {isAssignModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setIsAssignModalOpen(false)}>
          <div
            ref={assignModalRef}
            tabIndex={-1}
            className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-3xl border border-white/70 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-primary/5 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Asignar pendiente</h3>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="rounded-full border border-primary/10 px-3 py-1 text-xs font-semibold text-secondary"
              >
                Cerrar
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-4">
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                  Proyecto / Cliente
                  <input
                    value={newTaskProject}
                    onChange={(e) => setNewTaskProject(e.target.value)}
                    placeholder="Ej. Residencial Vega"
                    className="mt-2 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                  />
                </label>
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                  Etapa inicial
                  <select
                    value={newTaskStage}
                    onChange={(e) => setNewTaskStage(e.target.value as TaskStage)}
                    className="mt-2 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                  >
                    {kanbanColumns.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                  Prioridad
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                    className="mt-2 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                  >
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                  </select>
                </label>

                <div className="block text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                  Responsables (uno o mas)
                  <div className="mt-2 max-h-40 space-y-2 overflow-y-auto rounded-2xl border border-primary/10 bg-white p-3">
                    {employees.length === 0 ? (
                      <p className="text-[11px] normal-case tracking-normal text-secondary">Sin empleados disponibles.</p>
                    ) : (
                      employees.map((employee) => {
                        const checked = newTaskAssignedToIds.includes(employee._id);
                        return (
                          <label key={employee._id} className="flex items-center gap-2 text-xs font-medium normal-case tracking-normal text-gray-800">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                setNewTaskAssignedToIds((prev) =>
                                  checked ? prev.filter((id) => id !== employee._id) : [...prev, employee._id],
                                )
                              }
                              className="h-4 w-4 accent-primary"
                            />
                            <span>{employee.nombre}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
              {assignError ? (
                <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-600">{assignError}</p>
              ) : null}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="rounded-2xl border border-primary/10 bg-white px-5 py-2 text-xs font-semibold text-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAssignPending}
                  disabled={isSaving}
                  className="rounded-2xl bg-primary px-5 py-2 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {isSaving ? "Guardando..." : "Guardar pendiente"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isTeamModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setIsTeamModalOpen(false)}>
          <div
            ref={teamModalRef}
            tabIndex={-1}
            className="w-full max-w-2xl rounded-3xl border border-white/70 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Integrantes del equipo</h3>
              <button
                type="button"
                onClick={() => setIsTeamModalOpen(false)}
                className="rounded-full border border-primary/10 px-3 py-1 text-xs font-semibold text-secondary"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div>
                <p className="mb-4 text-sm text-gray-600">Equipo disponible de {employees.length} integrantes:</p>
                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {employees.length > 0 ? (
                    employees.map((emp) => (
                      <div
                        key={emp._id}
                        className="flex items-center justify-between rounded-2xl border border-primary/10 bg-white/50 px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{emp.nombre}</p>
                          <p className="text-xs text-secondary">{emp.correo}</p>
                        </div>
                        <span className="text-[11px] font-semibold text-primary uppercase tracking-wide">
                          {emp.rol}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-secondary py-4 text-center">
                      Sin integrantes cargados
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-primary/10 bg-white/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Agregar integrante</p>
                <div className="mt-3 space-y-3">
                  <label className="block text-xs font-semibold text-secondary">
                    Nombre
                    <input
                      value={newMemberName}
                      onChange={(event) => setNewMemberName(event.target.value)}
                      placeholder="Ej. Juan Perez"
                      className="mt-1.5 w-full rounded-2xl border border-primary/10 bg-white px-4 py-2.5 text-sm outline-none"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-secondary">
                    Correo
                    <input
                      type="email"
                      value={newMemberEmail}
                      onChange={(event) => setNewMemberEmail(event.target.value)}
                      placeholder="correo@empresa.com"
                      className="mt-1.5 w-full rounded-2xl border border-primary/10 bg-white px-4 py-2.5 text-sm outline-none"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-secondary">
                    Rol
                    <select
                      value={newMemberRole}
                      onChange={(event) => setNewMemberRole(event.target.value as Usuario["rol"])}
                      className="mt-1.5 w-full rounded-2xl border border-primary/10 bg-white px-4 py-2.5 text-sm outline-none"
                    >
                      <option value="empleado">Empleado</option>
                      <option value="arquitecto">Arquitecto</option>
                      <option value="admin">Admin</option>
                    </select>
                  </label>
                  <label className="block text-xs font-semibold text-secondary">
                    Password (opcional)
                    <input
                      type="password"
                      value={newMemberPassword}
                      onChange={(event) => setNewMemberPassword(event.target.value)}
                      placeholder="Solo si backend lo requiere"
                      className="mt-1.5 w-full rounded-2xl border border-primary/10 bg-white px-4 py-2.5 text-sm outline-none"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => void handleAddMember()}
                    disabled={isSaving}
                    className="w-full rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {isSaving ? "Agregando..." : "Agregar integrante"}
                  </button>
                </div>
              </div>
            </div>
            {teamError ? (
              <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-600">{teamError}</p>
            ) : null}
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
              <div className="flex items-start justify-between gap-4 border-b border-primary/10 px-6 py-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-secondary">Detalle de tarea</p>
                  <h3 className="mt-1 text-xl font-semibold text-gray-900">{activeTask.project}</h3>
                  <p className="mt-0.5 text-sm text-secondary">{activeTask.title}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="shrink-0 rounded-full border border-primary/10 px-3 py-2 text-xs font-semibold text-secondary transition hover:bg-primary/5"
                >
                  Cerrar
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5">
                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Configuracion</p>
                    <div className="mt-3 grid grid-cols-3 gap-3">
                      <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-secondary">
                        Etapa
                        <select
                          value={taskDraft.stage}
                          onChange={(event) =>
                            setTaskDraft((prev) => ({
                              ...prev,
                              stage: event.target.value as TaskStage,
                            }))
                          }
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
                          onChange={(event) =>
                            setTaskDraft((prev) => ({
                              ...prev,
                              status: event.target.value as TaskStatus,
                            }))
                          }
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
                          onChange={(event) =>
                            setTaskDraft((prev) => ({
                              ...prev,
                              priority: event.target.value as TaskPriority,
                            }))
                          }
                          className="mt-1.5 w-full rounded-2xl border border-primary/10 bg-white px-3 py-2.5 text-xs outline-none"
                        >
                          <option value="alta">Alta</option>
                          <option value="media">Media</option>
                          <option value="baja">Baja</option>
                        </select>
                      </label>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Responsable</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {taskDraft.assignedToIds.map((employeeId) => {
                        const employeeName = employees.find((emp) => emp._id === employeeId)?.nombre ?? employeeId;
                        return (
                          <span key={employeeId} className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white px-3 py-1.5 text-sm">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                              {getInitials(employeeName)}
                            </span>
                            {employeeName}
                          </span>
                        );
                      })}
                      {taskDraft.assignedToIds.length === 0 ? (
                        <p className="text-xs text-secondary">Sin asignar</p>
                      ) : null}
                    </div>
                    <div className="mt-3 max-h-40 space-y-2 overflow-y-auto rounded-2xl border border-primary/10 bg-white p-3">
                      {employees.map((employee) => {
                        const checked = taskDraft.assignedToIds.includes(employee._id);
                        return (
                          <label key={employee._id} className="flex items-center gap-2 text-xs font-medium text-gray-800">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                setTaskDraft((prev) => ({
                                  ...prev,
                                  assignedToIds: checked
                                    ? prev.assignedToIds.filter((id) => id !== employee._id)
                                    : [...prev.assignedToIds, employee._id],
                                }))
                              }
                              className="h-4 w-4 accent-primary"
                            />
                            <span>{employee.nombre}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-secondary">
                    Titulo
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

                  <div className="grid grid-cols-1 gap-3">
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-secondary">
                      Fecha limite
                      <input
                        type="date"
                        value={taskDraft.dueDate}
                        onChange={(event) => setTaskDraft((prev) => ({ ...prev, dueDate: event.target.value }))}
                        className="mt-1.5 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                      />
                    </label>
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-secondary">
                      Direccion / Localidad
                      <input
                        value={taskDraft.location}
                        onChange={(event) => setTaskDraft((prev) => ({ ...prev, location: event.target.value }))}
                        className="mt-1.5 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                      />
                    </label>
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-secondary">
                      Enlace Google Maps
                      <input
                        type="url"
                        value={taskDraft.mapsUrl}
                        onChange={(event) => setTaskDraft((prev) => ({ ...prev, mapsUrl: event.target.value }))}
                        className="mt-1.5 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                      />
                    </label>
                  </div>

                  <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-secondary">
                    Notas
                    <textarea
                      value={taskDraft.notes}
                      onChange={(event) => setTaskDraft((prev) => ({ ...prev, notes: event.target.value }))}
                      className="mt-1.5 min-h-[120px] w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                    />
                  </label>
                </div>
              </div>

              <div className="border-t border-primary/10 px-6 py-4">
                {taskModalError ? (
                  <p className="mb-3 rounded-2xl bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-600">{taskModalError}</p>
                ) : null}
                <div className="flex justify-end gap-2">
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
                    <PencilLine className="h-3.5 w-3.5" />
                    Guardar
                  </button>
                </div>
              </div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
