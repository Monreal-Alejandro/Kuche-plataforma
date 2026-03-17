"use client";

import { useEffect, useState } from "react";
import { Loader2, RotateCcw, XCircle } from "lucide-react";

import ClientWorkflowGrid from "@/components/admin/ClientWorkflowGrid";
import { useAdminWorkflow } from "@/contexts/AdminWorkflowContext";
import { isTaskDiscarded, type AdminWorkflowTask } from "@/lib/admin-workflow";

export default function ClientesDescartadosPage() {
  const { refresh, reactivateTask } = useAdminWorkflow();
  const [tasks, setTasks] = useState<AdminWorkflowTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);

  const load = async () => {
    try {
      const loadedTasks = await refresh();
      setTasks(loadedTasks.filter(isTaskDiscarded));
      setError(null);
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "No se pudieron cargar clientes descartados");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleReactivate = async (task: AdminWorkflowTask) => {
    setSavingTaskId(task.id);
    try {
      await reactivateTask(task);
      await load();
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "No se pudo reactivar el cliente");
    } finally {
      setSavingTaskId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>;
  }

  return (
    <ClientWorkflowGrid
      title="Clientes descartados"
      subtitle="Clientes que no continuaron con el proyecto, pero se conservan para seguimiento futuro."
      badgeLabel="Descartado"
      badgeClassName="bg-gray-200 text-gray-600"
      emptyTitle="No hay clientes descartados"
      emptyDescription="Los clientes que no continúen con su proyecto aparecerán aquí."
      tasks={tasks}
      icon={<XCircle className="h-6 w-6 text-gray-600" />}
      footerToneClassName="bg-gray-100 text-gray-700"
      footerText="Total de clientes descartados:"
      action={(task) => (
        <button
          type="button"
          onClick={() => void handleReactivate(task)}
          disabled={savingTaskId === task.id}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-primary/10 bg-white py-3 text-sm font-semibold text-primary hover:bg-accent/10 disabled:opacity-50"
        >
          <RotateCcw className="h-4 w-4" />
          Reactivar cliente
        </button>
      )}
    />
  );
}
