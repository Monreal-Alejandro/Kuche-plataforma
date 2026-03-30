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
      const patchKeys = Object.keys(patch);
      const isFollowUpOnlyPatch =
        patchKeys.length > 0 &&
        patchKeys.every((key) => key === "followUpStatus" || key === "status" || key === "followUpEnteredAt");

      const mergedTask: AdminWorkflowTask = {
        ...task,
        ...patch,
        visita: {
          fechaProgramada:
            patch.visita?.fechaProgramada ??
            patch.visitScheduledAt ??
            task.visita?.fechaProgramada ??
            task.visitScheduledAt,
          aprobadaPorAdmin:
            patch.visita?.aprobadaPorAdmin ??
            patch.designApprovedByAdmin ??
            task.visita?.aprobadaPorAdmin ??
            task.designApprovedByAdmin ??
            false,
          aprobadaPorCliente:
            patch.visita?.aprobadaPorCliente ??
            patch.designApprovedByClient ??
            task.visita?.aprobadaPorCliente ??
            task.designApprovedByClient ??
            false,
        },
      };

      if (task.backendSource === "cita") {
        if (mergedTask.stage !== "citas") {
          await moveTask(task, mergedTask.stage);
          return;
        }

        // For citas, prefer the edited title when present so it becomes cita.informacionAdicional.
        const titleFromPatch = typeof patch.title === "string" ? patch.title.trim() : "";
        const notesFromPatch = typeof patch.notes === "string" ? patch.notes.trim() : "";
        const citaInfo =
          titleFromPatch ||
          notesFromPatch ||
          mergedTask.notes?.trim() ||
          mergedTask.title?.trim() ||
          "";

        const estadoCita =
          mergedTask.status === "completada" || mergedTask.citaFinished
            ? "completada"
            : mergedTask.citaStarted || (mergedTask.assignedToIds?.length ?? 0) > 0
              ? "en_proceso"
              : "programada";

        const response = await actualizarTarjetaCita(task.sourceId, {
          cita: {
            nombreCliente: mergedTask.project,
            informacionAdicional: citaInfo,
            ubicacion: mergedTask.location,
          },
          ingenieroId: mergedTask.assignedToIds?.[0],
          estado: estadoCita,
        });

        if (!response.success) {
          throw new Error(response.message || "No se pudo actualizar la cita");
        }
        await refresh();
        return;
      }

      // Algunos backends ignoran followUpStatus cuando llega en un payload "full".
      // Para confirmar/inactivar/reactivar, enviamos payload minimo y estable.
      if (isFollowUpOnlyPatch) {
        const minimalPayload: Record<string, unknown> = {};
        if (typeof patch.followUpStatus === "string") minimalPayload.followUpStatus = patch.followUpStatus;
        if (typeof patch.status === "string") minimalPayload.estado = patch.status;
        if (typeof patch.followUpEnteredAt === "number") {
          minimalPayload.followUpEnteredAt = patch.followUpEnteredAt;
        }

        const response = await actualizarTarjetaTarea(task.sourceId, minimalPayload);
        if (!response.success) {
          throw new Error(response.message || "No se pudo actualizar seguimiento de la tarea");
        }
        await refresh();
        return;
      }

      const payload = buildTaskUpdatePayload(mergedTask);
      console.log("[AdminWorkflowContext] updateTask payload:", {
        taskId: task.id,
        sourceId: task.sourceId,
        backendSource: task.backendSource,
        patch,
        payload,
      });
      const response = await actualizarTarjetaTarea(task.sourceId, payload);
      console.log("[AdminWorkflowContext] updateTask response:", response);
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