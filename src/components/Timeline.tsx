"use client";

import { motion } from "framer-motion";
import { Bell, CheckCircle2 } from "lucide-react";

type PaymentStatus = "paid" | "pending";
type TimelineItem =
  | { id: string; label: string; kind: "tech" }
  | { id: string; label: string; kind: "payment"; status: PaymentStatus; tooltip: string };

const technicalSteps = ["Diseño", "CNC", "Instalación"];

const timelineItems: TimelineItem[] = [
  { id: "design", label: "Diseño", kind: "tech" },
  {
    id: "deposit",
    label: "Anticipo",
    kind: "payment",
    status: "paid",
    tooltip: "Pago recibido. Gracias por impulsar tu proyecto.",
  },
  { id: "cnc", label: "CNC", kind: "tech" },
  {
    id: "second-payment",
    label: "2do Pago",
    kind: "payment",
    status: "pending",
    tooltip: "Recordatorio: 2do pago pendiente. Tu proyecto sigue avanzando.",
  },
  { id: "install", label: "Instalación", kind: "tech" },
  {
    id: "settlement",
    label: "Liquidación",
    kind: "payment",
    status: "pending",
    tooltip: "Recordatorio: liquidación pendiente. Tu proyecto sigue avanzando.",
  },
];

const currentStage = "Instalación";

export default function Timeline() {
  const currentTechIndex = Math.max(0, technicalSteps.indexOf(currentStage));
  const currentItemIndex = Math.max(
    0,
    timelineItems.findIndex(
      (item) => item.kind === "tech" && item.label === currentStage,
    ),
  );
  const progressPercent =
    timelineItems.length > 1 ? (currentItemIndex / (timelineItems.length - 1)) * 100 : 0;

  return (
    <section className="rounded-3xl bg-white p-8 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-secondary">Tu Proyecto</p>
          <h2 className="mt-2 text-2xl font-semibold">Progreso técnico y pagos</h2>
        </div>
        <span className="rounded-full bg-accent/10 px-4 py-2 text-xs font-semibold text-accent">
          {currentStage}
        </span>
      </div>

      <div className="mt-8">
        <div className="relative h-2 rounded-full bg-primary/10">
          <div
            className="absolute left-0 top-0 h-2 rounded-full bg-accent"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div
          className="mt-6 grid gap-2 text-center text-xs text-secondary"
          style={{ gridTemplateColumns: `repeat(${timelineItems.length}, minmax(0, 1fr))` }}
        >
          {timelineItems.map((item) => {
            if (item.kind === "tech") {
              const techIndex = technicalSteps.indexOf(item.label);
              const isCompleted = techIndex <= currentTechIndex;
              const isActive = techIndex === currentTechIndex;

              return (
                <div key={item.id} className="flex flex-col items-center gap-3">
                  <div className="relative flex h-5 w-5 items-center justify-center">
                    <span
                      className={`h-3 w-3 rounded-full ${
                        isCompleted ? "bg-accent" : "bg-primary/20"
                      }`}
                    />
                    {isActive ? (
                      <motion.span
                        className="absolute h-5 w-5 rounded-full border border-accent"
                        animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0, 0.8] }}
                        transition={{ duration: 1.6, repeat: Infinity }}
                      />
                    ) : null}
                  </div>
                  <span className={isActive ? "font-semibold text-primary" : ""}>
                    {item.label}
                  </span>
                </div>
              );
            }

            const isPending = item.status === "pending";
            const Icon = isPending ? Bell : CheckCircle2;

            return (
              <div key={item.id} className="flex flex-col items-center gap-3">
                <div
                  className={`group relative -mt-5 flex h-9 w-9 items-center justify-center rounded-full shadow-sm ring-1 ${
                    isPending
                      ? "animate-[pulse_3.5s_ease-in-out_infinite] bg-amber-50 text-amber-500 ring-amber-200"
                      : "bg-accent/10 text-accent ring-accent/20"
                  }`}
                  aria-label={item.tooltip}
                  title={item.tooltip}
                >
                  <Icon className="h-4 w-4" />
                  {isPending ? (
                    <span className="pointer-events-none absolute -top-10 whitespace-nowrap rounded-full bg-primary px-3 py-1 text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100">
                      {item.tooltip}
                    </span>
                  ) : null}
                </div>
                <span className={!isPending ? "font-semibold text-primary" : ""}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
