"use client";

import { useEffect, useState } from "react";
import { Loader2, User } from "lucide-react";

import ClientWorkflowGrid from "@/components/admin/ClientWorkflowGrid";
import { useAdminWorkflow } from "@/contexts/AdminWorkflowContext";
import { isTaskInProgress, type AdminWorkflowTask } from "@/lib/admin-workflow";

export default function AdminClientesEnProcesoPage() {
  const { refresh } = useAdminWorkflow();
  const [tasks, setTasks] = useState<AdminWorkflowTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const loadedTasks = await refresh();
        setTasks(loadedTasks.filter(isTaskInProgress));
      } catch (currentError) {
        setError(currentError instanceof Error ? currentError.message : "No se pudieron cargar clientes en proceso");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [refresh]);

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
      title="Clientes en proceso"
      subtitle="Todos los clientes que aún no han confirmado ni marcado como inactivo el proyecto."
      badgeLabel="En proceso"
      badgeClassName="bg-primary/10 text-primary"
      emptyTitle="No hay clientes en proceso"
      emptyDescription="Cuando un proyecto avance en el flujo aparecerá aquí."
      tasks={tasks}
      icon={<User className="h-6 w-6 text-primary" />}
      footerToneClassName="bg-primary/10 text-primary"
      footerText="Total de clientes en proceso:"
    />
  );
}
