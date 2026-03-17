"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

import ClientWorkflowGrid from "@/components/admin/ClientWorkflowGrid";
import { useAdminWorkflow } from "@/contexts/AdminWorkflowContext";
import { isTaskConfirmed, type AdminWorkflowTask } from "@/lib/admin-workflow";

export default function ClientesConfirmadosPage() {
  const { refresh } = useAdminWorkflow();
  const [tasks, setTasks] = useState<AdminWorkflowTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const loadedTasks = await refresh();
        setTasks(loadedTasks.filter(isTaskConfirmed));
      } catch (currentError) {
        setError(currentError instanceof Error ? currentError.message : "No se pudieron cargar clientes confirmados");
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
      title="Clientes confirmados"
      subtitle="Clientes que ya confirmaron su proyecto con la empresa."
      badgeLabel="Confirmado"
      badgeClassName="bg-emerald-100 text-emerald-700"
      emptyTitle="No hay clientes confirmados aún"
      emptyDescription="Cuando un cliente confirme su proyecto aparecerá aquí."
      tasks={tasks}
      icon={<CheckCircle2 className="h-6 w-6 text-emerald-600" />}
      footerToneClassName="bg-emerald-50 text-emerald-800"
      footerText="Total de clientes confirmados:"
    />
  );
}
