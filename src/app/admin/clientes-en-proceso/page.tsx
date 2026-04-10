"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Calendar, Download, FileText, User, X } from "lucide-react";

import { useAdminWorkflow } from "@/contexts/AdminWorkflowContext";
import { getAssignedLabel, isTaskInProgress, type AdminWorkflowTask } from "@/lib/admin-workflow";
import { getCotizacionesFormalesList, getPreliminarList } from "@/lib/kanban";
import { downloadFormalPdf, downloadPreliminarPdf } from "@/lib/pdf-preliminar";

const stageLabel: Record<string, string> = {
  citas: "Citas",
  disenos: "Diseños",
  cotizacion: "Cotización",
  contrato: "Seguimiento",
};

const stageToneClass: Record<string, string> = {
  citas: "bg-sky-100 text-sky-700 border-sky-500",
  disenos: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-500",
  cotizacion: "bg-indigo-100 text-indigo-700 border-indigo-500",
  contrato: "bg-emerald-100 text-emerald-700 border-emerald-500",
};

type PublicStatusDraft = {
  anticipo: number;
  segundoPago: number;
  liquidacion: number;
  nota: string;
};

const PUBLIC_STATUS_STORAGE_KEY = "kuche-admin-public-status-map";

const defaultPublicStatusDraft: PublicStatusDraft = {
  anticipo: 0,
  segundoPago: 0,
  liquidacion: 0,
  nota: "",
};

const formatDate = (timestamp: number | undefined): string => {
  if (!timestamp) return "Sin fecha";
  const date = new Date(timestamp);
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(Math.max(0, Math.round(value || 0)));

const normalizeDraftNumber = (value: string): number => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
};

const splitIntoColumns = <T,>(items: T[], columnCount: number): T[][] => {
  if (items.length === 0) return [];
  const count = Math.max(1, Math.min(columnCount, items.length));
  const columns = Array.from({ length: count }, () => [] as T[]);

  items.forEach((item, index) => {
    columns[index % count].push(item);
  });

  return columns;
};

export default function AdminClientesEnProcesoPage() {
  const { refresh } = useAdminWorkflow();
  const [tasks, setTasks] = useState<AdminWorkflowTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<AdminWorkflowTask | null>(null);
  const [publicStatusTaskId, setPublicStatusTaskId] = useState<string | null>(null);
  const [publicStatusMap, setPublicStatusMap] = useState<Record<string, PublicStatusDraft>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(PUBLIC_STATUS_STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored) as Record<string, PublicStatusDraft>;
      if (parsed && typeof parsed === "object") {
        setPublicStatusMap(parsed);
      }
    } catch {
      setPublicStatusMap({});
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PUBLIC_STATUS_STORAGE_KEY, JSON.stringify(publicStatusMap));
  }, [publicStatusMap]);

  useEffect(() => {
    const load = async () => {
      try {
        const loadedTasks = await refresh();
        const inProgress = loadedTasks.filter(isTaskInProgress);
        setTasks(inProgress);
      } catch (currentError) {
        setError(currentError instanceof Error ? currentError.message : "No se pudieron cargar clientes en proceso");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [refresh]);

  const taskColumns = useMemo(() => splitIntoColumns(tasks, 3), [tasks]);

  const publicStatusTask = useMemo(
    () => tasks.find((task) => task.id === publicStatusTaskId) ?? null,
    [publicStatusTaskId, tasks],
  );

  const publicStatusDraft = publicStatusTaskId
    ? publicStatusMap[publicStatusTaskId] ?? defaultPublicStatusDraft
    : defaultPublicStatusDraft;

  const totalPagado =
    publicStatusDraft.anticipo + publicStatusDraft.segundoPago + publicStatusDraft.liquidacion;

  const updateDraft = (patch: Partial<PublicStatusDraft>) => {
    if (!publicStatusTaskId) return;
    setPublicStatusMap((prev) => ({
      ...prev,
      [publicStatusTaskId]: {
        ...(prev[publicStatusTaskId] ?? defaultPublicStatusDraft),
        ...patch,
      },
    }));
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100/35 to-white px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-secondary hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            Volver al panel
          </Link>
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100">
              <User className="h-6 w-6 text-sky-600" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Administración</p>
              <h1 className="text-2xl font-semibold text-gray-900">Clientes en proceso</h1>
            </div>
          </div>
          <p className="mt-2 text-sm text-secondary">
            Todos los clientes que aún no han sido confirmados o marcados como inactivos.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mt-8"
        >
          {tasks.length === 0 ? (
            <div className="rounded-3xl border border-primary/10 bg-white p-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <User className="h-8 w-8 text-gray-400" />
              </div>
              <p className="mt-4 text-lg font-medium text-gray-900">No hay clientes en proceso</p>
              <p className="mt-2 text-sm text-secondary">Cuando un proyecto avance en el flujo aparecerá aquí.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 md:flex-row md:items-start">
              {taskColumns.map((column, colIdx) => (
                <div key={colIdx} className="flex min-w-0 flex-1 flex-col gap-4">
                  {column.map((task) => {
                    const tone = stageToneClass[task.stage] ?? "bg-primary/10 text-primary border-primary";
                    return (
                      <div
                        key={task.id}
                        className={`min-w-0 rounded-2xl border border-primary/10 bg-white p-5 shadow-sm transition hover:shadow-md border-l-4 ${tone.split(" ")[2]}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 flex-1 items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-100">
                              <User className="h-5 w-5 text-sky-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-secondary">Proyecto</p>
                              <h3 className="break-words text-base font-semibold text-gray-900">{task.project}</h3>
                              <p className="mt-0.5 text-sm text-secondary">{task.title}</p>
                              {task.codigoProyecto ? (
                                <p className="mt-2 break-all text-[11px] text-secondary">
                                  Código: <span className="font-semibold text-primary">{task.codigoProyecto}</span>
                                </p>
                              ) : null}
                            </div>
                          </div>
                          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${tone}`}>
                            {stageLabel[task.stage] ?? task.stage}
                          </span>
                        </div>

                        <div className="mt-4 border-t border-gray-100 pt-4 text-xs text-secondary">
                          <div>Asignado: {getAssignedLabel(task)}</div>
                          <div className="mt-1 inline-flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(task.createdAt)}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedTask(task)}
                          className="mt-5 w-full rounded-xl bg-sky-700 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-800"
                        >
                          Abrir expediente
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-8 rounded-2xl bg-sky-50 px-6 py-4"
        >
          <p className="text-sm text-sky-900">
            <strong>Total de clientes en proceso:</strong> {tasks.length}
          </p>
        </motion.div>
      </div>

      <AnimatePresence>
        {selectedTask ? (
          <motion.div
            key={selectedTask.id}
            className="fixed inset-0 z-[100] flex"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button
              type="button"
              aria-label="Cerrar panel"
              className="h-full min-h-0 flex-1 cursor-default bg-black/50"
              onClick={() => setSelectedTask(null)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="en-proceso-expediente-title"
              className="flex h-full w-full max-w-xl shrink-0 flex-col overflow-y-auto bg-white shadow-2xl"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
                <div className="min-w-0">
                  <p id="en-proceso-expediente-title" className="text-lg font-semibold text-gray-900">
                    Expediente
                  </p>
                  <p className="mt-1 break-words text-sm font-medium text-primary">{selectedTask.project}</p>
                  <p className="text-xs text-secondary">{selectedTask.title}</p>
                  {selectedTask.codigoProyecto ? (
                    <p className="mt-2 break-all text-[11px] text-secondary">
                      Código: <span className="font-semibold text-primary">{selectedTask.codigoProyecto}</span>
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="rounded-xl p-2 text-secondary hover:bg-gray-100 hover:text-gray-900"
                  aria-label="Cerrar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="min-h-0 flex-1 space-y-6 px-6 py-6">
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                  <p><strong>Etapa:</strong> {stageLabel[selectedTask.stage] ?? selectedTask.stage}</p>
                  <p className="mt-1"><strong>Asignado a:</strong> {getAssignedLabel(selectedTask)}</p>
                  <p className="mt-1"><strong>Creado:</strong> {formatDate(selectedTask.createdAt)}</p>
                </div>

                {(selectedTask.clientFiles?.length ?? 0) > 0 ? (
                  <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-800">Archivos del cliente</p>
                    <div className="mt-3 space-y-2">
                      {selectedTask.clientFiles?.map((file) => (
                        <a
                          key={`client-file-${file.id}`}
                          href={file.src}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-xs font-medium text-sky-900"
                        >
                          <span className="truncate">{file.name}</span>
                          <span className="rounded-full bg-sky-100 px-2 py-1 uppercase">{file.type}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}

                {getPreliminarList(selectedTask).length > 0 ? (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">Cotización preliminar</p>
                    <div className="mt-3 space-y-2">
                      {getPreliminarList(selectedTask).map((data, index) => (
                        <div key={`preliminar-${index}`} className="flex items-center justify-between rounded-xl bg-white px-3 py-2">
                          <span className="text-xs font-medium text-emerald-800">{data.projectType}</span>
                          <button
                            type="button"
                            onClick={() =>
                              downloadPreliminarPdf(
                                data,
                                `cotizacion-preliminar-${(data.projectType || "proyecto").replace(/\s+/g, "-")}-${selectedTask.project.replace(/\s+/g, "-")}.pdf`,
                              )
                            }
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2.5 py-1.5 text-xs font-semibold text-emerald-800"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Descargar PDF
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {getCotizacionesFormalesList(selectedTask).length > 0 ? (
                  <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-800">Cotización formal</p>
                    <div className="mt-3 space-y-2">
                      {getCotizacionesFormalesList(selectedTask).map((data, index) => (
                        <div key={`formal-${index}`} className="flex items-center justify-between rounded-xl bg-white px-3 py-2">
                          <span className="text-xs font-medium text-violet-800">{data.projectType}</span>
                          <button
                            type="button"
                            onClick={() =>
                              downloadFormalPdf(
                                data,
                                `cotizacion-formal-${(data.projectType || "proyecto").replace(/\s+/g, "-")}-${selectedTask.project.replace(/\s+/g, "-")}.pdf`,
                              )
                            }
                            className="inline-flex items-center gap-1 rounded-lg bg-violet-100 px-2.5 py-1.5 text-xs font-semibold text-violet-800"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Descargar PDF
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {(selectedTask.clientFiles?.length ?? 0) === 0 && getPreliminarList(selectedTask).length === 0 && getCotizacionesFormalesList(selectedTask).length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-primary/15 bg-primary/5 px-4 py-3 text-xs text-secondary">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Sin archivos vinculados aún.
                    </div>
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => setPublicStatusTaskId(selectedTask.id)}
                  className="w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-white"
                >
                  Estatus público
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {publicStatusTask ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/45 px-4"
            onClick={() => setPublicStatusTaskId(null)}
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              className="w-full max-w-2xl rounded-3xl border border-white/70 bg-white p-6 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Estatus público</p>
                  <h3 className="mt-2 text-xl font-semibold text-gray-900">{publicStatusTask.project}</h3>
                  <p className="mt-1 text-sm text-secondary">{publicStatusTask.title}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPublicStatusTaskId(null)}
                  className="rounded-xl p-2 text-secondary hover:bg-gray-100"
                  aria-label="Cerrar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-primary/10 bg-primary/[0.03] p-4 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">Información del cliente</p>
                  <p className="mt-3"><strong>Proyecto:</strong> {publicStatusTask.project}</p>
                  <p className="mt-1"><strong>Código:</strong> {publicStatusTask.codigoProyecto || "Por definir"}</p>
                  <p className="mt-1"><strong>Etapa:</strong> {stageLabel[publicStatusTask.stage] ?? publicStatusTask.stage}</p>
                  <p className="mt-1"><strong>Asignado:</strong> {getAssignedLabel(publicStatusTask)}</p>
                </div>

                <div className="rounded-2xl border border-primary/10 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">Seguimiento de pagos</p>
                  <div className="mt-3 grid gap-3">
                    <label className="text-xs font-semibold text-secondary">
                      Anticipo
                      <input
                        type="number"
                        min={0}
                        value={publicStatusDraft.anticipo}
                        onChange={(event) => updateDraft({ anticipo: normalizeDraftNumber(event.target.value) })}
                        className="mt-1 w-full rounded-xl border border-primary/10 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="text-xs font-semibold text-secondary">
                      2do pago
                      <input
                        type="number"
                        min={0}
                        value={publicStatusDraft.segundoPago}
                        onChange={(event) => updateDraft({ segundoPago: normalizeDraftNumber(event.target.value) })}
                        className="mt-1 w-full rounded-xl border border-primary/10 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="text-xs font-semibold text-secondary">
                      Liquidación
                      <input
                        type="number"
                        min={0}
                        value={publicStatusDraft.liquidacion}
                        onChange={(event) => updateDraft({ liquidacion: normalizeDraftNumber(event.target.value) })}
                        className="mt-1 w-full rounded-xl border border-primary/10 px-3 py-2 text-sm"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-primary/10 bg-white p-4">
                <label className="text-xs font-semibold text-secondary">
                  Nota de seguimiento
                  <textarea
                    value={publicStatusDraft.nota}
                    onChange={(event) => updateDraft({ nota: event.target.value })}
                    placeholder="Anota acuerdos con cliente, recordatorios o estatus de cobro..."
                    className="mt-2 min-h-[110px] w-full rounded-2xl border border-primary/10 px-3 py-2 text-sm"
                  />
                </label>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
                <span className="rounded-full bg-primary/5 px-3 py-1 text-secondary">
                  Pagado acumulado: <span className="font-semibold text-primary">{formatCurrency(totalPagado)}</span>
                </span>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setPublicStatusTaskId(null)}
                  className="w-full rounded-2xl border border-primary/10 bg-white py-3 text-xs font-semibold text-secondary"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => setPublicStatusTaskId(null)}
                  className="w-full rounded-2xl bg-accent py-3 text-xs font-semibold text-white"
                >
                  Guardar seguimiento
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
