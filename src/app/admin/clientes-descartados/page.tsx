"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, XCircle, User, FileText, Calendar, FolderOpen, RotateCcw, Eye, Download } from "lucide-react";
import {
  initialKanbanTasks,
  kanbanStorageKey,
  saveKanbanTasksToLocalStorage,
  getPreliminarList,
  getCotizacionesFormalesList,
  type KanbanTask,
} from "@/lib/kanban";
import {
  openPreliminarPdfInNewTab,
  downloadPreliminarPdf,
  openFormalPdfInNewTab,
  downloadFormalPdf,
  openWorkshopPdfInNewTab,
  downloadWorkshopPdf,
} from "@/lib/pdf-preliminar";
import { hasWorkshopPdfActions } from "@/lib/formal-pdf-storage";
import { splitIntoColumns } from "@/lib/split-into-columns";
import { useClientCardColumns } from "@/hooks/useClientCardColumns";

type TaskFile = {
  id: string;
  name: string;
  type: "pdf" | "render" | "otro";
};

const formatDate = (timestamp: number | undefined): string => {
  if (!timestamp) return "Sin fecha";
  const date = new Date(timestamp);
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
};

const mergeTasks = (storedTasks: KanbanTask[]): KanbanTask[] => {
  const map = new Map(storedTasks.map((task) => [task.id, task]));
  initialKanbanTasks.forEach((task) => {
    if (!map.has(task.id)) {
      map.set(task.id, task);
    }
  });
  return Array.from(map.values());
};

export default function ClientesDescartadosPage() {
  const [clients, setClients] = useState<KanbanTask[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const columnCount = useClientCardColumns(3);
  const clientColumns = useMemo(() => {
    if (clients.length === 0) return [];
    const n = Math.min(columnCount, clients.length);
    return splitIntoColumns(clients, n);
  }, [clients, columnCount]);

  useEffect(() => {
    const stored = window.localStorage.getItem(kanbanStorageKey);
    let allTasks: KanbanTask[] = [];
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as KanbanTask[];
        allTasks = mergeTasks(parsed);
        saveKanbanTasksToLocalStorage(allTasks);
      } catch {
        allTasks = initialKanbanTasks;
      }
    } else {
      allTasks = initialKanbanTasks;
      saveKanbanTasksToLocalStorage(allTasks);
    }
    
    const discarded = allTasks.filter((task) => task.followUpStatus === "descartado");
    setClients(discarded);
    setIsHydrated(true);
  }, []);

  const handleReactivate = (clientId: string) => {
    const stored = window.localStorage.getItem(kanbanStorageKey);
    if (stored) {
      try {
        const tasks = JSON.parse(stored) as KanbanTask[];
        const updatedTasks = tasks.map((task) => {
          if (task.id === clientId) {
            return {
              ...task,
              followUpStatus: "pendiente" as const,
              status: "pendiente" as const,
              stage: "contrato" as const,
              followUpEnteredAt: Date.now(),
            };
          }
          return task;
        });
        saveKanbanTasksToLocalStorage(updatedTasks);
        setClients(updatedTasks.filter((t) => t.followUpStatus === "descartado"));
      } catch {
        console.error("Error al reactivar cliente");
      }
    }
  };

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-accent/30 to-white px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
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
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-200">
              <XCircle className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                Administración
              </p>
              <h1 className="text-2xl font-semibold text-gray-900">
                Proyectos Inactivos
              </h1>
            </div>
          </div>
          <p className="mt-2 text-sm text-secondary ml-15">
            Proyectos que por ahora no continúan. Conservamos la información por si el cliente regresa más adelante.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mt-8"
        >
          {clients.length === 0 ? (
            <div className="rounded-3xl border border-primary/10 bg-white p-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <User className="h-8 w-8 text-gray-400" />
              </div>
              <p className="mt-4 text-lg font-medium text-gray-900">
                No hay proyectos inactivos
              </p>
              <p className="mt-2 text-sm text-secondary">
                Los proyectos que no continúen aparecerán aquí.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 md:flex-row md:items-start">
              {clientColumns.map((col, colIdx) => (
                <div key={colIdx} className="flex min-w-0 flex-1 flex-col gap-4">
                  {col.map((client) => (
                <div
                  key={client.id}
                  className="min-w-0 rounded-3xl border border-primary/10 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-100">
                        <User className="h-6 w-6 text-gray-500" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="break-words font-semibold text-gray-900">{client.project}</h3>
                        <p className="text-sm text-secondary">{client.title}</p>
                        {client.codigoProyecto ? (
                          <p className="mt-2 break-all text-[11px] text-secondary">
                            Código:{" "}
                            <span className="font-semibold text-primary">{client.codigoProyecto}</span>
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                      Inactivo
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-secondary">
                      <Calendar className="h-4 w-4" />
                      <span>Fecha: {formatDate(client.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-secondary">
                      <User className="h-4 w-4" />
                      <span>Asignado a: {client.assignedTo?.join(", ") || "Sin asignar"}</span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3 border-t border-primary/10 pt-4">
                    {getPreliminarList(client).length > 0 ? (
                      <div className="rounded-2xl bg-emerald-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                          Levantamiento detallado{" "}
                          {getPreliminarList(client).length > 1 ? `(${getPreliminarList(client).length})` : ""}
                        </p>
                        <div className="mt-2 space-y-2">
                          {getPreliminarList(client).map((data, idx) => (
                            <div key={idx} className="flex flex-wrap items-center gap-2 rounded-xl bg-white/80 px-3 py-2">
                              <span className="text-xs font-medium text-emerald-800">{data.projectType}</span>
                              <button
                                type="button"
                                onClick={() => openPreliminarPdfInNewTab(data)}
                                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                              >
                                <Eye className="h-3 w-3" />
                                Ver PDF
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  downloadPreliminarPdf(
                                    data,
                                    `levantamiento-detallado-${(data.projectType || "proyecto").replace(/\s+/g, "-")}-${client.project.replace(/\s+/g, "-")}.pdf`,
                                  )
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                              >
                                <Download className="h-3 w-3" />
                                Descargar PDF
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {getCotizacionesFormalesList(client).length > 0 ? (
                      <div className="rounded-2xl bg-violet-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-violet-800">
                          Cotización formal + hoja de taller{" "}
                          {getCotizacionesFormalesList(client).length > 1
                            ? `(${getCotizacionesFormalesList(client).length})`
                            : ""}
                        </p>
                        <div className="mt-2 space-y-2">
                          {getCotizacionesFormalesList(client).map((data, idx) => (
                            <div key={idx} className="space-y-2 rounded-xl bg-white/80 px-3 py-2">
                              <span className="text-xs font-medium text-violet-800">{data.projectType}</span>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-semibold uppercase tracking-wide text-violet-600/80">
                                  Formal
                                </span>
                                <button
                                  type="button"
                                  onClick={() => openFormalPdfInNewTab(data)}
                                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-100"
                                >
                                  <Eye className="h-3 w-3" />
                                  Ver
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    downloadFormalPdf(
                                      data,
                                      `cotizacion-formal-${(data.projectType || "proyecto").replace(/\s+/g, "-")}-${client.project.replace(/\s+/g, "-")}.pdf`,
                                    )
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-100"
                                >
                                  <Download className="h-3 w-3" />
                                  Descargar
                                </button>
                                {hasWorkshopPdfActions(data) ? (
                                  <>
                                    <span className="ml-1 text-[10px] font-semibold uppercase tracking-wide text-violet-600/80">
                                      Taller
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => openWorkshopPdfInNewTab(data)}
                                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-100"
                                    >
                                      <Eye className="h-3 w-3" />
                                      Ver
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        downloadWorkshopPdf(
                                          data,
                                          `hoja-taller-${(data.projectType || "proyecto").replace(/\s+/g, "-")}-${client.project.replace(/\s+/g, "-")}.pdf`,
                                        )
                                      }
                                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-100"
                                    >
                                      <Download className="h-3 w-3" />
                                      Descargar
                                    </button>
                                  </>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {getPreliminarList(client).length === 0 && getCotizacionesFormalesList(client).length === 0 ? (
                      <p className="text-xs text-secondary">Sin cotizaciones PDF en esta tarjeta.</p>
                    ) : null}
                  </div>

                  {client.files && client.files.length > 0 ? (
                    <div className="mt-4 border-t border-primary/10 pt-4">
                      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-secondary">
                        <FolderOpen className="h-4 w-4" />
                        Archivos ({client.files.length})
                      </p>
                      <div className="mt-2 space-y-2">
                        {client.files.map((file) => (
                          <div
                            key={file.id}
                            className="flex min-w-0 items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 text-sm"
                          >
                            <FileText className="h-4 w-4 shrink-0 text-secondary" />
                            <span className="min-w-0 flex-1 truncate" title={file.name}>
                              {file.name}
                            </span>
                            <span className="shrink-0 text-xs uppercase text-secondary">{file.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 border-t border-primary/10 pt-4">
                      <p className="text-sm text-secondary">Sin archivos adjuntos</p>
                    </div>
                  )}

                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => handleReactivate(client.id)}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-primary/10 bg-white py-3 text-sm font-semibold text-primary hover:bg-accent/10"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reactivar cliente
                    </button>
                  </div>
                </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-8 rounded-2xl bg-gray-100 px-6 py-4"
        >
          <p className="text-sm text-gray-700">
            <strong>Total de proyectos inactivos:</strong> {clients.length}
          </p>
          <p className="mt-1 text-xs text-secondary">
            Puedes reactivar a cualquier cliente si decide volver a contactar con la empresa.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
