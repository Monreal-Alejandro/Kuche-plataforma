"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";

type ProjectStatus = "Pendiente" | "Aprobado" | "Revisión";

type Project = {
  id: string;
  clientName: string;
  designerName: string;
  image: string;
  date: string;
  status: ProjectStatus;
};

const initialProjects: Project[] = [
  {
    id: "proj-001",
    clientName: "Mariana Fuentes",
    designerName: "Andrea López",
    image: "/images/render1.jpg",
    date: "2026-02-10",
    status: "Pendiente",
  },
  {
    id: "proj-002",
    clientName: "Héctor Salas",
    designerName: "Luis Ramírez",
    image: "/images/render2.jpg",
    date: "2026-02-12",
    status: "Revisión",
  },
  {
    id: "proj-003",
    clientName: "Fabiola Martínez",
    designerName: "Carla Gómez",
    image: "/images/render3.jpg",
    date: "2026-02-15",
    status: "Aprobado",
  },
  {
    id: "proj-004",
    clientName: "Grupo Aranda",
    designerName: "Diego Torres",
    image: "/images/render4.jpg",
    date: "2026-02-18",
    status: "Pendiente",
  },
];

const statusStyles: Record<ProjectStatus, string> = {
  Pendiente: "bg-amber-100 text-amber-700",
  Aprobado: "bg-emerald-100 text-emerald-700",
  Revisión: "bg-rose-100 text-rose-700",
};

const filters = ["Todos", "Pendientes", "Aprobados"] as const;
type FilterOption = (typeof filters)[number];

export default function DisenosPage() {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [activeFeedbackId, setActiveFeedbackId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterOption>("Todos");
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>({});
  const [activePreview, setActivePreview] = useState<Project | null>(null);

  const filteredProjects = useMemo(() => {
    if (filter === "Todos") {
      return projects;
    }
    if (filter === "Pendientes") {
      return projects.filter((project) => project.status === "Pendiente");
    }
    return projects.filter((project) => project.status === "Aprobado");
  }, [filter, projects]);

  const previewIndex = useMemo(
    () => filteredProjects.findIndex((project) => project.id === activePreview?.id),
    [activePreview?.id, filteredProjects],
  );

  const goToNext = useCallback(() => {
    if (!filteredProjects.length) {
      return;
    }
    const nextIndex = previewIndex >= 0 ? (previewIndex + 1) % filteredProjects.length : 0;
    setActivePreview(filteredProjects[nextIndex]);
  }, [filteredProjects, previewIndex]);

  const goToPrev = useCallback(() => {
    if (!filteredProjects.length) {
      return;
    }
    const nextIndex =
      previewIndex >= 0
        ? (previewIndex - 1 + filteredProjects.length) % filteredProjects.length
        : filteredProjects.length - 1;
    setActivePreview(filteredProjects[nextIndex]);
  }, [filteredProjects, previewIndex]);

  useEffect(() => {
    if (!activePreview) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActivePreview(null);
      } else if (event.key === "ArrowRight") {
        goToNext();
      } else if (event.key === "ArrowLeft") {
        goToPrev();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activePreview, goToNext, goToPrev]);

  const handleApprove = (projectId: string) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId ? { ...project, status: "Aprobado" } : project,
      ),
    );
    setActiveFeedbackId(null);
  };

  const handleSendFeedback = (projectId: string) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId ? { ...project, status: "Revisión" } : project,
      ),
    );
    setFeedbackDrafts((prev) => ({ ...prev, [projectId]: "" }));
    setActiveFeedbackId(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Aprobación de Diseños</h1>
        <p className="mt-2 text-sm text-gray-500">
          Revisa y autoriza los renders 3D antes de la presentación al cliente.
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
              <div className="relative h-60 overflow-hidden">
                <img
                  src={project.image}
                  alt={`Render ${project.clientName}`}
                  className="h-full w-full cursor-zoom-in object-cover transition-transform duration-500 hover:scale-105"
                  onClick={() => setActivePreview(project)}
                />
                <span
                  className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[project.status]}`}
                >
                  {project.status}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-4 p-5">
                <div>
                  <p className="text-lg font-semibold text-gray-900">{project.clientName}</p>
                  <p className="text-sm text-gray-500">Diseñador: {project.designerName}</p>
                </div>
                <p className="text-xs text-gray-400">Actualizado: {project.date}</p>
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
                          onClick={() => handleSendFeedback(project.id)}
                          className="rounded-2xl bg-[#8B1C1C] px-4 py-2 text-xs font-semibold text-white"
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
                        onClick={() => handleApprove(project.id)}
                        className="flex items-center gap-2 rounded-2xl bg-[#8B1C1C] px-4 py-2 text-xs font-semibold text-white"
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
                    <p className="text-xs text-gray-400">Diseño aprobado.</p>
                  )}
                </div>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>

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
                  <p className="text-xs text-gray-500">Diseñador: {activePreview.designerName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePreview(null)}
                  className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-500"
                >
                  Cerrar
                </button>
              </div>
              <div className="max-h-[75vh] overflow-hidden bg-gray-100">
                <img
                  src={activePreview.image}
                  alt={`Render ${activePreview.clientName}`}
                  className="h-full w-full object-cover"
                />
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
                <p className="text-xs text-gray-400">
                  Usa ← → para navegar · ESC para cerrar
                </p>
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
