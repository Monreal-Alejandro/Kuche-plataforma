"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Download, Eye, FileText, User } from "lucide-react";

import { getAssignedLabel, type AdminWorkflowTask } from "@/lib/admin-workflow";
import { getCotizacionesFormalesList, getPreliminarList } from "@/lib/kanban";
import {
  downloadFormalPdf,
  downloadPreliminarPdf,
  openFormalPdfInNewTab,
  openPreliminarPdfInNewTab,
} from "@/lib/pdf-preliminar";

type ClientWorkflowGridProps = {
  title: string;
  subtitle: string;
  badgeLabel: string;
  badgeClassName: string;
  emptyTitle: string;
  emptyDescription: string;
  tasks: AdminWorkflowTask[];
  icon: React.ReactNode;
  footerToneClassName: string;
  footerText: string;
  action?: (task: AdminWorkflowTask) => React.ReactNode;
};

const stageLabel: Record<string, string> = {
  citas: "Citas",
  disenos: "Diseños",
  cotizacion: "Cotización",
  contrato: "Seguimiento",
};

const formatDate = (timestamp: number | undefined): string => {
  if (!timestamp) return "Sin fecha";
  const date = new Date(timestamp);
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
};

export default function ClientWorkflowGrid({
  title,
  subtitle,
  badgeLabel,
  badgeClassName,
  emptyTitle,
  emptyDescription,
  tasks,
  icon,
  footerToneClassName,
  footerText,
  action,
}: ClientWorkflowGridProps) {
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
        <div className="mb-2 flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${badgeClassName}`}>
            {icon}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
              Administración
            </p>
            <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
          </div>
        </div>
        <p className="mt-2 text-sm text-secondary">{subtitle}</p>
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
            <p className="mt-4 text-lg font-medium text-gray-900">{emptyTitle}</p>
            <p className="mt-2 text-sm text-secondary">{emptyDescription}</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => (
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
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClassName}`}>
                    {badgeLabel}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-secondary">
                    <Calendar className="h-4 w-4" />
                    <span>Fecha: {formatDate(task.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-secondary">
                    <User className="h-4 w-4" />
                    <span>Asignado a: {getAssignedLabel(task)}</span>
                  </div>
                </div>

                <div className="mt-6 space-y-3 border-t border-primary/10 pt-4">
                  {getPreliminarList(task).length > 0 ? (
                    <div className="rounded-2xl bg-emerald-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                        Cotización preliminar {getPreliminarList(task).length > 1 ? `(${getPreliminarList(task).length})` : ""}
                      </p>
                      <div className="mt-2 space-y-2">
                        {getPreliminarList(task).map((data, index) => (
                          <div key={`${task.id}-preliminar-${index}`} className="flex flex-wrap items-center gap-2 rounded-xl bg-white/80 px-3 py-2">
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
                                  `cotizacion-preliminar-${(data.projectType || "proyecto").replace(/\s+/g, "-")}-${task.project.replace(/\s+/g, "-")}.pdf`,
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

                  {getCotizacionesFormalesList(task).length > 0 ? (
                    <div className="rounded-2xl bg-violet-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-violet-800">
                        Cotización formal {getCotizacionesFormalesList(task).length > 1 ? `(${getCotizacionesFormalesList(task).length})` : ""}
                      </p>
                      <div className="mt-2 space-y-2">
                        {getCotizacionesFormalesList(task).map((data, index) => (
                          <div key={`${task.id}-formal-${index}`} className="flex flex-wrap items-center gap-2 rounded-xl bg-white/80 px-3 py-2">
                            <span className="text-xs font-medium text-violet-800">{data.projectType}</span>
                            <button
                              type="button"
                              onClick={() => openFormalPdfInNewTab(data)}
                              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-100"
                            >
                              <Eye className="h-3 w-3" />
                              Ver PDF
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                downloadFormalPdf(
                                  data,
                                  `cotizacion-formal-${(data.projectType || "proyecto").replace(/\s+/g, "-")}-${task.project.replace(/\s+/g, "-")}.pdf`,
                                )
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-100"
                            >
                              <Download className="h-3 w-3" />
                              Descargar PDF
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {getPreliminarList(task).length === 0 && getCotizacionesFormalesList(task).length === 0 ? (
                    <div className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-secondary">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Sin PDFs generados aún.
                      </div>
                    </div>
                  ) : null}
                </div>

                {action ? <div className="mt-4">{action(task)}</div> : null}
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className={`mt-8 rounded-2xl px-6 py-4 ${footerToneClassName}`}
      >
        <p className="text-sm">
          <strong>{footerText}</strong> {tasks.length}
        </p>
      </motion.div>
    </div>
  );
}
