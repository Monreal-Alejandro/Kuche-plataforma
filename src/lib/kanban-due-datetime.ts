/**
 * dueDate en KanbanTask: fecha `YYYY-MM-DD` (legado) o fecha-hora local `YYYY-MM-DDTHH:mm`.
 */

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Valor para input type="datetime-local" (vacío si no hay dato). */
export function dueDateToDatetimeLocalValue(stored: string | undefined): string {
  if (!stored?.trim()) return "";
  const t = stored.trim();
  const m = DATE_ONLY.exec(t);
  if (m) {
    return `${m[1]}-${m[2]}-${m[3]}T09:00`;
  }
  if (t.includes("T") && t.length >= 16) {
    return t.slice(0, 16);
  }
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Persistir desde datetime-local (undefined si vacío). */
export function datetimeLocalValueToDueDate(value: string): string | undefined {
  const v = value.trim();
  return v ? v : undefined;
}

export function dueDateHasTime(stored: string | undefined): boolean {
  return Boolean(stored?.trim().includes("T"));
}

/** Valor para input type="date" (solo YYYY-MM-DD). */
export function dueDateToDateInputValue(stored: string | undefined): string {
  if (!stored?.trim()) return "";
  return stored.trim().split("T")[0] ?? "";
}

/** Persistir desde input date. */
export function dateInputValueToDueDate(value: string): string | undefined {
  const v = value.trim();
  return v ? v : undefined;
}

/** Timestamp para ordenar tareas (fecha local coherente con date-only legado). */
export function dueDateToSortTimestamp(stored: string | undefined, fallback: number): number {
  if (!stored?.trim()) return fallback;
  const t = stored.trim();
  const m = DATE_ONLY.exec(t);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const day = Number(m[3]);
    return new Date(y, mo, day, 9, 0).getTime();
  }
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? fallback : d.getTime();
}

/** Texto en tarjetas: solo fecha si no hay hora; fecha+hora si hay `T`. */
export function formatDueDateTimeDisplay(stored: string | undefined): string {
  if (!stored?.trim()) return "";
  const t = stored.trim();
  const m = DATE_ONLY.exec(t);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const day = Number(m[3]);
    const d = new Date(y, mo, day, 12, 0);
    return d.toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  }
  const d = new Date(t);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
  }
  return t;
}
