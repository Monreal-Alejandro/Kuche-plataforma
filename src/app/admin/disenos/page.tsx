"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  Loader2,
  MessageSquare,
} from "lucide-react";

import { useEscapeClose } from "@/hooks/useEscapeClose";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useAdminWorkflow } from "@/contexts/AdminWorkflowContext";
import { type AdminWorkflowTask } from "@/lib/admin-workflow";
import { VisitScheduleModal } from "@/components/admin/VisitScheduleModal";
import { ApprovalToast } from "@/components/admin/ApprovalToast";
import { listarEmpleados, listarUsuarios, type Usuario } from "@/lib/axios/usuariosApi";

type ProjectStatus = "Pendiente" | "Aprobado" | "Revisión";

type DesignProject = {
  id: string;
  taskId: string;
  clientName: string;
  designerName: string;
  image: string | null;
  fileUrl: string | null;
  files: NonNullable<AdminWorkflowTask["files"]>;
  date: string;
  status: ProjectStatus;
  visitScheduledAt?: string;
  assignedToIds: string[];
  assignedToNames: string[];
  notes?: string;
};

const statusStyles: Record<ProjectStatus, string> = {
  Pendiente: "bg-amber-100 text-amber-700",
  Aprobado: "bg-emerald-100 text-emerald-700",
  Revisión: "bg-rose-100 text-rose-700",
};

const filters = ["Todos", "Pendientes", "Aprobados", "En revisión"] as const;
type FilterOption = (typeof filters)[number];

function formatDesignDate(ts?: number): string {
  if (ts == null) return "—";
  const d = new Date(ts);
  return d.toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" });
}

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

function taskToProject(task: AdminWorkflowTask): DesignProject {
  const firstImage = task.files?.find((file) => file.type === "render" && file.src);
  const firstPdf = task.files?.find((file) => file.type === "pdf" && file.src);
  const hasFeedback = Boolean(task.notes?.trim());

  return {
    id: task.id,
    taskId: task.id,
    clientName: task.project || task.title || "Sin nombre",
    designerName: task.assignedTo[0] ?? "Sin asignar",
    image: firstImage?.src ?? null,
    fileUrl: firstImage?.src ?? firstPdf?.src ?? null,
    files: task.files ?? [],
    date: formatDesignDate(task.createdAt),
    status: task.designApprovedByAdmin ? "Aprobado" : hasFeedback ? "Revisión" : "Pendiente",
    visitScheduledAt: task.visitScheduledAt,
    assignedToIds: task.assignedToIds ?? [],
    assignedToNames: task.assignedTo ?? [],
    notes: task.notes,
  };
}

export default function DisenosPage() {
  const { refresh, updateTask } = useAdminWorkflow();
  const [projects, setProjects] = useState<DesignProject[]>([]);
  const [allTasks, setAllTasks] = useState<AdminWorkflowTask[]>([]);
  const [employees, setEmployees] = useState<Usuario[]>([]);
  const [tasksById, setTasksById] = useState<Record<string, AdminWorkflowTask>>({});
  const [visitModalTaskId, setVisitModalTaskId] = useState<string | null>(null);
  const [assignModalTaskId, setAssignModalTaskId] = useState<string | null>(null);
  const [assignDraftIds, setAssignDraftIds] = useState<string[]>([]);
  const [activeFeedbackId, setActiveFeedbackId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterOption>("Todos");
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>({});
  const [activePreview, setActivePreview] = useState<DesignProject | null>(null);
  const [selectedPreviewFileId, setSelectedPreviewFileId] = useState<string | null>(null);
  const [showFullInfo, setShowFullInfo] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [toastMessage, setToastMessage] = useState("");
  const previewRef = useRef<HTMLDivElement | null>(null);

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const loadedTasks = await refresh();
    console.log("[DisenosPage] refresh() tasks:", loadedTasks);
    setAllTasks(loadedTasks);
    const designTasks = loadedTasks.filter((task) => task.stage === "disenos");
    console.log("[DisenosPage] tareas filtradas etapa disenos:", designTasks);
    setTasksById(Object.fromEntries(designTasks.map((task) => [task.id, task])));
    const mappedProjects = designTasks.map(taskToProject);
    console.log("[DisenosPage] projects mapeados:", mappedProjects);
    setProjects(mappedProjects);
    setIsLoading(false);
  }, [refresh]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
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
    };

    void loadEmployees();
  }, []);

  useEffect(() => {
    if (!showFullInfo) return;
    console.log("[DisenosPage] allTasks (informacion completa):", allTasks);
    console.log("[DisenosPage] projects (informacion completa):", projects);
  }, [showFullInfo, allTasks, projects]);

  useEscapeClose(Boolean(activePreview), () => {
    setActivePreview(null);
    setSelectedPreviewFileId(null);
  });
  useFocusTrap(Boolean(activePreview), previewRef);

  const openPreview = (project: DesignProject, fileId?: string) => {
    setActivePreview(project);
    setSelectedPreviewFileId(fileId ?? project.files[0]?.id ?? null);
  };

  const filteredProjects = useMemo(() => {
    if (filter === "Todos") return projects;
    if (filter === "Pendientes") return projects.filter((project) => project.status === "Pendiente");
    if (filter === "Aprobados") return projects.filter((project) => project.status === "Aprobado");
    return projects.filter((project) => project.status === "Revisión");
  }, [filter, projects]);

  const previewIndex = useMemo(
    () => filteredProjects.findIndex((project) => project.id === activePreview?.id),
    [activePreview?.id, filteredProjects],
  );

  const activePreviewFile = useMemo(() => {
    if (!activePreview) return null;
    if (selectedPreviewFileId) {
      const matched = activePreview.files.find((file) => file.id === selectedPreviewFileId);
      if (matched) return matched;
    }
    return activePreview.files[0] ?? null;
  }, [activePreview, selectedPreviewFileId]);

  const goToNext = useCallback(() => {
    if (!filteredProjects.length) return;
    const nextIndex = previewIndex >= 0 ? (previewIndex + 1) % filteredProjects.length : 0;
    const nextProject = filteredProjects[nextIndex];
    setActivePreview(nextProject);
    setSelectedPreviewFileId(nextProject.files[0]?.id ?? null);
  }, [filteredProjects, previewIndex]);

  const goToPrev = useCallback(() => {
    if (!filteredProjects.length) return;
    const nextIndex =
      previewIndex >= 0
        ? (previewIndex - 1 + filteredProjects.length) % filteredProjects.length
        : filteredProjects.length - 1;
    const nextProject = filteredProjects[nextIndex];
    setActivePreview(nextProject);
    setSelectedPreviewFileId(nextProject.files[0]?.id ?? null);
  }, [filteredProjects, previewIndex]);

  useEffect(() => {
    if (!activePreview) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActivePreview(null);
        setSelectedPreviewFileId(null);
      } else if (event.key === "ArrowRight") {
        goToNext();
      } else if (event.key === "ArrowLeft") {
        goToPrev();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activePreview, goToNext, goToPrev]);

  const showNotification = (type: "success" | "error", message: string) => {
    setToastType(type);
    setToastMessage(message);
    setShowToast(true);
  };

  const persistTask = async (
    taskId: string,
    updates: Partial<AdminWorkflowTask>,
    options?: { successMessage?: string; errorMessage?: string },
  ) => {
    const task = tasksById[taskId];
    if (!task) return false;
    setSavingTaskId(taskId);
    try {
      console.log("[DisenosPage] persistTask intento:", {
        taskId,
        backendSource: task.backendSource,
        sourceId: task.sourceId,
        updates,
        taskAntes: task,
      });
      await updateTask(task, {
        notes: updates.notes ?? task.notes ?? "",
        designApprovedByAdmin: updates.designApprovedByAdmin ?? task.designApprovedByAdmin ?? false,
        visitScheduledAt: updates.visitScheduledAt ?? task.visitScheduledAt,
        assignedToIds: updates.assignedToIds ?? task.assignedToIds ?? [],
        assignedTo: updates.assignedTo ?? task.assignedTo ?? ["Sin asignar"],
      });
      console.log("[DisenosPage] persistTask ok:", { taskId, updates });
      await loadProjects();
      setActiveFeedbackId(null);
      if (options?.successMessage) {
        showNotification("success", options.successMessage);
      }
      return true;
    } catch (currentError) {
      console.error("[DisenosPage] persistTask error:", {
        taskId,
        updates,
        error: currentError,
      });
      const errorMsg = currentError instanceof Error ? currentError.message : "No se pudo actualizar el diseño";
      setError(errorMsg);
      if (options?.errorMessage) {
        showNotification("error", options.errorMessage);
      }
      return false;
    } finally {
      setSavingTaskId(null);
    }
  };

  const handleApprove = async (taskId: string) => {
    console.log("[DisenosPage] click Aprobar:", { taskId });
    const success = await persistTask(
      taskId,
      {
        designApprovedByAdmin: true,
        notes: "",
      },
      {
        successMessage: "Diseño aprobado correctamente. Ahora puedes agendar la visita.",
        errorMessage: "No se pudo aprobar el diseño. Revisa la consola para más detalle.",
      },
    );
    if (success) {
      setVisitModalTaskId(taskId);
    }
  };

  const handleSendFeedback = async (taskId: string) => {
    const feedback = feedbackDrafts[taskId]?.trim();
    if (!feedback) return;
    await persistTask(taskId, { designApprovedByAdmin: false, notes: feedback });
  };

  const visitModalTask = useMemo(
    () => tasksById[visitModalTaskId ?? ""] ?? null,
    [tasksById, visitModalTaskId],
  );

  const occupiedVisitSlots = useMemo(
    () =>
      allTasks
        .filter((task) => task.id !== visitModalTaskId)
        .map((task) => toLocalSlot(task.visitScheduledAt ?? task.scheduledAt ?? task.cita?.fechaAgendada))
        .filter((slot): slot is string => Boolean(slot)),
    [allTasks, visitModalTaskId],
  );

  const handleSaveVisit = async (taskId: string, isoDateTime: string) => {
    const success = await persistTask(taskId, {
      designApprovedByAdmin: true,
      visitScheduledAt: isoDateTime,
    });
    if (success) {
      setVisitModalTaskId(null);
    }
  };

  const assignModalTask = useMemo(
    () => tasksById[assignModalTaskId ?? ""] ?? null,
    [assignModalTaskId, tasksById],
  );

  const openAssignModal = (project: DesignProject) => {
    setAssignModalTaskId(project.taskId);
    setAssignDraftIds(project.assignedToIds ?? []);
  };

  const handleSaveAssignees = async () => {
    if (!assignModalTask) return;
    const names = assignDraftIds
      .map((employeeId) => employees.find((employee) => employee._id === employeeId)?.nombre)
      .filter((name): name is string => Boolean(name && name.trim().length > 0));

    const success = await persistTask(assignModalTask.id, {
      assignedToIds: assignDraftIds,
      assignedTo: names.length > 0 ? names : ["Sin asignar"],
    });

    if (success) {
      setAssignModalTaskId(null);
      setAssignDraftIds([]);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Aprobación de Diseños</h1>
        <p className="mt-2 text-sm text-gray-500">
          Revisa y autoriza los renders o planos recibidos desde el backend antes de la presentación al cliente.
        </p>
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowFullInfo((prev) => !prev)}
            className="rounded-2xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600"
          >
            {showFullInfo ? "Ocultar información completa" : "Ver información completa"}
          </button>
        </div>
        {showFullInfo ? (
          <div className="mt-3 space-y-3">
            {projects.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
                No hay tareas de diseño para mostrar información completa.
              </div>
            ) : (
              projects.map((project) => {
                const sourceTask = allTasks.find((task) => task.id === project.taskId);
                return (
                  <div key={`full-${project.id}`} className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="grid grid-cols-1 gap-2 text-sm text-gray-700 md:grid-cols-2">
                      <p><span className="font-semibold">Task ID:</span> {project.taskId}</p>
                      <p><span className="font-semibold">Cliente/Proyecto:</span> {project.clientName}</p>
                      <p><span className="font-semibold">Estado UI:</span> {project.status}</p>
                      <p><span className="font-semibold">Etapa backend:</span> {sourceTask?.stage ?? "N/A"}</p>
                      <p><span className="font-semibold">Responsables:</span> {project.assignedToNames.join(", ") || "Sin asignar"}</p>
                      <p><span className="font-semibold">Actualizado:</span> {project.date}</p>
                    </div>
                    <div className="mt-3 rounded-xl bg-gray-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Archivos</p>
                      {project.files.length > 0 ? (
                        <div className="mt-2 space-y-2">
                          {project.files.map((file) => (
                            <div key={`${project.id}-${file.id}`} className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
                              <p><span className="font-semibold">ID:</span> {file.id}</p>
                              <p><span className="font-semibold">Nombre:</span> {file.name}</p>
                              <p><span className="font-semibold">Tipo:</span> {file.type}</p>
                              <p className="break-all">
                                <span className="font-semibold">URL:</span>{" "}
                                {file.src ? (
                                  <a
                                    href={file.src}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#8B1C1C] underline hover:no-underline"
                                  >
                                    {file.src}
                                  </a>
                                ) : (
                                  <span className="text-amber-700">Sin URL disponible</span>
                                )}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-gray-500">Esta tarea no tiene archivos.</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.map((item) => {
            const isActive = filter === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  isActive ? "bg-[#8B1C1C] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando diseños...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-12 text-center">
          <p className="text-gray-500">
            {projects.length === 0
              ? "No hay diseños cargados en backend para revisar todavía."
              : "No hay diseños que coincidan con el filtro."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filteredProjects.map((project, index) => (
              <motion.article
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
                className="flex flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm"
              >
                <div className="relative h-60 overflow-hidden bg-gray-100">
                  {project.image ? (
                    <img
                      src={project.image}
                      alt={`Diseño ${project.clientName}`}
                      className="h-full w-full cursor-zoom-in object-cover transition-transform duration-500 hover:scale-105"
                      onClick={() => openPreview(project)}
                    />
                  ) : project.fileUrl ? (
                    <button
                      type="button"
                      onClick={() => openPreview(project)}
                      className="flex h-full w-full flex-col items-center justify-center gap-2 text-gray-400"
                    >
                      <FileText className="h-12 w-12" />
                      <span className="text-xs font-medium">
                        {project.files.length} archivo{project.files.length !== 1 ? "s" : ""}
                      </span>
                    </button>
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-gray-400">
                      <ImageIcon className="h-12 w-12" />
                      <span className="text-xs font-medium">Sin vista previa</span>
                    </div>
                  )}
                  <span
                    className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[project.status]}`}
                  >
                    {project.status}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-4 p-5">
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{project.clientName}</p>
                    <p className="text-sm text-gray-500">Responsable: {project.designerName}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {project.assignedToNames.length > 0 ? (
                      project.assignedToNames.map((name) => (
                        <span
                          key={`${project.id}-${name}`}
                          className="rounded-full border border-primary/10 bg-white px-3 py-1 text-[11px] font-semibold text-secondary"
                        >
                          {name}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold text-amber-700">
                        Sin asignar
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">Actualizado: {project.date}</p>
                  {project.files.length > 1 ? (
                    <p className="text-xs text-gray-400">Archivos disponibles: {project.files.length}</p>
                  ) : null}
                  {project.fileUrl ? (
                    <a
                      href={project.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-fit text-xs font-semibold text-[#8B1C1C] underline hover:no-underline"
                    >
                      Abrir archivo principal
                    </a>
                  ) : null}
                  {project.notes ? (
                    <p className="rounded-2xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      Feedback: {project.notes}
                    </p>
                  ) : null}
                  <div className="mt-auto">
                    {activeFeedbackId === project.id ? (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3"
                      >
                        <textarea
                          placeholder="Escribe los cambios necesarios..."
                          value={feedbackDrafts[project.id] ?? ""}
                          onChange={(event) =>
                            setFeedbackDrafts((prev) => ({
                              ...prev,
                              [project.id]: event.target.value,
                            }))
                          }
                          className="min-h-[90px] w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#8B1C1C]"
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => void handleSendFeedback(project.taskId)}
                            disabled={savingTaskId === project.taskId}
                            className="rounded-2xl bg-[#8B1C1C] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            Enviar feedback
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveFeedbackId(null)}
                            className="rounded-2xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600"
                          >
                            Cancelar
                          </button>
                        </div>
                      </motion.div>
                    ) : project.status === "Pendiente" || project.status === "Revisión" ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void handleApprove(project.taskId)}
                          disabled={savingTaskId === project.taskId}
                          className="flex items-center gap-2 rounded-2xl bg-[#8B1C1C] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          <Check className="h-4 w-4" />
                          Aprobar
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveFeedbackId(project.id)}
                          className="flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Solicitar cambios
                        </button>
                        <button
                          type="button"
                          onClick={() => openAssignModal(project)}
                          className="rounded-2xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600"
                        >
                          Asignar equipo
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-400">Diseño aprobado por administración.</p>
                        <button
                          type="button"
                          onClick={() => openAssignModal(project)}
                          className="rounded-2xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600"
                        >
                          Asignar equipo
                        </button>
                        <button
                          type="button"
                          onClick={() => setVisitModalTaskId(project.taskId)}
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                            project.visitScheduledAt ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {project.visitScheduledAt
                            ? `Visita: ${formatDateTime(project.visitScheduledAt)}`
                            : "Falta agendar visita"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      )}

      <VisitScheduleModal
        isOpen={Boolean(visitModalTask)}
        taskLabel={visitModalTask?.project ?? "Proyecto"}
        initialIso={visitModalTask?.visitScheduledAt}
        occupiedSlots={occupiedVisitSlots}
        isSaving={savingTaskId === visitModalTask?.id}
        onClose={() => setVisitModalTaskId(null)}
        onConfirm={async (isoDateTime) => {
          if (!visitModalTask) return;
          await handleSaveVisit(visitModalTask.id, isoDateTime);
        }}
      />

      {assignModalTask ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setAssignModalTaskId(null)}
        >
          <div
            className="w-full max-w-lg rounded-3xl border border-white/70 bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Asignar responsables</h3>
              <button
                type="button"
                onClick={() => setAssignModalTaskId(null)}
                className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-500"
              >
                Cerrar
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-500">Proyecto: {assignModalTask.project || assignModalTask.title}</p>
            <div className="mt-4 max-h-64 space-y-2 overflow-y-auto rounded-2xl border border-primary/10 bg-white p-3">
              {employees.length > 0 ? (
                employees.map((employee) => {
                  const checked = assignDraftIds.includes(employee._id);
                  return (
                    <label key={employee._id} className="flex items-center gap-2 text-sm text-gray-800">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setAssignDraftIds((prev) =>
                            checked ? prev.filter((id) => id !== employee._id) : [...prev, employee._id],
                          )
                        }
                        className="h-4 w-4 accent-[#8B1C1C]"
                      />
                      <span>{employee.nombre}</span>
                    </label>
                  );
                })
              ) : (
                <p className="text-xs text-secondary">Sin empleados disponibles.</p>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setAssignModalTaskId(null)}
                className="rounded-2xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleSaveAssignees()}
                disabled={savingTaskId === assignModalTask.id}
                className="rounded-2xl bg-[#8B1C1C] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <AnimatePresence>
        {activePreview ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setActivePreview(null);
              setSelectedPreviewFileId(null);
            }}
          >
            <motion.div
              ref={previewRef}
              tabIndex={-1}
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{activePreview.clientName}</p>
                  <p className="text-xs text-gray-500">Responsable: {activePreview.designerName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActivePreview(null);
                    setSelectedPreviewFileId(null);
                  }}
                  className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-500"
                >
                  Cerrar
                </button>
              </div>
              {activePreview.files.length > 0 ? (
                <div className="flex flex-wrap gap-2 border-b border-gray-100 px-6 py-3">
                  {activePreview.files.map((file) => {
                    const isSelected = activePreviewFile?.id === file.id;
                    return (
                      <button
                        key={file.id}
                        type="button"
                        onClick={() => setSelectedPreviewFileId(file.id)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                          isSelected
                            ? "bg-[#8B1C1C] text-white"
                            : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {file.name}
                      </button>
                    );
                  })}
                </div>
              ) : null}
              {activePreviewFile?.src ? (
                <div className="border-b border-gray-100 px-6 py-2">
                  <a
                    href={activePreviewFile.src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-xs font-semibold text-[#8B1C1C] underline hover:no-underline"
                  >
                    Abrir archivo seleccionado: {activePreviewFile.src}
                  </a>
                </div>
              ) : null}
              <div className="max-h-[75vh] overflow-auto bg-gray-100 p-4">
                {activePreviewFile?.type === "render" && activePreviewFile.src ? (
                  <img
                    src={activePreviewFile.src}
                    alt={`Diseño ${activePreview.clientName}`}
                    className="mx-auto max-h-[70vh] w-full object-contain"
                  />
                ) : activePreviewFile?.src ? (
                  <iframe
                    title={`Archivo ${activePreview.clientName}`}
                    src={activePreviewFile.src}
                    className="h-[70vh] w-full rounded-2xl border border-gray-200 bg-white"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4 py-12">
                    {activePreviewFile ? (
                      <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
                        {activePreviewFile.type === "pdf" ? (
                          <FileText className="h-8 w-8 text-gray-400" />
                        ) : (
                          <ImageIcon className="h-8 w-8 text-gray-400" />
                        )}
                        <span className="text-sm font-medium text-gray-700">
                          Sin vista previa disponible para: {activePreviewFile.name}
                        </span>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No hay archivos para vista previa.</p>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
                <button
                  type="button"
                  onClick={goToPrev}
                  className="flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-100"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </button>
                <p className="text-xs text-gray-400">Usa ← → para navegar · ESC para cerrar</p>
                <button
                  type="button"
                  onClick={goToNext}
                  className="flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-100"
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <ApprovalToast
        type={toastType}
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}
