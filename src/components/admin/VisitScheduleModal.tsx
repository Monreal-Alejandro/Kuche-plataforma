"use client";

import { useEffect, useMemo, useState } from "react";

type VisitScheduleModalProps = {
  isOpen: boolean;
  taskLabel: string;
  initialIso?: string;
  occupiedSlots: string[];
  isSaving?: boolean;
  onClose: () => void;
  onConfirm: (isoDateTime: string) => Promise<void> | void;
};

const pad = (value: number) => value.toString().padStart(2, "0");

const toLocalSlot = (isoDateTime?: string): string | null => {
  if (!isoDateTime) return null;
  const date = new Date(isoDateTime);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const splitLocalSlot = (localSlot: string | null): { date: string; time: string } => {
  if (!localSlot || !localSlot.includes("T")) return { date: "", time: "" };
  const [date, time] = localSlot.split("T");
  return { date, time };
};

const toUiDateTime = (isoDateTime?: string) => splitLocalSlot(toLocalSlot(isoDateTime));

const todayLocalDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

const formatSlotLabel = (localSlot: string) => {
  const [datePart, timePart] = localSlot.split("T");
  const parsed = new Date(`${datePart}T${timePart}:00`);
  if (Number.isNaN(parsed.getTime())) return localSlot.replace("T", " ");
  return parsed.toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function VisitScheduleModal({
  isOpen,
  taskLabel,
  initialIso,
  occupiedSlots,
  isSaving,
  onClose,
  onConfirm,
}: VisitScheduleModalProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [error, setError] = useState<string | null>(null);

  const initialLocalSlot = useMemo(() => toLocalSlot(initialIso), [initialIso]);

  useEffect(() => {
    if (!isOpen) return;
    const initial = toUiDateTime(initialIso);
    setDate(initial.date);
    setTime(initial.time);
    setError(null);
  }, [initialIso, isOpen]);

  const occupiedSet = useMemo(() => new Set(occupiedSlots), [occupiedSlots]);

  const occupiedForSelectedDay = useMemo(() => {
    if (!date) return [];
    const prefix = `${date}T`;
    return occupiedSlots
      .filter((slot) => slot.startsWith(prefix))
      .sort((a, b) => a.localeCompare(b));
  }, [date, occupiedSlots]);

  if (!isOpen) return null;

  const submit = async () => {
    setError(null);

    if (!date || !time) {
      setError("Selecciona fecha y hora para agendar la visita.");
      return;
    }

    const localSlot = `${date}T${time}`;
    if (occupiedSet.has(localSlot) && localSlot !== initialLocalSlot) {
      setError("Ese horario ya esta ocupado por otra tarea. Elige otro horario.");
      return;
    }

    const selectedDate = new Date(`${date}T${time}:00`);
    if (Number.isNaN(selectedDate.getTime())) {
      setError("La fecha u hora no es valida.");
      return;
    }

    if (selectedDate.getTime() < Date.now()) {
      setError("No puedes agendar visitas en fechas u horas pasadas.");
      return;
    }

    await onConfirm(selectedDate.toISOString());
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-3xl border border-white/70 bg-white/95 p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-secondary">Agenda de visita</p>
        <h3 className="mt-2 text-xl font-semibold text-gray-900">Programar visita</h3>
        <p className="mt-2 text-sm text-secondary">Proyecto: {taskLabel}</p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
            Fecha
            <input
              type="date"
              value={date}
              min={todayLocalDate()}
              onChange={(event) => setDate(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
            />
          </label>
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
            Hora
            <input
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
            />
          </label>
        </div>

        <div className="mt-4 rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-xs text-secondary">
          {occupiedForSelectedDay.length > 0 ? (
            <p>
              Horarios ocupados este dia: {occupiedForSelectedDay.map(formatSlotLabel).join(" · ")}
            </p>
          ) : (
            <p>No hay horarios ocupados en la fecha seleccionada.</p>
          )}
        </div>

        {error ? (
          <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-600">{error}</p>
        ) : null}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-primary/10 bg-white px-5 py-2 text-xs font-semibold text-secondary"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={Boolean(isSaving)}
            className="rounded-2xl bg-primary px-5 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            Guardar visita
          </button>
        </div>
      </div>
    </div>
  );
}
