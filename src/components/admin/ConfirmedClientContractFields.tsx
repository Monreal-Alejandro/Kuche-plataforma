"use client";

import { useEffect, useState } from "react";
import { CalendarRange, Tag } from "lucide-react";
import {
  kanbanStorageKey,
  saveKanbanTasksToLocalStorage,
  deriveProjectTypesLabel,
  type KanbanTask,
} from "@/lib/kanban";

type Props = {
  task: KanbanTask;
  onUpdate: (next: KanbanTask) => void;
};

export function ConfirmedClientContractFields({ task, onUpdate }: Props) {
  const [contractDate, setContractDate] = useState("");
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState("");
  const [projectTypeSummary, setProjectTypeSummary] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    setContractDate(task.contractDate ?? "");
    setEstimatedDeliveryDate(task.estimatedDeliveryDate ?? "");
    setProjectTypeSummary(task.projectTypeSummary ?? "");
  }, [task.id, task.contractDate, task.estimatedDeliveryDate, task.projectTypeSummary]);

  const suggestedTypes = deriveProjectTypesLabel(task);

  const save = () => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(kanbanStorageKey);
    if (!stored) return;
    try {
      const tasks = JSON.parse(stored) as KanbanTask[];
      const next = tasks.map((t) =>
        t.id === task.id
          ? {
              ...t,
              contractDate: contractDate.trim() || undefined,
              estimatedDeliveryDate: estimatedDeliveryDate.trim() || undefined,
              projectTypeSummary: projectTypeSummary.trim() || undefined,
            }
          : t,
      );
      saveKanbanTasksToLocalStorage(next);
      const updated = next.find((t) => t.id === task.id);
      if (updated) {
        onUpdate(updated);
        setSavedFlash(true);
        window.setTimeout(() => setSavedFlash(false), 2000);
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="rounded-2xl border border-emerald-200/90 bg-emerald-50/60 p-3">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-900">
        <CalendarRange className="h-3.5 w-3.5" />
        Contrato y proyecto
      </p>
      <div className="mt-3 space-y-3">
        <div>
          <label className="block text-[11px] font-medium text-emerald-900/90">Fecha de contrato</label>
          <input
            type="date"
            value={contractDate}
            onChange={(e) => setContractDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-emerald-200 bg-white px-2 py-1.5 text-sm text-gray-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-emerald-900/90">Fecha posible de entrega</label>
          <input
            type="date"
            value={estimatedDeliveryDate}
            onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-emerald-200 bg-white px-2 py-1.5 text-sm text-gray-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
          />
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-900/90">
            <Tag className="h-3 w-3" />
            Tipo de proyecto
          </label>
          <input
            type="text"
            value={projectTypeSummary}
            onChange={(e) => setProjectTypeSummary(e.target.value)}
            placeholder={suggestedTypes ? `Ej. ${suggestedTypes}` : "Ej. Cocina, Clóset, Baño"}
            className="mt-1 w-full rounded-lg border border-emerald-200 bg-white px-2 py-1.5 text-sm text-gray-900 placeholder:text-emerald-700/40 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
          />
          {suggestedTypes ? (
            <p className="mt-1 text-[10px] text-emerald-800/70">
              Sugerido desde cotizaciones: {suggestedTypes}
            </p>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        onClick={save}
        className="mt-3 w-full rounded-xl bg-emerald-700 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800"
      >
        {savedFlash ? "Guardado" : "Guardar fechas y tipo"}
      </button>
    </div>
  );
}
