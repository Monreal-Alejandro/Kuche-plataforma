"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCircle2, Download, FileText, Image as ImageIcon } from "lucide-react";

const mockProject = {
  codigo: "K-8821",
  cliente: "Residencial Navarro",
  inversion: 145000,
  fechaInicio: "12 Octubre",
  fechaEntrega: "15 Noviembre",
  etapaActual: "Corte CNC",
  pagos: {
    anticipo: 45000,
    segundoPago: 30000,
    liquidacion: 0,
  },
  archivos: [
    { id: "f1", name: "Render_Final_V2.jpg", type: "jpg" },
    { id: "f2", name: "Plano_Instalaciones.pdf", type: "pdf" },
    { id: "f3", name: "Moodboard_Cocina.jpg", type: "jpg" },
  ],
};

const timelineSteps = [
  "Diseño Aprobado",
  "Materiales en Taller",
  "Corte CNC",
  "Ensamble",
  "Instalación Final",
];

const paymentAlerts = [
  {
    step: "Diseño Aprobado",
    label: "Anticipo",
    status: "paid" as const,
    tooltip: "Pago recibido. Gracias por impulsar tu proyecto.",
  },
  {
    step: "Corte CNC",
    label: "2do Pago",
    status: "pending" as const,
    tooltip: "Recordatorio: 2do pago pendiente. Tu proyecto sigue avanzando.",
  },
  {
    step: "Instalación Final",
    label: "Liquidación",
    status: "pending" as const,
    tooltip: "Recordatorio: liquidación pendiente. Tu proyecto sigue avanzando.",
  },
];

const paymentByStep = paymentAlerts.reduce<Record<string, (typeof paymentAlerts)[number]>>(
  (acc, alert) => {
    acc[alert.step] = alert;
    return acc;
  },
  {},
);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);

const installments = [
  { key: "anticipo", label: "Anticipo" },
  { key: "segundoPago", label: "2do pago" },
  { key: "liquidacion", label: "Liquidación" },
] as const;

export default function SeguimientoPage() {
  const [codigo, setCodigo] = useState("");
  const [hasAccess, setHasAccess] = useState(false);

  const currentIndex = useMemo(
    () => Math.max(0, timelineSteps.indexOf(mockProject.etapaActual)),
    [],
  );
  const installmentAmount = mockProject.inversion / 3;
  const totalPagado =
    mockProject.pagos.anticipo +
    mockProject.pagos.segundoPago +
    mockProject.pagos.liquidacion;
  const restante = Math.max(0, mockProject.inversion - totalPagado);

  return (
    <main className="min-h-screen bg-background text-primary">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <AnimatePresence mode="wait">
          {!hasAccess ? (
            <motion.div
              key="access"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
              className="flex min-h-[70vh] items-center justify-center"
            >
              <div className="w-full max-w-lg rounded-3xl bg-white p-10 shadow-xl">
                <h1 className="text-2xl font-semibold">Rastrea tu Proyecto KUCHE</h1>
                <p className="mt-2 text-sm text-secondary">
                  Ingresa tu código único para ver el avance de tu cocina.
                </p>
                <label className="mt-6 block text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                  Ingresa tu Código de Proyecto
                  <input
                    value={codigo}
                    onChange={(event) => setCodigo(event.target.value)}
                    placeholder="K-8821"
                    className="mt-3 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                  />
                </label>
                <button
                  onClick={() => setHasAccess(true)}
                  className="mt-6 w-full rounded-2xl bg-accent py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110"
                >
                  Ver Progreso
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
              className="space-y-10"
            >
              <section className="space-y-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-secondary">Seguimiento</p>
                  <h1 className="mt-2 text-3xl font-semibold">
                    Proyecto Residencial {mockProject.cliente}
                  </h1>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    {
                      label: "Inversión total",
                      value: formatCurrency(mockProject.inversion),
                      extra: (
                        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-secondary">
                          <span className="rounded-full bg-primary/5 px-3 py-1">
                            Pagado{" "}
                            <span className="font-semibold text-primary">
                              {formatCurrency(totalPagado)}
                            </span>
                          </span>
                          <span className="rounded-full bg-accent/10 px-3 py-1 text-accent">
                            Restante {formatCurrency(restante)}
                          </span>
                        </div>
                      ),
                    },
                    { label: "Fecha inicio", value: mockProject.fechaInicio },
                    { label: "Entrega estimada", value: mockProject.fechaEntrega, highlight: true },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`rounded-3xl bg-white p-6 shadow-lg ${
                        item.highlight ? "border border-accent/40" : "border border-white"
                      }`}
                    >
                      <p className="text-xs uppercase tracking-[0.2em] text-secondary">{item.label}</p>
                      <p
                        className={`mt-3 text-xl font-semibold ${
                          item.highlight ? "text-accent" : "text-primary"
                        }`}
                      >
                        {item.value}
                      </p>
                      {"extra" in item ? item.extra : null}
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {installments.map((item) => {
                    const paid = mockProject.pagos[item.key];
                    return (
                      <div
                        key={item.key}
                        className="rounded-2xl border border-primary/10 bg-white p-4 text-xs text-secondary"
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-secondary">
                          {item.label}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-primary">
                          {formatCurrency(paid)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-3xl bg-white p-8 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-secondary">Timeline</p>
                    <h2 className="mt-2 text-2xl font-semibold">Progreso de tu cocina</h2>
                  </div>
                  <span className="rounded-full bg-accent/10 px-4 py-2 text-xs font-semibold text-accent">
                    {mockProject.etapaActual}
                  </span>
                </div>
                <div className="mt-8">
                  <div className="relative h-2 rounded-full bg-primary/10">
                    <div
                      className="absolute left-0 top-0 h-2 rounded-full bg-accent"
                      style={{ width: `${(currentIndex / (timelineSteps.length - 1)) * 100}%` }}
                    />
                  </div>
                  <div className="mt-6 grid grid-cols-5 gap-2 text-center text-xs text-secondary">
                    {timelineSteps.map((step, index) => {
                      const isCompleted = index <= currentIndex;
                      const isActive = index === currentIndex;
                      const payment = paymentByStep[step];
                      return (
                        <div key={step} className="flex flex-col items-center gap-3">
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
                          <span className={isActive ? "font-semibold text-primary" : ""}>{step}</span>
                          {payment ? (
                            <div
                              className={`group relative mt-1 flex items-center gap-2 rounded-full px-2 py-1 text-[10px] font-semibold ${
                                payment.status === "pending"
                                  ? "animate-[pulse_3.5s_ease-in-out_infinite] bg-amber-50 text-amber-500"
                                  : "bg-accent/10 text-accent"
                              }`}
                              aria-label={payment.tooltip}
                              title={payment.tooltip}
                            >
                              {payment.status === "pending" ? (
                                <Bell className="h-3.5 w-3.5" />
                              ) : (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              )}
                              <span>{payment.label}</span>
                              {payment.status === "pending" ? (
                                <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-3 py-1 text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100">
                                  {payment.tooltip}
                                </span>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-secondary">
                    Tu carpeta digital
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold">Bóveda de archivos</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {mockProject.archivos.map((file) => (
                    <div
                      key={file.id}
                      className="group rounded-3xl bg-white p-6 shadow-lg transition duration-300 hover:-translate-y-2"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/5 text-accent">
                        {file.type === "pdf" ? (
                          <FileText className="h-6 w-6" />
                        ) : (
                          <ImageIcon className="h-6 w-6" />
                        )}
                      </div>
                      <p className="mt-4 text-sm font-semibold">{file.name}</p>
                      <button className="mt-4 text-xs font-semibold text-secondary underline-offset-4 transition hover:text-accent">
                        Descargar
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
