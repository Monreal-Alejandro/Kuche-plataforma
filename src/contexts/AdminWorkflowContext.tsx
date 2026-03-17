"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { buildTaskUpdatePayload, type AdminWorkflowTask } from "@/lib/admin-workflow";
import {
  actualizarTarjetaCita,
  actualizarTarjetaTarea,
  cargarTableroAdmin,
  crearTareaWorkflow,
  eliminarTarjetaCita,
  eliminarTarjetaTarea,
  moverTarjetaTarea,
  obtenerAlertasSeguimiento,
  promoverCitaATarea,
} from "@/lib/axios/adminWorkflowApi";
import type { CrearTareaData } from "@/lib/axios/tareasApi";
import type { TaskStage } from "@/lib/kanban";

type WorkflowTaskPatch = Partial<AdminWorkflowTask>;

type AdminWorkflowContextValue = {
  tasks: AdminWorkflowTask[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<AdminWorkflowTask[]>;
  moveTask: (task: AdminWorkflowTask, stage: TaskStage) => Promise<void>;
  updateTask: (task: AdminWorkflowTask, patch: WorkflowTaskPatch) => Promise<void>;
  createTask: (data: CrearTareaData) => Promise<void>;
  deleteTask: (task: AdminWorkflowTask) => Promise<void>;
  reactivateTask: (task: AdminWorkflowTask) => Promise<void>;
  markFollowUpAlerts: (daysWithoutChanges?: number) => Promise<number>;
};

const AdminWorkflowContext = createContext<AdminWorkflowContextValue | null>(null);

const DAY_MS = 24 * 60 * 60 * 1000;

export function AdminWorkflowProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<AdminWorkflowTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const response = await cargarTableroAdmin();
    setTasks(response.tasks);
    if (response.errors.length > 0 && response.tasks.length === 0) {
      setError(response.errors[0]);
    }
    setIsLoading(false);
    return response.tasks;
  }, []);

  const moveTask = useCallback(
    async (task: AdminWorkflowTask, stage: TaskStage) => {
      if (task.stage === stage) return;

      if (task.backendSource === "cita") {
        if (stage === "citas") {
          const estado = task.citaFinished ? "completada" : task.citaStarted ? "en_proceso" : "programada";
          const response = await actualizarTarjetaCita(task.sourceId, { estado });
          if (!response.success) {
            throw new Error(response.message || "No se pudo actualizar la cita");
          }
          await refresh();
          return;
        }

        const promoted = await promoverCitaATarea(task, stage);
        if (!promoted.success) {
          throw new Error(promoted.message || "No se pudo mover la cita al tablero de tareas");
        }
        await refresh();
        return;
      }

      const response = await moverTarjetaTarea(task.sourceId, stage);
      if (!response.success) {
        throw new Error(response.message || "No se pudo mover la tarea");
      }
      await refresh();
    },
    [refresh],
  );

  const updateTask = useCallback(
    async (task: AdminWorkflowTask, patch: WorkflowTaskPatch) => {
      const mergedTask = { ...task, ...patch };

      if (task.backendSource === "cita") {
        if (mergedTask.stage !== "citas") {
          await moveTask(task, mergedTask.stage);
          return;
        }

        const response = await actualizarTarjetaCita(task.sourceId, {
          cita: {
            nombreCliente: mergedTask.project,
            informacionAdicional: mergedTask.title,
            ubicacion: mergedTask.location,
          },
          ingenieroId: mergedTask.assignedToIds?.[0],
          estado: mergedTask.status === "completada" ? "completada" : mergedTask.assignedToIds?.length ? "en_proceso" : "programada",
        });

        if (!response.success) {
          throw new Error(response.message || "No se pudo actualizar la cita");
        }
        await refresh();
        return;
      }

      const payload = buildTaskUpdatePayload(mergedTask);
      const response = await actualizarTarjetaTarea(task.sourceId, payload);
      if (!response.success) {
        throw new Error(response.message || "No se pudo actualizar la tarea");
      }
      await refresh();
    },
    [moveTask, refresh],
  );

  const createTask = useCallback(
    async (data: CrearTareaData) => {
      const response = await crearTareaWorkflow(data);
      if (!response.success) {
        throw new Error(response.message || "No se pudo crear la tarea");
      }
      await refresh();
    },
    [refresh],
  );

  const deleteTask = useCallback(
    async (task: AdminWorkflowTask) => {
      const response = task.backendSource === "cita"
        ? await eliminarTarjetaCita(task.sourceId)
        : await eliminarTarjetaTarea(task.sourceId);

      if (!response.success) {
        throw new Error(response.message || "No se pudo eliminar la tarjeta");
      }
      await refresh();
    },
    [refresh],
  );

  const reactivateTask = useCallback(
    async (task: AdminWorkflowTask) => {
      await updateTask(task, {
        followUpStatus: "pendiente",
        followUpEnteredAt: Date.now(),
        status: "pendiente",
      });
    },
    [updateTask],
  );

  const markFollowUpAlerts = useCallback(
    async (daysWithoutChanges = 3) => {
      try {
        return await obtenerAlertasSeguimiento(daysWithoutChanges);
      } catch {
      }

      const now = Date.now();
      const threshold = daysWithoutChanges * DAY_MS;
      const candidates = tasks.filter((task) => task.stage === "contrato" && task.backendSource === "tarea");
      let alerts = 0;

      for (const task of candidates) {
        const reference = task.followUpEnteredAt ?? task.createdAt ?? now;
        if (now - reference >= threshold) {
          alerts += 1;
        }
      }

      return alerts;
    },
    [tasks],
  );

  const value = useMemo<AdminWorkflowContextValue>(
    () => ({
      tasks,
      isLoading,
      error,
      refresh,
      moveTask,
      updateTask,
      createTask,
      deleteTask,
      reactivateTask,
      markFollowUpAlerts,
    }),
    [createTask, deleteTask, error, isLoading, markFollowUpAlerts, moveTask, reactivateTask, refresh, tasks, updateTask],
  );

  return <AdminWorkflowContext.Provider value={value}>{children}</AdminWorkflowContext.Provider>;
}

export function useAdminWorkflow() {
  const context = useContext(AdminWorkflowContext);
  if (!context) {
    throw new Error("useAdminWorkflow debe usarse dentro de AdminWorkflowProvider");
  }
  return context;
}