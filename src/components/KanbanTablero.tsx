 "use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { FileUp } from "lucide-react";

import { useEscapeClose } from "@/hooks/useEscapeClose";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import {
  kanbanColumns,
  kanbanStorageKey,
  initialKanbanTasks,
  activeCitaTaskStorageKey,
  type KanbanTask,
  type TaskFile,
  type TaskPriority,
  type TaskStage,
  type TaskStatus,
} from "@/lib/kanban";

const currentUser = "Valeria";

const stageStyles: Record<TaskStage, { border: string; badge: string }> = {
  citas: { border: "border-sky-500", badge: "bg-sky-50 text-sky-600" },
  disenos: { border: "border-violet-500", badge: "bg-violet-50 text-violet-600" },
  cotizacion: { border: "border-emerald-500", badge: "bg-emerald-50 text-emerald-600" },
  contrato: { border: "border-amber-500", badge: "bg-amber-50 text-amber-700" },
};

const statusStyles: Record<TaskStatus, string> = {
  pendiente: "bg-rose-50 text-rose-600",
  completada: "bg-emerald-50 text-emerald-600",
};

const priorityStyles: Record<TaskPriority, string> = {
  alta: "bg-rose-100 text-rose-700",
  media: "bg-amber-100 text-amber-700",
  baja: "bg-emerald-100 text-emerald-700",
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const normalizeTask = (task: Partial<KanbanTask> & Record<string, unknown>): KanbanTask => {
  const legacyType = typeof task.type === "string" ? task.type : undefined;
  const legacyStage =
    legacyType === "cita"
      ? "citas"
      : legacyType === "diseño" || legacyType === "diseno"
        ? "disenos"
        : legacyType === "todo"
          ? "cotizacion"
          : undefined;
  const stage =
    typeof task.stage === "string" && kanbanColumns.some((col) => col.id === task.stage)
      ? (task.stage as TaskStage)
      : legacyStage ?? "citas";
  const status = task.status === "completada" ? "completada" : "pendiente";
  const rawAssigned = task.assignedTo ?? task.employee;
  const assignedTo: string[] = Array.isArray(rawAssigned)
    ? rawAssigned.filter((s): s is string => typeof s === "string")
    : typeof rawAssigned === "string" && rawAssigned
      ? [rawAssigned]
      : ["Sin asignar"];
  const priority: TaskPriority =
    task.priority === "alta" || task.priority === "baja" ? task.priority : "media";
  return {
    id: typeof task.id === "string" ? task.id : `task-${Date.now()}`,
    title: typeof task.title === "string" ? task.title : "Tarea sin título",
    stage,
    status,
    assignedTo,
    project: typeof task.project === "string" ? task.project : "General",
    notes: typeof task.notes === "string" ? task.notes : "",
    files: Array.isArray(task.files) ? (task.files as TaskFile[]) : [],
    priority,
    dueDate: typeof task.dueDate === "string" ? task.dueDate : undefined,
    createdAt: typeof task.createdAt === "number" ? task.createdAt : Date.now(),
  };
};

const mergeTasks = (storedTasks: KanbanTask[]) => {
  const map = new Map(storedTasks.map((task) => [task.id, task]));
  initialKanbanTasks.forEach((task) => {
    if (!map.has(task.id)) {
      map.set(task.id, task);
    }
  });
  return Array.from(map.values());
};

export type KanbanTableroProps = {
  /** Admin: filtrar por nombre de empleado. null = ver todo, string = solo ese empleado. No pasar = modo empleado (Ver todo / Mis tareas). */
  filterByEmployee?: string | null;
  /** Admin: incrementar para forzar re-lectura desde localStorage (ej. tras crear tarea). */
  refreshTrigger?: number;
  /** Admin: lista de integrantes para reasignar desde el detalle y para opciones al crear tarea. */
  teamMembers?: { id: string; name: string }[];
};

export function KanbanTablero(props: KanbanTableroProps = {}) {
  const { filterByEmployee, refreshTrigger = 0, teamMembers } = props;
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"all" | "mine">("all");
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [uploadTaskId, setUploadTaskId] = useState<string | null>(null);
  const [kanbanTasks, setKanbanTasks] = useState<KanbanTask[]>(initialKanbanTasks);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<TaskStage | null>(null);
  const [sortBy, setSortBy] = useState<"default" | "priority" | "date">("default");
  const skipNextWriteRef = useRef(false);
  const activeTaskRef = useRef<HTMLDivElement | null>(null);
  const uploadTaskRef = useRef<HTMLDivElement | null>(null);

  useEscapeClose(Boolean(activeTaskId), () => setActiveTaskId(null));
  useEscapeClose(Boolean(uploadTaskId), () => setUploadTaskId(null));
  useFocusTrap(Boolean(activeTaskId), activeTaskRef);
  useFocusTrap(Boolean(uploadTaskId), uploadTaskRef);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncFromStorage = () => {
      const stored = window.localStorage.getItem(kanbanStorageKey);
      if (!stored) {
        const merged = mergeTasks(initialKanbanTasks);
        skipNextWriteRef.current = true;
        setKanbanTasks(merged);
        window.localStorage.setItem(kanbanStorageKey, JSON.stringify(merged));
        return;
      }
      try {
        const parsed = JSON.parse(stored) as KanbanTask[];
        if (Array.isArray(parsed) && parsed.length) {
          const normalized = parsed.map((task) => normalizeTask(task));
          const merged = mergeTasks(normalized);
          skipNextWriteRef.current = true;
          setKanbanTasks(merged);
          if (merged.length !== normalized.length) {
            window.localStorage.setItem(kanbanStorageKey, JSON.stringify(merged));
          }
        }
      } catch {
        // ignore malformed storage
      }
    };

    syncFromStorage();
    const handleFocus = () => syncFromStorage();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        syncFromStorage();
      }
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || refreshTrigger === 0) return;
    const stored = window.localStorage.getItem(kanbanStorageKey);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as KanbanTask[];
      if (Array.isArray(parsed) && parsed.length) {
        const normalized = parsed.map((task) => normalizeTask(task));
        const merged = mergeTasks(normalized);
        skipNextWriteRef.current = true;
        setKanbanTasks(merged);
      }
    } catch {
      // ignore
    }
  }, [refreshTrigger]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (skipNextWriteRef.current) {
      skipNextWriteRef.current = false;
      return;
    }
    window.localStorage.setItem(kanbanStorageKey, JSON.stringify(kanbanTasks));
  }, [kanbanTasks]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== kanbanStorageKey || !event.newValue) return;
      try {
        const parsed = JSON.parse(event.newValue) as KanbanTask[];
        if (Array.isArray(parsed)) {
          setKanbanTasks(mergeTasks(parsed.map((task) => normalizeTask(task))));
        }
      } catch {
        // ignore malformed storage
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const filteredTasks = useMemo(() => {
    if (filterByEmployee !== undefined) {
      if (filterByEmployee === null || filterByEmployee === "") return kanbanTasks;
      return kanbanTasks.filter((task) =>
        Array.isArray(task.assignedTo) ? task.assignedTo.includes(filterByEmployee) : false,
      );
    }
    if (viewMode === "mine") {
      return kanbanTasks.filter((task) =>
        Array.isArray(task.assignedTo) ? task.assignedTo.includes(currentUser) : false,
      );
    }
    return kanbanTasks;
  }, [kanbanTasks, viewMode, filterByEmployee]);

  const updateTask = (taskId: string, updater: (task: KanbanTask) => KanbanTask) => {
    setKanbanTasks((prev) =>
      prev.map((task) => (task.id === taskId ? updater(task) : task)),
    );
  };

  const setTaskStatus = (taskId: string, status: TaskStatus) => {
    updateTask(taskId, (task) => ({ ...task, status }));
  };

  const moveTaskToStage = (taskId: string, stage: TaskStage) => {
    updateTask(taskId, (task) => ({ ...task, stage }));
  };

  const deleteTask = (taskId: string) => {
    setKanbanTasks((prev) => prev.filter((t) => t.id !== taskId));
    setActiveTaskId(null);
  };

  const priorityOrder: Record<TaskPriority, number> = { alta: 0, media: 1, baja: 2 };
  const sortTasks = (tasks: KanbanTask[]) => {
    if (sortBy === "priority") {
      return [...tasks].sort(
        (a, b) =>
          priorityOrder[a.priority ?? "media"] - priorityOrder[b.priority ?? "media"],
      );
    }
    if (sortBy === "date") {
      return [...tasks].sort((a, b) => {
        const da = a.dueDate ? new Date(a.dueDate).getTime() : a.createdAt ?? 0;
        const db = b.dueDate ? new Date(b.dueDate).getTime() : b.createdAt ?? 0;
        return da - db;
      });
    }
    return tasks;
  };

  const activeTask = useMemo(
    () => kanbanTasks.find((task) => task.id === activeTaskId) ?? null,
    [activeTaskId, kanbanTasks],
  );
  const uploadTask = useMemo(
    () => kanbanTasks.find((task) => task.id === uploadTaskId) ?? null,
    [kanbanTasks, uploadTaskId],
  );

  const inferFileType = (name: string): TaskFile["type"] => {
    const lower = name.toLowerCase();
    if (lower.endsWith(".pdf")) return "pdf";
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png")) {
      return "render";
    }
    return "otro";
  };

  const handleFilesUpload = (taskId: string, files: FileList | null) => {
    if (!files?.length) return;
    const nextFiles: TaskFile[] = Array.from(files).map((file) => ({
      id: `file-${Date.now()}-${file.name}`,
      name: file.name,
      type: inferFileType(file.name),
    }));
    updateTask(taskId, (task) => ({
      ...task,
      files: [...(task.files ?? []), ...nextFiles],
    }));
  };

  const handleStartCita = (taskId: string) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(activeCitaTaskStorageKey, taskId);
    }
    setActiveTaskId(null);
    router.push("/dashboard/cotizador");
  };

  const handleFinishCita = (taskId: string) => {
    updateTask(taskId, (task) => ({ ...task, status: "completada" }));
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(activeCitaTaskStorageKey);
    }
    setActiveTaskId(null);
  };

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg backdrop-blur-md"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-secondary">Flujo de la empresa</p>
            <h2 className="mt-2 text-xl font-semibold">Tablero general</h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-medium text-secondary">
              Ordenar columnas
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "default" | "priority" | "date")}
                className="rounded-xl border border-primary/10 bg-white px-3 py-2 text-sm outline-none"
              >
                <option value="default">Predeterminado</option>
                <option value="priority">Por prioridad</option>
                <option value="date">Por fecha</option>
              </select>
            </label>
            {filterByEmployee === undefined ? (
            <div className="flex items-center gap-2 rounded-full border border-primary/10 bg-white p-1">
              {[
                { id: "all", label: "Ver todo" },
                { id: "mine", label: "Mis tareas" },
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => setViewMode(option.id as "all" | "mine")}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    viewMode === option.id
                      ? "bg-accent text-white"
                      : "text-secondary hover:text-primary"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-4">
          {kanbanColumns.map((column) => {
            const columnTasksRaw = filteredTasks.filter((task) => task.stage === column.id);
            const columnTasks = sortTasks(columnTasksRaw);
            const isDragOver = dragOverColumnId === column.id;
            return (
              <div
                key={column.id}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOverColumnId(column.id);
                }}
                onDragLeave={() => setDragOverColumnId(null)}
                onDrop={(event) => {
                  event.preventDefault();
                  const taskId = event.dataTransfer.getData("text/plain");
                  if (taskId) {
                    moveTaskToStage(taskId, column.id);
                  }
                  setDraggedTaskId(null);
                  setDragOverColumnId(null);
                }}
                className={`rounded-2xl border border-primary/10 bg-white/70 p-4 transition ${
                  isDragOver ? "bg-accent/5 ring-2 ring-accent/30" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                    {column.label}
                  </p>
                  <span className="rounded-full bg-primary/5 px-2 py-1 text-[11px] text-secondary">
                    {columnTasks.length}
                  </span>
                </div>
                <div className="mt-3 space-y-3">
                  {columnTasks.map((task) => {
                    const stageStyle = stageStyles[task.stage];
                    return (
                      <div
                        key={task.id}
                        draggable
                        onClick={() => setActiveTaskId(task.id)}
                        onDragStart={(event) => {
                          event.dataTransfer.setData("text/plain", task.id);
                          event.dataTransfer.effectAllowed = "move";
                          setDraggedTaskId(task.id);
                        }}
                        onDragEnd={() => {
                          setDraggedTaskId(null);
                          setDragOverColumnId(null);
                        }}
                        className={`flex h-48 cursor-pointer flex-col overflow-hidden rounded-2xl border border-primary/10 bg-white px-4 py-4 text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                          stageStyle?.border ? `border-l-4 ${stageStyle.border}` : ""
                        }`}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                              statusStyles[task.status]
                            }`}
                          >
                            {task.status === "completada" ? "Completada" : "Pendiente"}
                          </span>
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${
                              priorityStyles[task.priority ?? "media"]
                            }`}
                          >
                            {(task.priority ?? "media").charAt(0).toUpperCase() +
                              (task.priority ?? "media").slice(1)}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-1 flex-col">
                          <div className="min-h-[3.75rem] max-h-[3.75rem]">
                            <p
                              className="line-clamp-2 break-words text-base font-semibold leading-6 text-gray-900"
                              title={task.project}
                            >
                              {task.project}
                            </p>
                            {task.title && task.title !== task.project ? (
                              <p
                                className="mt-1 line-clamp-1 break-words text-xs leading-4 text-secondary"
                                title={task.title}
                              >
                                {task.title}
                              </p>
                            ) : null}
                          </div>
                          <div className="mt-3 min-h-[1.75rem]">
                            <div className="flex flex-wrap gap-2">
                              {task.stage === "citas" && task.status === "pendiente" ? (
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleStartCita(task.id);
                                  }}
                                  className="inline-flex w-auto items-center rounded-full border border-primary/10 bg-white px-3 py-1 text-[11px] font-semibold text-secondary"
                                >
                                  Iniciar cita
                                </button>
                              ) : null}
                              {task.stage === "cotizacion" && task.status === "pendiente" ? (
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleStartCita(task.id);
                                  }}
                                  className="inline-flex w-auto items-center rounded-full border border-primary/10 bg-white px-3 py-1 text-[11px] font-semibold text-secondary"
                                >
                                  Iniciar
                                </button>
                              ) : null}
                              {task.stage === "disenos" ? (
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setUploadTaskId(task.id);
                                  }}
                                  className="inline-flex w-auto items-center rounded-full border border-primary/10 bg-white px-3 py-1 text-[11px] font-semibold text-secondary"
                                >
                                  Subir
                                </button>
                              ) : null}
                              {task.stage === "contrato" ? (
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setUploadTaskId(task.id);
                                  }}
                                  className="inline-flex w-auto items-center rounded-full border border-primary/10 bg-white px-3 py-1 text-[11px] font-semibold text-secondary"
                                >
                                  Subir
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        <div className="mt-auto flex flex-wrap items-center gap-2 pb-3 pt-3 text-sm text-gray-600">
                          {(Array.isArray(task.assignedTo) ? task.assignedTo : []).length === 0 ? (
                            <span className="text-xs text-secondary">Sin asignar</span>
                          ) : (Array.isArray(task.assignedTo) ? task.assignedTo : []).length <= 2 ? (
                            (Array.isArray(task.assignedTo) ? task.assignedTo : []).map((name) => (
                              <span key={name} className="flex items-center gap-1.5">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[9px] font-semibold text-primary">
                                  {getInitials(name)}
                                </span>
                                <span>{name}</span>
                              </span>
                            ))
                          ) : (
                            <>
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[9px] font-semibold text-primary">
                                {getInitials((task.assignedTo as string[])[0])}
                              </span>
                              <span className="text-xs text-secondary">
                                +{(task.assignedTo as string[]).length - 1} más
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {columnTasks.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-primary/10 bg-white/50 px-4 py-6 text-center text-xs text-secondary">
                      Sin tareas en esta etapa.
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </motion.section>

      <AnimatePresence>
        {activeTask ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => setActiveTaskId(null)}
          >
            <motion.aside
              ref={activeTaskRef}
              tabIndex={-1}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
              className="absolute right-0 top-0 h-full w-full max-w-lg overflow-y-auto rounded-l-3xl border border-white/40 bg-white/95 p-6 shadow-2xl backdrop-blur-md"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-secondary">
                    Detalle de tarea
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-gray-900">
                    {activeTask.project}
                  </h3>
                  {activeTask.title && activeTask.title !== activeTask.project ? (
                    <p className="mt-1 text-sm text-secondary">{activeTask.title}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTaskId(null)}
                  className="rounded-full border border-primary/10 px-3 py-2 text-xs font-semibold text-secondary"
                >
                  Cerrar
                </button>
              </div>

              <div className="mt-6 space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                    {teamMembers && teamMembers.length > 0
                      ? "Responsables (varios permitidos)"
                      : "Responsables"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(Array.isArray(activeTask.assignedTo) ? activeTask.assignedTo : []).map(
                      (name) => (
                        <span
                          key={name}
                          className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white px-3 py-1.5 text-sm"
                        >
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                            {getInitials(name)}
                          </span>
                          {name}
                          {teamMembers && teamMembers.length > 0 ? (
                            <button
                              type="button"
                              onClick={() =>
                                updateTask(activeTask.id, (task) => ({
                                  ...task,
                                  assignedTo: (task.assignedTo as string[]).filter((n) => n !== name),
                                }))
                              }
                              className="ml-1 rounded-full p-0.5 text-secondary hover:bg-rose-100 hover:text-rose-600"
                              aria-label={`Quitar a ${name}`}
                            >
                              ×
                            </button>
                          ) : null}
                        </span>
                      ),
                    )}
                    {teamMembers && teamMembers.length > 0 ? (
                      <select
                        value=""
                        onChange={(e) => {
                          const name = e.target.value;
                          if (!name) return;
                          const current = Array.isArray(activeTask.assignedTo)
                            ? activeTask.assignedTo
                            : [];
                          if (current.includes(name)) return;
                          updateTask(activeTask.id, (task) => ({
                            ...task,
                            assignedTo: [...(Array.isArray(task.assignedTo) ? task.assignedTo : []), name],
                          }));
                          e.target.value = "";
                        }}
                        className="rounded-xl border border-primary/10 bg-white px-3 py-2 text-sm text-secondary outline-none"
                      >
                        <option value="">+ Agregar responsable</option>
                        {teamMembers.map((m) => (
                          <option key={m.id} value={m.name}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    ) : null}
                  </div>
                  {(!activeTask.assignedTo || (activeTask.assignedTo as string[]).length === 0) && (
                    <p className="mt-2 text-xs text-secondary">Sin asignar</p>
                  )}
                </div>

                {teamMembers && teamMembers.length > 0 ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                      Etapa
                    </p>
                    <select
                      value={activeTask.stage}
                      onChange={(event) =>
                        moveTaskToStage(activeTask.id, event.target.value as TaskStage)
                      }
                      className="mt-3 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm font-semibold text-secondary"
                    >
                      {kanbanColumns.map((col) => (
                        <option key={col.id} value={col.id}>
                          {col.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                    Prioridad
                  </p>
                  <select
                    value={activeTask.priority ?? "media"}
                    onChange={(e) =>
                      updateTask(activeTask.id, (task) => ({
                        ...task,
                        priority: e.target.value as TaskPriority,
                      }))
                    }
                    className="mt-3 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm font-semibold text-secondary"
                  >
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                  </select>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                    Fecha límite (opcional)
                  </p>
                  <input
                    type="date"
                    value={activeTask.dueDate ?? ""}
                    onChange={(e) =>
                      updateTask(activeTask.id, (task) => ({
                        ...task,
                        dueDate: e.target.value || undefined,
                      }))
                    }
                    className="mt-3 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                  />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                    Estatus interno
                  </p>
                  <select
                    value={activeTask.status}
                    onChange={(event) =>
                      setTaskStatus(activeTask.id, event.target.value as TaskStatus)
                    }
                    className="mt-3 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm font-semibold text-secondary"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="completada">Completada</option>
                  </select>
                </div>

                {activeTask.stage === "citas" ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                      Acciones de cita
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {activeTask.status === "pendiente" ? (
                        <button
                          type="button"
                          onClick={() => handleStartCita(activeTask.id)}
                          className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white"
                        >
                          Iniciar cita
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => handleFinishCita(activeTask.id)}
                        className="rounded-full border border-primary/10 bg-white px-4 py-2 text-xs font-semibold text-secondary"
                      >
                        Terminar cita
                      </button>
                    </div>
                  </div>
                ) : null}
                {activeTask.stage === "cotizacion" ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                      Acciones de cotización
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {activeTask.status === "pendiente" ? (
                        <button
                          type="button"
                          onClick={() => handleStartCita(activeTask.id)}
                          className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white"
                        >
                          Iniciar
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => handleFinishCita(activeTask.id)}
                        className="rounded-full border border-primary/10 bg-white px-4 py-2 text-xs font-semibold text-secondary"
                      >
                        Terminar
                      </button>
                    </div>
                  </div>
                ) : null}
                {activeTask.stage === "disenos" ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                      Entregables de diseño
                    </p>
                    <button
                      type="button"
                      onClick={() => setUploadTaskId(activeTask.id)}
                      className="mt-3 inline-flex items-center rounded-full border border-primary/10 bg-white px-4 py-2 text-xs font-semibold text-secondary"
                    >
                      Subir diseño
                    </button>
                  </div>
                ) : null}
                {activeTask.stage === "contrato" ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                      Archivos de contrato
                    </p>
                    <button
                      type="button"
                      onClick={() => setUploadTaskId(activeTask.id)}
                      className="mt-3 inline-flex items-center rounded-full border border-primary/10 bg-white px-4 py-2 text-xs font-semibold text-secondary"
                    >
                      Subir contrato
                    </button>
                  </div>
                ) : null}

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                    Archivos
                  </p>
                  <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/20 bg-white px-4 py-6 text-sm text-secondary">
                    <FileUp className="h-4 w-4" />
                    Subir PDF o renders
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(event) => handleFilesUpload(activeTask.id, event.target.files)}
                    />
                  </label>
                  <div className="mt-4 space-y-2">
                    {(activeTask.files ?? []).length === 0 ? (
                      <div className="rounded-2xl border border-primary/10 bg-white px-4 py-3 text-xs text-secondary">
                        Sin archivos cargados.
                      </div>
                    ) : (
                      (activeTask.files ?? []).map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm"
                        >
                          <span>{file.name}</span>
                          <span className="text-xs uppercase text-secondary">{file.type}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                    Notas
                  </p>
                  <textarea
                    value={activeTask.notes ?? ""}
                    onChange={(event) =>
                      updateTask(activeTask.id, (task) => ({
                        ...task,
                        notes: event.target.value,
                      }))
                    }
                    placeholder="Agrega detalles o avances relevantes."
                    className="mt-3 min-h-[120px] w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                  />
                </div>

                {teamMembers && teamMembers.length > 0 ? (
                  <div className="border-t border-primary/10 pt-6">
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== "undefined" && window.confirm("¿Eliminar esta tarea? Esta acción no se puede deshacer.")) {
                          deleteTask(activeTask.id);
                        }
                      }}
                      className="w-full rounded-2xl border border-rose-200 bg-rose-50 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
                    >
                      Eliminar tarea
                    </button>
                  </div>
                ) : null}
              </div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {uploadTaskId ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={() => setUploadTaskId(null)}
          >
            <motion.div
              ref={uploadTaskRef}
              tabIndex={-1}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="w-full max-w-md rounded-3xl border border-white/70 bg-white/90 p-6 shadow-2xl backdrop-blur-md"
              onClick={(event) => event.stopPropagation()}
            >
              <h3 className="text-lg font-semibold">
                {uploadTask?.stage === "contrato" ? "Subir contrato" : "Subir diseño"}
              </h3>
              <p className="mt-2 text-sm text-secondary">
                {uploadTask?.stage === "contrato"
                  ? "Adjunta el contrato firmado o sus anexos."
                  : "Adjunta renders o planos para esta tarea de diseño."}
              </p>
              <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/20 bg-white px-4 py-8 text-center text-sm text-secondary">
                <FileUp className="h-4 w-4" />
                Seleccionar archivos
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    handleFilesUpload(uploadTaskId, event.target.files);
                    setUploadTaskId(null);
                  }}
                />
              </label>
              <button
                type="button"
                onClick={() => setUploadTaskId(null)}
                className="mt-6 w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-white"
              >
                Listo
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

