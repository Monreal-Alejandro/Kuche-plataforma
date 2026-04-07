 "use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCircle2, Download, FileText, Image as ImageIcon, Loader2 } from "lucide-react";

import { useEscapeClose } from "@/hooks/useEscapeClose";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import type { CotizacionFormalData, PreliminarData } from "@/lib/kanban";
import { openPreliminarPdfInNewTab, downloadPreliminarPdf, openFormalPdfInNewTab, downloadFormalPdf } from "@/lib/pdf-preliminar";
import { seguimientoApi } from "@/lib/axios";
import { mergeSeguimientoFromStorage } from "@/lib/seguimiento-project";

type SeguimientoArchivo = {
  id: string;
  name: string;
  type: "pdf" | "jpg";
  src: string;
};

type SeguimientoPayment = {
  amount: number;
  date?: string;
  receiptLabel?: string;
  receiptImage?: string;
};

type SeguimientoProject = {
  codigo: string;
  clienteId?: string;
  clienteRef?: string;
  cliente: string;
  isProspect: boolean;
  estadoProyecto: string;
  inversion: number;
  fechaInicio: string;
  fechaEntrega: string;
  garantiaInicio: string;
  cotizacionPreliminarImage: string;
  cotizacionFormalImage: string;
  etapaActual: string;
  pagos: {
    anticipo: SeguimientoPayment;
    segundoPago: SeguimientoPayment;
    liquidacion: SeguimientoPayment;
  };
  archivos: SeguimientoArchivo[];
  preliminarData?: PreliminarData;
  cotizacionFormalData?: CotizacionFormalData;
  preliminarCotizaciones?: PreliminarData[];
  cotizacionesFormales?: CotizacionFormalData[];
};

const baseMockProject: SeguimientoProject = {
  codigo: "K8821A",
  cliente: "Residencial Navarro",
  isProspect: true,
  estadoProyecto: "Completado/Entregado",
  inversion: 145000,
  fechaInicio: "12 Octubre",
  fechaEntrega: "15 Noviembre",
  garantiaInicio: "2026-02-24",
  cotizacionPreliminarImage: "/images/render5.jpg",
  cotizacionFormalImage: "/images/render6.jpg",
  etapaActual: "Corte CNC",
  pagos: {
    anticipo: {
      amount: 45000,
      date: "24/Feb/2026",
      receiptLabel: "Ver Recibo",
      receiptImage: "/images/render1.jpg",
    },
    segundoPago: {
      amount: 30000,
      date: "12/Mar/2026",
      receiptLabel: "Ver Recibo",
      receiptImage: "/images/render2.jpg",
    },
    liquidacion: {
      amount: 0,
      date: "",
      receiptLabel: "Ver Recibo",
      receiptImage: "/images/render3.jpg",
    },
  },
  archivos: [
    { id: "f1", name: "Cotizacion_Preliminar.pdf", type: "pdf", src: "" },
    { id: "f2", name: "Plano_Instalaciones.pdf", type: "pdf", src: "" },
    {
      id: "f3",
      name: "Moodboard_Cocina.jpg",
      type: "jpg",
      src: "/images/render4.jpg",
    },
  ],
};

function getPreliminarListFromProject(p: SeguimientoProject): PreliminarData[] {
  if (p.preliminarCotizaciones && p.preliminarCotizaciones.length > 0) return p.preliminarCotizaciones;
  return p.preliminarData ? [p.preliminarData] : [];
}

function getFormalesListFromProject(p: SeguimientoProject): CotizacionFormalData[] {
  if (p.cotizacionesFormales && p.cotizacionesFormales.length > 0) return p.cotizacionesFormales;
  return p.cotizacionFormalData ? [p.cotizacionFormalData] : [];
}

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

const MAX_FAILED_ATTEMPTS = 5;
const LOGIN_LOCK_MS = 5 * 60 * 1000;

const normalizeTrackingCode = (value: string) =>
  value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6);

const formatPayment = (payment: { amount: number; date?: string }) => {
  const formatted = formatCurrency(payment.amount);
  return payment.date ? `${formatted} - ${payment.date}` : formatted;
};

const GarantiaCountdown = ({ startDate }: { startDate: string }) => {
  const msInDay = 1000 * 60 * 60 * 24;
  const daysLeft = useMemo(() => {
    const start = new Date(startDate);
    const today = new Date();
    const daysPassed = Math.floor((today.getTime() - start.getTime()) / msInDay);
    return Math.max(0, 365 - daysPassed);
  }, [startDate, msInDay]);

  return (
    <div className="rounded-3xl bg-gradient-to-br from-accent/10 via-white to-white p-6 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-secondary">Garantía activa</p>
          <h3 className="mt-2 text-2xl font-semibold text-primary">
            Te quedan {daysLeft} días de cobertura
          </h3>
          <p className="mt-2 text-sm text-secondary">
            Estamos contigo durante el primer año después de la entrega.
          </p>
        </div>
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent text-white shadow-lg">
          <span className="text-xl font-semibold">{daysLeft}</span>
        </div>
      </div>
    </div>
  );
};

export default function SeguimientoPage() {
  const [codigo, setCodigo] = useState("");
  const [hasAccess, setHasAccess] = useState(false);
  const [project, setProject] = useState<SeguimientoProject | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<null | { name: string; src: string }>(
    null,
  );
  const modalRef = useRef<HTMLDivElement | null>(null);

  useEscapeClose(Boolean(selectedImage), () => setSelectedImage(null));
  useFocusTrap(Boolean(selectedImage), modalRef);

  const currentProject = project ?? baseMockProject;
  const isProspect = currentProject.isProspect;
  const currentIndex = useMemo(
    () => Math.max(0, timelineSteps.indexOf(currentProject.etapaActual)),
    [currentProject.etapaActual],
  );
  const totalPagado =
    currentProject.pagos.anticipo.amount +
    currentProject.pagos.segundoPago.amount +
    currentProject.pagos.liquidacion.amount;
  const restante = Math.max(0, currentProject.inversion - totalPagado);
  const infoLockedText = "Esta información se activará una vez apruebes tu proyecto.";
  const filesInSections = isProspect
    ? currentProject.archivos.slice(0, 1)
    : currentProject.archivos;
  const quoteButtonLabel = isProspect ? "Ver cotización preliminar" : "Ver cotización formal";
  const quoteImageSrc = isProspect
    ? currentProject.cotizacionPreliminarImage
    : currentProject.cotizacionFormalImage;

  const lockRemainingSeconds = useMemo(() => {
    if (!lockUntil) return 0;
    return Math.max(0, Math.ceil((lockUntil - Date.now()) / 1000));
  }, [lockUntil]);

  useEffect(() => {
    if (!lockUntil) return;
    if (Date.now() >= lockUntil) {
      setLockUntil(null);
      return;
    }

    const timer = setInterval(() => {
      if (Date.now() >= lockUntil) {
        setLockUntil(null);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [lockUntil]);

  useEffect(() => {
    // Sin dependencia de localStorage: el proyecto base se carga en memoria.
  }, []);

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
                <h1 className="text-2xl font-semibold">Rastrea tu Proyecto Küche</h1>
                <p className="mt-2 text-sm text-secondary">
                  Ingresa tu código único para ver el avance de tu cocina.
                </p>
                <form
                  onSubmit={async (event) => {
                    event.preventDefault();

                    if (lockUntil && Date.now() < lockUntil) {
                      setCodeError(`Acceso bloqueado temporalmente. Intenta de nuevo en ${lockRemainingSeconds}s.`);
                      return;
                    }

                    const normalizedInput = normalizeTrackingCode(codigo);
                    if (normalizedInput.length !== 6) {
                      setCodeError("Ingresa un codigo valido de 6 caracteres.");
                      return;
                    }

                    try {
                      setIsAuthenticating(true);
                      const response = await seguimientoApi.autenticarSeguimientoCliente(normalizedInput);

                      if (!response.success) {
                        throw new Error(response.message || "No encontramos un proyecto con ese codigo.");
                      }

                      const payload = response.data as Record<string, unknown>;
                      const trackingToken =
                        typeof payload.token === "string" && payload.token.trim().length > 0
                          ? payload.token
                          : null;

                      const maybeProject =
                        payload && typeof payload === "object"
                          ? (payload.proyecto ?? payload.project ?? payload)
                          : payload;

                      let backendProject: unknown = maybeProject;
                      if ((!backendProject || typeof backendProject !== "object") && trackingToken) {
                        const projectResponse = await seguimientoApi.obtenerProyectoSeguimiento(
                          trackingToken,
                          normalizedInput,
                        );

                        if (!projectResponse.success) {
                          throw new Error(projectResponse.message || "No se pudo cargar el proyecto de seguimiento.");
                        }

                        const projectPayload = projectResponse.data as Record<string, unknown>;
                        backendProject =
                          projectPayload && typeof projectPayload === "object"
                            ? (projectPayload.proyecto ?? projectPayload.project ?? projectPayload)
                            : projectPayload;
                      }

                      if (!backendProject || typeof backendProject !== "object") {
                        throw new Error("Respuesta de backend invalida para seguimiento.");
                      }

                      const normalizedProject = mergeSeguimientoFromStorage(
                        backendProject as Record<string, unknown>,
                      );

                      const expectedCode = normalizeTrackingCode(
                        normalizedProject.codigo || normalizedProject.clienteId || "",
                      );
                      if (normalizedInput !== expectedCode) {
                        throw new Error("Codigo invalido para este proyecto.");
                      }

                      const archivosFromBackend = Array.isArray(normalizedProject.archivos)
                        ? normalizedProject.archivos
                        : [];

                      const mappedArchivos = archivosFromBackend
                        .map((item, idx) => {
                          if (!item || typeof item !== "object") return null;
                          const raw = item as Record<string, unknown>;
                          const nombre = typeof raw.nombre === "string" ? raw.nombre : `Archivo ${idx + 1}`;
                          const src =
                            typeof raw.src === "string"
                              ? raw.src
                              : typeof raw.url === "string"
                                ? raw.url
                                : "";
                          const tipoRaw =
                            typeof raw.tipo === "string"
                              ? raw.tipo
                              : typeof raw.type === "string"
                                ? raw.type
                                : "otro";

                          const lower = tipoRaw.toLowerCase();
                          const type =
                            lower.includes("pdf")
                              ? "pdf"
                              : lower.includes("jpg") || lower.includes("jpeg") || lower.includes("png") || lower.includes("render")
                                ? "jpg"
                                : "pdf";

                          return {
                            id: typeof raw.id === "string" ? raw.id : `file-${idx}`,
                            name: nombre,
                            type,
                            src,
                          };
                        })
                        .filter((item): item is { id: string; name: string; type: "pdf" | "jpg"; src: string } => Boolean(item));

                      const mergedProject: SeguimientoProject = {
                        ...baseMockProject,
                        codigo: expectedCode,
                        clienteId: normalizedProject.clienteId,
                        clienteRef: normalizedProject.clienteRef,
                        cliente: normalizedProject.cliente,
                        isProspect: normalizedProject.isProspect,
                        inversion: normalizedProject.inversion,
                        fechaInicio: normalizedProject.fechaInicio,
                        fechaEntrega: normalizedProject.fechaEntrega,
                        garantiaInicio: normalizedProject.garantiaInicio,
                        estadoProyecto: normalizedProject.estadoProyecto,
                        etapaActual: normalizedProject.etapaActual,
                        pagos: normalizedProject.pagos,
                        archivos: mappedArchivos.length > 0 ? mappedArchivos : baseMockProject.archivos,
                        cotizacionPreliminarImage:
                          normalizedProject.cotizacionPreliminarImage || baseMockProject.cotizacionPreliminarImage,
                        cotizacionFormalImage:
                          normalizedProject.cotizacionFormalImage || baseMockProject.cotizacionFormalImage,
                      };

                      setProject(mergedProject);
                      setHasAccess(true);
                      setCodeError(null);
                      setFailedAttempts(0);
                      setLockUntil(null);
                    } catch (error) {
                      const nextAttempts = failedAttempts + 1;
                      setFailedAttempts(nextAttempts);
                      const backendMessage =
                        error && typeof error === "object" && "response" in error
                          ? (() => {
                              const response = (error as { response?: { data?: unknown } }).response;
                              if (response && response.data && typeof response.data === "object") {
                                const data = response.data as Record<string, unknown>;
                                return typeof data.message === "string" ? data.message : null;
                              }
                              return null;
                            })()
                          : null;

                      if (nextAttempts >= MAX_FAILED_ATTEMPTS) {
                        const blockedUntil = Date.now() + LOGIN_LOCK_MS;
                        setLockUntil(blockedUntil);
                        setCodeError("Demasiados intentos fallidos. Acceso bloqueado por 5 minutos.");
                      } else {
                        setCodeError(
                          backendMessage ||
                            (error instanceof Error
                              ? error.message
                              : "No pudimos validar el codigo. Intenta de nuevo."),
                        );
                      }
                    } finally {
                      setIsAuthenticating(false);
                    }
                  }}
                >
                  <label className="mt-6 block text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                    Ingresa tu Código de Proyecto
                    <input
                      value={codigo}
                      onChange={(event) => {
                        setCodigo(event.target.value);
                        setCodeError(null);
                      }}
                      placeholder="ABC123"
                      className="mt-3 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                    />
                  </label>
                  {codeError ? (
                    <p className="mt-3 text-xs font-semibold text-red-600">{codeError}</p>
                  ) : null}
                  <button
                    type="submit"
                    disabled={isAuthenticating || (lockUntil !== null && Date.now() < lockUntil)}
                    className="mt-6 w-full rounded-2xl bg-accent py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110"
                  >
                    {isAuthenticating ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Validando codigo...
                      </span>
                    ) : lockUntil !== null && Date.now() < lockUntil ? (
                      `Bloqueado (${lockRemainingSeconds}s)`
                    ) : (
                      "Ver Progreso"
                    )}
                  </button>
                </form>
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
                    Proyecto Residencial {currentProject.cliente}
                  </h1>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#8B1C1C]">
                    Codigo de seguimiento: {currentProject.codigo}
                  </p>
                  {currentProject.clienteId && currentProject.clienteId !== currentProject.codigo ? (
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-secondary">
                      Codigo de cliente: {currentProject.clienteId}
                    </p>
                  ) : null}
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    {
                      label: "Inversión total",
                      value: formatCurrency(currentProject.inversion),
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
                    { label: "Fecha inicio", value: currentProject.fechaInicio },
                    {
                      label: "Entrega estimada",
                      value: currentProject.fechaEntrega,
                      highlight: true,
                    },
                  ].map((item) => {
                    const valueNode = isProspect ? (
                      <span className="mt-3 inline-flex rounded-2xl bg-primary/5 px-3 py-2 text-xs font-semibold text-secondary">
                        {infoLockedText}
                      </span>
                    ) : (
                      item.value
                    );
                    return (
                    <div
                      key={item.label}
                      className={`relative rounded-3xl bg-white p-6 shadow-lg ${
                        item.highlight ? "border border-accent/40" : "border border-white"
                      }`}
                    >
                      <p className="text-xs uppercase tracking-[0.2em] text-secondary">{item.label}</p>
                      {item.label === "Inversión total" ? (
                        (() => {
                          const proj = currentProject as SeguimientoProject;
                          const preliminarList = getPreliminarListFromProject(proj);
                          const formalesList = getFormalesListFromProject(proj);
                          const hasPdfData = isProspect ? preliminarList.length > 0 : formalesList.length > 0;
                          const list = isProspect ? preliminarList : formalesList;
                          const prefix = isProspect ? "cotizacion-preliminar" : "cotizacion-formal";
                          if (hasPdfData && list.length > 0) {
                            return (
                              <div
                                className={
                                  isProspect
                                    ? "mt-4 space-y-2"
                                    : "absolute right-6 top-6 space-y-2"
                                }
                              >
                                {list.map((data, idx) => (
                                  <div key={idx} className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-medium text-secondary">{data.projectType}</span>
                                    <button
                                      type="button"
                                      className={
                                        isProspect
                                          ? "rounded-2xl bg-accent px-3 py-2 text-xs font-semibold text-white shadow-lg transition hover:brightness-110"
                                          : "rounded-full border border-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary transition hover:border-accent hover:text-accent"
                                      }
                                      onClick={() =>
                                        isProspect
                                          ? openPreliminarPdfInNewTab(data)
                                          : openFormalPdfInNewTab(data)
                                      }
                                    >
                                      Ver PDF
                                    </button>
                                    <button
                                      type="button"
                                      className={
                                        isProspect
                                          ? "rounded-2xl border border-accent bg-white px-3 py-2 text-xs font-semibold text-accent transition hover:bg-accent/10"
                                          : "rounded-full border border-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary transition hover:border-accent hover:text-accent"
                                      }
                                      onClick={() => {
                                        const filename = `${prefix}-${(data.projectType || "proyecto").replace(/\s+/g, "-")}-${(currentProject.cliente || "cliente").replace(/\s+/g, "-")}.pdf`;
                                        isProspect
                                          ? downloadPreliminarPdf(data, filename)
                                          : downloadFormalPdf(data, filename);
                                      }}
                                    >
                                      Descargar PDF
                                    </button>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          return (
                            <button
                              className={
                                isProspect
                                  ? "mt-4 w-full rounded-2xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:brightness-110"
                                  : "absolute right-6 top-6 rounded-full border border-primary/10 px-3 py-1 text-[11px] font-semibold text-primary transition hover:border-accent hover:text-accent"
                              }
                              onClick={() => {
                                setSelectedImage({
                                  name: quoteButtonLabel,
                                  src: quoteImageSrc,
                                });
                              }}
                            >
                              {quoteButtonLabel}
                            </button>
                          );
                        })()
                      ) : null}
                      {isProspect ? (
                        valueNode
                      ) : (
                        <p
                          className={`mt-3 text-xl font-semibold ${
                            item.highlight ? "text-accent" : "text-primary"
                          }`}
                        >
                          {valueNode}
                        </p>
                      )}
                      {!isProspect && "extra" in item ? item.extra : null}
                    </div>
                    );
                  })}
                </div>
                {!isProspect ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {installments.map((item) => {
                      const payment = currentProject.pagos[item.key];
                      return (
                        <div
                          key={item.key}
                          className="rounded-2xl border border-primary/10 bg-white p-4 text-xs text-secondary"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-secondary">
                              {item.label}
                            </p>
                            <button
                              className="rounded-full border border-primary/10 px-3 py-1 text-[10px] font-semibold text-primary transition hover:border-accent hover:text-accent"
                              onClick={() => {
                                if (typeof payment.receiptImage === "string" && payment.receiptImage.trim().length > 0) {
                                  setSelectedImage({
                                    name: `${item.label} - Recibo`,
                                    src: payment.receiptImage,
                                  });
                                }
                              }}
                            >
                              {payment.receiptLabel ?? "Ver Recibo"}
                            </button>
                          </div>
                          <p className="mt-2 text-sm font-semibold text-primary">
                            {formatPayment(payment)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-primary/10 bg-white p-4 text-xs text-secondary">
                    Los pagos se activarán una vez apruebes el inicio de tu proyecto.
                  </div>
                )}
                <div className="mt-6 rounded-3xl border border-primary/10 bg-white p-6">
                  <p className="text-xs uppercase tracking-[0.3em] text-secondary">Archivos</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {filesInSections.map((file) => (
                      <button
                        key={file.id}
                        className="inline-flex items-center gap-2 rounded-full border border-primary/10 px-4 py-2 text-xs font-semibold text-primary transition hover:border-accent hover:text-accent"
                        onClick={() => {
                          if (file.type === "jpg" && "src" in file) {
                            setSelectedImage({
                              name: file.name,
                              src: file.src,
                            });
                          }
                        }}
                      >
                        {file.type === "pdf" ? (
                          <FileText className="h-4 w-4" />
                        ) : (
                          <ImageIcon className="h-4 w-4" />
                        )}
                        {file.name}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <section
                className={`rounded-3xl bg-white p-8 shadow-lg ${
                  isProspect ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-secondary">Timeline</p>
                    <h2 className="mt-2 text-2xl font-semibold">Progreso de tu cocina</h2>
                  </div>
                  <span className="rounded-full bg-accent/10 px-4 py-2 text-xs font-semibold text-accent">
                    {currentProject.etapaActual}
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
              {isProspect ? (
                <div className="rounded-2xl border border-primary/10 bg-white p-4 text-xs text-secondary">
                  El seguimiento se activará cuando apruebes el inicio de tu proyecto.
                </div>
              ) : null}

              {isProspect ? (
                <div className="rounded-2xl border border-primary/10 bg-white p-4 text-xs text-secondary">
                  La garantía se activará una vez completemos tu proyecto.
                </div>
              ) : currentProject.estadoProyecto === "Completado/Entregado" ? (
                <section>
                  <GarantiaCountdown startDate={currentProject.garantiaInicio} />
                </section>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {selectedImage ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            ref={modalRef}
            tabIndex={-1}
            className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-primary">{selectedImage.name}</h3>
              <button
                className="rounded-full border border-primary/10 px-3 py-1 text-xs font-semibold text-primary transition hover:border-accent hover:text-accent"
                onClick={() => setSelectedImage(null)}
              >
                Cerrar
              </button>
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl bg-primary/5">
              <img
                src={selectedImage.src}
                alt={selectedImage.name}
                className="h-full w-full object-contain"
              />
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

