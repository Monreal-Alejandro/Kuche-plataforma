"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Calendar, CalendarX, LayoutDashboard, Palette, Tags } from "lucide-react";

type TaskLike = {
  status?: string;
  column?: string;
  type?: string;
  title?: string;
  client?: string;
};

type AppointmentLike = {
  status?: string;
  assignedTo?: string | null;
  date?: string;
  time?: string;
  type?: string;
  client?: string;
};

const safeParseArray = <T,>(value: string | null): T[] => {
  if (!value) {
    return [];
  }
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const formatDateLabel = (date: Date) => {
  const formatted = new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

const getGreeting = (date: Date) => {
  const hour = date.getHours();
  if (hour < 12) {
    return "Buenos días";
  }
  if (hour < 19) {
    return "Buenas tardes";
  }
  return "Buenas noches";
};

export default function AdminPage() {
  const [tasks, setTasks] = useState<TaskLike[]>([]);
  const [appointments, setAppointments] = useState<AppointmentLike[]>([]);
  const [catalogItems, setCatalogItems] = useState<unknown[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const storedTasks = window.localStorage.getItem("kuche_kanban_tasks");
    const storedAppointments = window.localStorage.getItem("kuche_agenda_events");
    const storedCatalog = window.localStorage.getItem("kuche_catalogo_precios");

    setTasks(safeParseArray<TaskLike>(storedTasks));
    setAppointments(safeParseArray<AppointmentLike>(storedAppointments));
    setCatalogItems(safeParseArray<unknown>(storedCatalog));
    setIsHydrated(true);
  }, []);

  const activeTasks = useMemo(
    () =>
      tasks.filter((task) => {
        const status = task.status ?? task.column ?? "";
        return status !== "Completado";
      }).length,
    [tasks],
  );

  const designsPending = useMemo(
    () =>
      tasks.filter((task) => {
        const status = task.status ?? task.column ?? "";
        return status === "Revisión" || status === "En Diseño";
      }).length,
    [tasks],
  );

  const pendingAppointments = useMemo(
    () =>
      appointments.filter((appointment) => {
        const assigned = appointment.assignedTo ?? "";
        return appointment.status === "Pendiente" || !assigned;
      }).length,
    [appointments],
  );

  const totalMaterials = useMemo(() => catalogItems.length, [catalogItems]);

  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => today.toISOString().slice(0, 10), [today]);
  const greeting = useMemo(() => getGreeting(today), [today]);
  const dateLabel = useMemo(() => formatDateLabel(today), [today]);

  const typeDotStyles: Record<string, string> = {
    "Levantamiento / Medidas": "bg-sky-500",
    "Cotización en sitio": "bg-emerald-500",
    "Presentación de diseño": "bg-purple-500",
  };

  const todayAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.date === todayKey),
    [appointments, todayKey],
  );

  const attentionItems = useMemo(() => {
    const pendingAgenda = appointments
      .filter((appointment) => appointment.status === "Pendiente" || !appointment.assignedTo)
      .map((appointment) => ({
        id: `agenda-${appointment.client ?? "sin-cliente"}-${appointment.time ?? ""}`,
        label: `🚨 Cita sin asignar: ${appointment.client ?? "Cliente sin nombre"}`,
        href: "/admin/agenda",
      }));

    const reviewDesigns = tasks
      .filter((task) => {
        const status = task.status ?? task.column ?? "";
        return task.type?.toLowerCase() === "diseño" && status === "Revisión";
      })
      .map((task) => ({
        id: `design-${task.title ?? "sin-titulo"}`,
        label: `🎨 Diseño listo para aprobar: ${task.title ?? "Proyecto sin título"}`,
        href: "/admin/disenos",
      }));

    return [...pendingAgenda, ...reviewDesigns];
  }, [appointments, tasks]);

  const cards = [
    {
      title: "Tareas activas",
      value: isHydrated ? activeTasks.toString() : "—",
      href: "/admin/operaciones",
      icon: LayoutDashboard,
      accent: "bg-slate-100 text-slate-600",
    },
    {
      title: "Diseños por aprobar",
      value: isHydrated ? designsPending.toString() : "—",
      href: "/admin/disenos",
      icon: Palette,
      accent: "bg-purple-100 text-purple-700",
    },
    {
      title: "Citas pendientes de asignar",
      value: isHydrated ? pendingAppointments.toString() : "—",
      href: "/admin/agenda",
      icon: Calendar,
      accent: "bg-rose-100 text-rose-700",
      attention: pendingAppointments > 0,
    },
    {
      title: "Total de materiales",
      value: isHydrated ? totalMaterials.toString() : "—",
      href: "/admin/precios",
      icon: Tags,
      accent: "bg-amber-100 text-amber-700",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            {greeting}, Admin
          </h1>
          <p className="mt-2 text-sm text-gray-500">{dateLabel}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              href={card.href}
              className={`relative rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg backdrop-blur-md transition-all hover:scale-[1.02] hover:shadow-xl ${
                card.attention ? "ring-1 ring-rose-200" : ""
              }`}
            >
              {card.attention ? (
                <span className="absolute right-4 top-4 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-rose-500" />
                </span>
              ) : null}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{card.title}</p>
                  <p className="mt-4 text-4xl font-bold text-gray-900">{card.value}</p>
                </div>
                <span className={`rounded-2xl p-2 ${card.accent}`}>
                  <Icon className="h-5 w-5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg backdrop-blur-md">
          <p className="text-xs uppercase tracking-[0.3em] text-secondary">Logística</p>
          <h3 className="mt-2 text-xl font-semibold text-gray-900">Agenda de Hoy</h3>
          {todayAppointments.length > 0 ? (
            <div className="mt-6 space-y-4">
              {todayAppointments.map((appointment) => {
                const dotClass = typeDotStyles[appointment.type ?? ""] ?? "bg-gray-300";
                return (
                  <div
                    key={`${appointment.client ?? "cita"}-${appointment.time ?? ""}`}
                    className="flex items-start justify-between gap-4 rounded-2xl border border-gray-100 bg-white/70 p-4"
                  >
                    <div className="min-w-[72px] text-lg font-semibold text-gray-900">
                      {appointment.time ?? "--:--"}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {appointment.client ?? "Cliente sin nombre"}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                        <span className={`h-2 w-2 rounded-full ${dotClass}`} />
                        <span>{appointment.type ?? "Visita"}</span>
                      </div>
                    </div>
                    <div className="text-xs font-medium text-gray-500">
                      {appointment.assignedTo || "Sin asignar"}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-white/70 p-4 text-sm text-gray-500">
              <CalendarX className="h-5 w-5 text-gray-400" />
              No hay visitas programadas para hoy.
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg backdrop-blur-md">
          <p className="text-xs uppercase tracking-[0.3em] text-secondary">Cuellos de botella</p>
          <h3 className="mt-2 text-xl font-semibold text-gray-900">Requiere tu atención</h3>
          <div className="mt-6">
            {attentionItems.length > 0 ? (
              attentionItems.map((item) => (
                <div
                  key={item.id}
                  className="mb-3 flex items-center justify-between gap-4 rounded-2xl border border-red-100 bg-white p-4 shadow-sm"
                >
                  <p className="text-sm font-medium text-gray-700">{item.label}</p>
                  <Link
                    href={item.href}
                    className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600 transition hover:border-gray-300"
                  >
                    Ir a resolver
                  </Link>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white/70 p-4 text-sm text-gray-500">
                Todo está bajo control por ahora.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
