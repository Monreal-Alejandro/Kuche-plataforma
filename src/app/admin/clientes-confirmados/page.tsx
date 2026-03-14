"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, User, FileText, Calendar, FolderOpen } from "lucide-react";
import { initialKanbanTasks, kanbanStorageKey, type KanbanTask } from "@/lib/kanban";

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

export default function ClientesConfirmadosPage() {
  const [clients, setClients] = useState<KanbanTask[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(kanbanStorageKey);
    let allTasks: KanbanTask[] = [];
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as KanbanTask[];
        allTasks = mergeTasks(parsed);
        window.localStorage.setItem(kanbanStorageKey, JSON.stringify(allTasks));
      } catch {
        allTasks = initialKanbanTasks;
      }
    } else {
      allTasks = initialKanbanTasks;
      window.localStorage.setItem(kanbanStorageKey, JSON.stringify(allTasks));
    }
    
    const confirmed = allTasks.filter((task) => task.followUpStatus === "confirmado");
    setClients(confirmed);
    setIsHydrated(true);
  }, []);

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
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                Administración
              </p>
              <h1 className="text-2xl font-semibold text-gray-900">
                Clientes Confirmados
              </h1>
            </div>
          </div>
          <p className="mt-2 text-sm text-secondary ml-15">
            Clientes que han confirmado su proyecto con la empresa.
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
                No hay clientes confirmados aún
              </p>
              <p className="mt-2 text-sm text-secondary">
                Cuando un cliente confirme su proyecto, aparecerá aquí.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {clients.map((client) => (
                <div
                  key={client.id}
                  className="rounded-3xl border border-primary/10 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                        <User className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{client.project}</h3>
                        <p className="text-sm text-secondary">{client.title}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Confirmado
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
                            className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-secondary" />
                              <span className="truncate">{file.name}</span>
                            </div>
                            <span className="text-xs uppercase text-secondary">{file.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 border-t border-primary/10 pt-4">
                      <p className="text-sm text-secondary">Sin archivos adjuntos</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-8 rounded-2xl bg-emerald-50 px-6 py-4"
        >
          <p className="text-sm text-emerald-800">
            <strong>Total de clientes confirmados:</strong> {clients.length}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
