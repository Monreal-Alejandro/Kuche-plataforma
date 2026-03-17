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
    notes: task.notes,
  };
}

export default function DisenosPage() {
  const { refresh, updateTask } = useAdminWorkflow();
  const [projects, setProjects] = useState<DesignProject[]>([]);
  const [tasksById, setTasksById] = useState<Record<string, AdminWorkflowTask>>({});
  const [activeFeedbackId, setActiveFeedbackId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterOption>("Todos");
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>({});
  const [activePreview, setActivePreview] = useState<DesignProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const loadedTasks = await refresh();
    const designTasks = loadedTasks.filter((task) => task.stage === "disenos");
    setTasksById(Object.fromEntries(designTasks.map((task) => [task.id, task])));
    setProjects(designTasks.map(taskToProject));
    setIsLoading(false);
  }, [refresh]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEscapeClose(Boolean(activePreview), () => setActivePreview(null));
  useFocusTrap(Boolean(activePreview), previewRef);

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

  const goToNext = useCallback(() => {
    if (!filteredProjects.length) return;
    const nextIndex = previewIndex >= 0 ? (previewIndex + 1) % filteredProjects.length : 0;
    setActivePreview(filteredProjects[nextIndex]);
  }, [filteredProjects, previewIndex]);

  const goToPrev = useCallback(() => {
    if (!filteredProjects.length) return;
    const nextIndex =
      previewIndex >= 0
        ? (previewIndex - 1 + filteredProjects.length) % filteredProjects.length
        : filteredProjects.length - 1;
    setActivePreview(filteredProjects[nextIndex]);
  }, [filteredProjects, previewIndex]);

  useEffect(() => {
    if (!activePreview) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActivePreview(null);
      else if (event.key === "ArrowRight") goToNext();
      else if (event.key === "ArrowLeft") goToPrev();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activePreview, goToNext, goToPrev]);

  const persistTask = async (taskId: string, updates: Partial<AdminWorkflowTask>) => {
    const task = tasksById[taskId];
    if (!task) return;
    setSavingTaskId(taskId);
    try {
      await updateTask(task, {
        notes: updates.notes ?? task.notes ?? "",
        designApprovedByAdmin: updates.designApprovedByAdmin ?? task.designApprovedByAdmin ?? false,
      });
      await loadProjects();
      setActiveFeedbackId(null);
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "No se pudo actualizar el diseño");
    } finally {
      setSavingTaskId(null);
    }
  };

  const handleApprove = async (taskId: string) => {
    await persistTask(taskId, { designApprovedByAdmin: true, notes: "" });
  };

  const handleSendFeedback = async (taskId: string) => {
    const feedback = feedbackDrafts[taskId]?.trim();
    if (!feedback) return;
    await persistTask(taskId, { designApprovedByAdmin: false, notes: feedback });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Aprobación de Diseños</h1>
        <p className="mt-2 text-sm text-gray-500">
          Revisa y autoriza los renders o planos recibidos desde el backend antes de la presentación al cliente.
        </p>
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
                      onClick={() => setActivePreview(project)}
                    />
                  ) : project.fileUrl ? (
                    <button
                      type="button"
                      onClick={() => setActivePreview(project)}
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
                  <p className="text-xs text-gray-400">Actualizado: {project.date}</p>
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
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">Diseño aprobado por administración.</p>
                    )}
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {activePreview ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActivePreview(null)}
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
                  onClick={() => setActivePreview(null)}
                  className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-500"
                >
                  Cerrar
                </button>
              </div>
              <div className="max-h-[75vh] overflow-auto bg-gray-100 p-4">
                {activePreview.image ? (
                  <img
                    src={activePreview.image}
                    alt={`Diseño ${activePreview.clientName}`}
                    className="mx-auto max-h-[70vh] w-full object-contain"
                  />
                ) : activePreview.fileUrl ? (
                  <iframe
                    title={`Archivo ${activePreview.clientName}`}
                    src={activePreview.fileUrl}
                    className="h-[70vh] w-full rounded-2xl border border-gray-200 bg-white"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4 py-12">
                    {activePreview.files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3"
                      >
                        {file.type === "pdf" ? (
                          <FileText className="h-8 w-8 text-gray-400" />
                        ) : (
                          <ImageIcon className="h-8 w-8 text-gray-400" />
                        )}
                        <span className="text-sm font-medium text-gray-700">{file.name}</span>
                      </div>
                    ))}
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
    </div>
  );
}
