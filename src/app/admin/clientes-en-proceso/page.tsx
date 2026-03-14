"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, User, FileText, Eye, Download } from "lucide-react";
import { kanbanStorageKey, type KanbanTask } from "@/lib/kanban";
import { openPreliminarPdfInNewTab, downloadPreliminarPdf } from "@/lib/pdf-preliminar";

const stageLabel: Record<string, string> = {
  citas: "Citas",
  disenos: "Diseños",
  cotizacion: "Cotización",
  contrato: "Seguimiento",
};

function getTasksInProgress(tasks: KanbanTask[], filterByUser: string | null): KanbanTask[] {
  const inProgress = tasks.filter((task) => {
    if (task.stage === "contrato" && (task.followUpStatus === "confirmado" || task.followUpStatus === "descartado")) {
      return false;
    }
    return true;
  });
  if (filterByUser) {
    return inProgress.filter((task) =>
      Array.isArray(task.assignedTo) ? task.assignedTo.includes(filterByUser) : false,
    );
  }
  return inProgress;
}

export default function AdminClientesEnProcesoPage() {
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(kanbanStorageKey);
      const parsed = stored ? (JSON.parse(stored) as KanbanTask[]) : [];
      setTasks(Array.isArray(parsed) ? parsed : []);
    } catch {
      setTasks([]);
    }
    setIsHydrated(true);
  }, []);

  const inProgress = getTasksInProgress(tasks, null);

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm text-secondary hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al panel
        </Link>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
              Clientes en proceso
            </p>
            <h1 className="text-2xl font-semibold text-gray-900">Clientes en proceso</h1>
            <p className="mt-1 text-sm text-secondary">
              Todos los clientes que aun no han confirmado o descartado.
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mt-6"
      >
        {inProgress.length === 0 ? (
          <div className="rounded-3xl border border-primary/10 bg-white p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 font-medium text-gray-600">No hay clientes en proceso</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {inProgress.map((task) => (
              <div
                key={task.id}
                className="rounded-3xl border border-primary/10 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{task.project}</h3>
                    <p className="mt-1 text-sm text-secondary">{task.title}</p>
                    <span className="mt-2 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {stageLabel[task.stage] ?? task.stage}
                    </span>
                    {task.assignedTo?.length ? (
                      <p className="mt-2 text-xs text-secondary">
                        Asignado: {task.assignedTo.join(", ")}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-6 space-y-3 border-t border-primary/10 pt-4">
                  {task.preliminarData ? (
                    <div className="rounded-2xl bg-emerald-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                        Cotizacion preliminar
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openPreliminarPdfInNewTab(task.preliminarData!)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Ver PDF
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            downloadPreliminarPdf(
                              task.preliminarData!,
                              `cotizacion-preliminar-${task.project.replace(/\s+/g, "-")}.pdf`,
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Descargar PDF
                        </button>
                      </div>
                    </div>
                  ) : null}
                  {task.cotizacionFormalData ? (
                    <div className="rounded-2xl bg-violet-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-violet-800">
                        Cotizacion formal
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openPreliminarPdfInNewTab(task.cotizacionFormalData!)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-violet-700 shadow-sm transition hover:bg-violet-100"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Ver PDF
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            downloadPreliminarPdf(
                              task.cotizacionFormalData!,
                              `cotizacion-formal-${task.project.replace(/\s+/g, "-")}.pdf`,
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-violet-700 shadow-sm transition hover:bg-violet-100"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Descargar PDF
                        </button>
                      </div>
                    </div>
                  ) : null}
                  {!task.preliminarData && !task.cotizacionFormalData ? (
                    <p className="text-xs text-secondary">Sin PDFs generados aun.</p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
