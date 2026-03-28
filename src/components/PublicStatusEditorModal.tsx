"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useEscapeClose } from "@/hooks/useEscapeClose";
import { seguimientoProjectStoragePrefix } from "@/lib/kanban";
import {
  mergePagosPreservingReceipts,
  mergeSeguimientoFromStorage,
  TIMELINE_STEPS,
  type SeguimientoClienteProject,
  type SeguimientoPagos,
  type TimelineStep,
} from "@/lib/seguimiento-project";

export type PublicStatusEditorRole = "admin" | "employee";

type ArchivoSeg = {
  id: string;
  name: string;
  type: string;
  src?: string;
  indexedPdfKey?: string;
};

/** Contenedor visible para `<input type="file">` oculto (hover claro; el nativo casi no se estiliza). */
const filePickButtonClass =
  "flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-primary/30 bg-white px-4 py-3 text-xs font-semibold text-secondary transition hover:border-primary/50 hover:bg-primary/[0.06] hover:text-primary";

const digitsOnly = (raw: string) => raw.replace(/\D/g, "");

function parseMoneyInput(raw: string): number {
  if (raw.trim() === "") return 0;
  const n = Number.parseInt(raw.replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function toInputDate(isoLike: string): string {
  const t = Date.parse(isoLike);
  if (Number.isNaN(t)) return "";
  const d = new Date(t);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function mergePagosForRole(
  base: SeguimientoPagos,
  draft: SeguimientoPagos,
  isAdmin: boolean,
): SeguimientoPagos {
  if (isAdmin) return draft;
  return {
    anticipo: {
      ...base.anticipo,
      date: draft.anticipo.date,
      receiptImage: draft.anticipo.receiptImage,
      receiptLabel: draft.anticipo.receiptLabel ?? base.anticipo.receiptLabel,
    },
    segundoPago: {
      ...base.segundoPago,
      date: draft.segundoPago.date,
      receiptImage: draft.segundoPago.receiptImage,
      receiptLabel: draft.segundoPago.receiptLabel ?? base.segundoPago.receiptLabel,
    },
    liquidacion: {
      ...base.liquidacion,
      date: draft.liquidacion.date,
      receiptImage: draft.liquidacion.receiptImage,
      receiptLabel: draft.liquidacion.receiptLabel ?? base.liquidacion.receiptLabel,
    },
  };
}

export type PublicStatusEditorModalProps = {
  open: boolean;
  onClose: () => void;
  role: PublicStatusEditorRole;
  /** Código K-XXXX del proyecto (debe existir en localStorage). */
  codigoProyecto: string;
  /** Texto del encabezado, ej. nombre del cliente o proyecto. */
  subtitle: string;
  onSaved?: () => void;
};

export function PublicStatusEditorModal({
  open,
  onClose,
  role,
  codigoProyecto,
  subtitle,
  onSaved,
}: PublicStatusEditorModalProps) {
  const isAdmin = role === "admin";
  const modalRef = useRef<HTMLDivElement | null>(null);
  /** Data URLs enormes en `draft` bloquean React/Chrome (modal “en blanco”). Se guardan fuera del estado. */
  const baselineReceiptsRef = useRef<Record<keyof SeguimientoPagos, string>>({
    anticipo: "",
    segundoPago: "",
    liquidacion: "",
  });
  const pendingReceiptsRef = useRef<Partial<Record<keyof SeguimientoPagos, string>>>({});
  const [receiptTick, setReceiptTick] = useState(0);
  const [draft, setDraft] = useState<SeguimientoClienteProject | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState("");
  const [newFileType, setNewFileType] = useState("pdf");
  const [newFileSrc, setNewFileSrc] = useState<string | undefined>(undefined);
  const [mounted, setMounted] = useState(false);
  /** Texto en inputs de dinero: permite vacío mientras escribes (evita el 0 “pegado” de type=number). */
  const [inversionText, setInversionText] = useState("");
  const [pagoAmountText, setPagoAmountText] = useState({
    anticipo: "",
    segundoPago: "",
    liquidacion: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEscapeClose(open, onClose);
  /** Sin focus trap aquí: Chrome + selector de archivos del SO deja la animación de Framer en opacity:0
   *  o el foco en un input sr-only y el panel parece “vacío” sin poder salir. Escape y Cerrar siguen disponibles. */

  const projectKey = `${seguimientoProjectStoragePrefix}${codigoProyecto}`;

  const reload = useCallback(() => {
    if (typeof window === "undefined" || !codigoProyecto.trim()) {
      setDraft(null);
      setLoadError("Código de proyecto inválido.");
      return;
    }
    try {
      const raw = window.localStorage.getItem(projectKey);
      if (!raw) {
        setDraft(null);
        setLoadError(
          "No hay datos de seguimiento guardados para este código. Debe existir un proyecto con cotización o levantamiento previo.",
        );
        return;
      }
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const merged = mergeSeguimientoFromStorage(parsed);
      const p = merged.pagos;
      baselineReceiptsRef.current = {
        anticipo: p.anticipo.receiptImage ?? "",
        segundoPago: p.segundoPago.receiptImage ?? "",
        liquidacion: p.liquidacion.receiptImage ?? "",
      };
      pendingReceiptsRef.current = {};
      setReceiptTick((t) => t + 1);
      setDraft({
        ...merged,
        pagos: {
          anticipo: { ...p.anticipo, receiptImage: "" },
          segundoPago: { ...p.segundoPago, receiptImage: "" },
          liquidacion: { ...p.liquidacion, receiptImage: "" },
        },
      });
      setInversionText(merged.inversion === 0 ? "" : String(merged.inversion));
      setPagoAmountText({
        anticipo: p.anticipo.amount === 0 ? "" : String(p.anticipo.amount),
        segundoPago: p.segundoPago.amount === 0 ? "" : String(p.segundoPago.amount),
        liquidacion: p.liquidacion.amount === 0 ? "" : String(p.liquidacion.amount),
      });
      setLoadError(null);
    } catch {
      setDraft(null);
      setLoadError("No se pudo leer el proyecto.");
    }
  }, [projectKey, codigoProyecto]);

  useEffect(() => {
    if (open) reload();
  }, [open, reload]);

  const totalPagado = useMemo(() => {
    if (!draft) return 0;
    const p = draft.pagos;
    return p.anticipo.amount + p.segundoPago.amount + p.liquidacion.amount;
  }, [draft]);

  const restante = useMemo(() => Math.max(0, (draft?.inversion ?? 0) - totalPagado), [draft, totalPagado]);

  /** Combina montos/fechas del borrador con comprobantes en refs (nunca megabytes en estado React). */
  const effectivePagosFor = useCallback((d: SeguimientoClienteProject): SeguimientoPagos => {
    const keys: (keyof SeguimientoPagos)[] = ["anticipo", "segundoPago", "liquidacion"];
    const next: SeguimientoPagos = { ...d.pagos };
    for (const k of keys) {
      const ri =
        pendingReceiptsRef.current[k] ??
        baselineReceiptsRef.current[k] ??
        d.pagos[k].receiptImage ??
        "";
      next[k] = { ...d.pagos[k], receiptImage: ri };
    }
    return next;
  }, []);

  const updatePago = (key: keyof SeguimientoPagos, patch: Partial<SeguimientoPagos[keyof SeguimientoPagos]>) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        pagos: {
          ...prev.pagos,
          [key]: { ...prev.pagos[key], ...patch },
        },
      };
    });
  };

  const handleSave = () => {
    if (typeof window === "undefined" || !draft) return;
    try {
      const prevRaw = window.localStorage.getItem(projectKey);
      const baseParsed = prevRaw
        ? (JSON.parse(prevRaw) as Record<string, unknown>)
        : ({} as Record<string, unknown>);
      const baseMerged = mergeSeguimientoFromStorage(baseParsed);

      const draftForSave: SeguimientoClienteProject =
        isAdmin
          ? {
              ...draft,
              inversion: parseMoneyInput(inversionText),
              pagos: {
                anticipo: {
                  ...draft.pagos.anticipo,
                  amount: parseMoneyInput(pagoAmountText.anticipo),
                },
                segundoPago: {
                  ...draft.pagos.segundoPago,
                  amount: parseMoneyInput(pagoAmountText.segundoPago),
                },
                liquidacion: {
                  ...draft.pagos.liquidacion,
                  amount: parseMoneyInput(pagoAmountText.liquidacion),
                },
              },
            }
          : draft;

      const pagosMerged = mergePagosForRole(
        baseMerged.pagos,
        effectivePagosFor(draftForSave),
        isAdmin,
      );

      const next: Record<string, unknown> = {
        ...baseMerged,
        ...draftForSave,
        codigo: draftForSave.codigo,
        cliente: draftForSave.cliente,
        etapaActual: draftForSave.etapaActual as TimelineStep,
        archivos: draftForSave.archivos,
        pagos: pagosMerged,
      };

      if (!isAdmin) {
        next.estadoProyecto = baseMerged.estadoProyecto;
        next.garantiaInicio = baseMerged.garantiaInicio;
        next.inversion = baseMerged.inversion;
      }

      window.localStorage.setItem(projectKey, JSON.stringify(next));
      onSaved?.();
      onClose();
    } catch {
      setLoadError("No se pudo guardar. Intenta de nuevo.");
    }
  };

  const addArchivo = () => {
    if (!draft) return;
    const trimmed = newFileName.trim();
    const defaultName = newFileType === "jpg" ? "Imagen.jpg" : "Documento.pdf";
    const name = trimmed || defaultName;
    const item: ArchivoSeg = {
      id: `seg-${Date.now()}`,
      name,
      type: newFileType,
      ...(newFileSrc ? { src: newFileSrc } : {}),
    };
    setDraft((prev) =>
      prev
        ? { ...prev, archivos: [...(prev.archivos as ArchivoSeg[]), item] }
        : prev,
    );
    setNewFileName("");
    setNewFileSrc(undefined);
  };

  const removeArchivo = (id: string) => {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            archivos: (prev.archivos as ArchivoSeg[]).filter((a) => a.id !== id),
          }
        : prev,
    );
  };

  if (!open || !mounted || typeof document === "undefined") return null;

  const modalTree = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4"
      style={{ isolation: "isolate" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="public-status-editor-title"
        className="max-h-[min(90vh,720px)] w-full max-w-lg overflow-y-auto rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl"
        style={{ color: "#111827" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 id="public-status-editor-title" className="text-lg font-semibold text-gray-900">
            Editar estatus público
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full border border-gray-300 px-3 py-1 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
          <p className="mt-1 text-sm font-medium text-gray-800">{subtitle}</p>
          <p className="mt-2 text-sm text-gray-600">
            Código: <span className="font-mono font-semibold">{codigoProyecto}</span>
            {!isAdmin ? (
              <span className="ml-2 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-800">
                Empleado: montos y garantía solo admin
              </span>
            ) : null}
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Cambia el paso del timeline y los datos que ve el cliente en /seguimiento.
          </p>

          {loadError ? (
            <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              {loadError}
            </p>
          ) : null}

          {draft && !loadError ? (
            <>
              <div className="mt-4">
                <label className="text-xs font-semibold text-secondary">
                  Paso actual (timeline)
                  <select
                    value={draft.etapaActual}
                    onChange={(e) =>
                      setDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              etapaActual: e.target.value as TimelineStep,
                            }
                          : prev,
                      )
                    }
                    className="mt-2 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                  >
                    {TIMELINE_STEPS.map((step) => (
                      <option key={step} value={step}>
                        {step}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {isAdmin ? (
                <>
                  <div className="mt-4">
                    <label className="text-xs font-semibold text-secondary">
                      Inversión total (MXN)
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        value={inversionText}
                        onChange={(e) => setInversionText(digitsOnly(e.target.value))}
                        onBlur={() => {
                          const n = parseMoneyInput(inversionText);
                          setInversionText(n === 0 ? "" : String(n));
                          setDraft((prev) => {
                            if (!prev) return prev;
                            const mergedPagos = mergePagosPreservingReceipts(effectivePagosFor(prev), n);
                            const nextPagos = {
                              anticipo: { ...mergedPagos.anticipo, receiptImage: "" },
                              segundoPago: { ...mergedPagos.segundoPago, receiptImage: "" },
                              liquidacion: { ...mergedPagos.liquidacion, receiptImage: "" },
                            };
                            requestAnimationFrame(() => {
                              setPagoAmountText({
                                anticipo:
                                  mergedPagos.anticipo.amount === 0
                                    ? ""
                                    : String(mergedPagos.anticipo.amount),
                                segundoPago:
                                  mergedPagos.segundoPago.amount === 0
                                    ? ""
                                    : String(mergedPagos.segundoPago.amount),
                                liquidacion:
                                  mergedPagos.liquidacion.amount === 0
                                    ? ""
                                    : String(mergedPagos.liquidacion.amount),
                              });
                            });
                            return { ...prev, inversion: n, pagos: nextPagos };
                          });
                        }}
                        className="mt-2 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                      />
                    </label>
                    <p className="mt-1 text-[11px] text-secondary">
                      Viene del cotizador; aquí puedes ajustarla y se redistribuyen las parcialidades
                      conservando fechas y comprobantes ya capturados.
                    </p>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="text-xs font-semibold text-secondary">
                      Estado del proyecto
                      <select
                        value={draft.estadoProyecto}
                        onChange={(e) => {
                          const v = e.target.value;
                          setDraft((prev) => {
                            if (!prev) return prev;
                            const next = { ...prev, estadoProyecto: v };
                            if (
                              v === "Completado/Entregado" &&
                              !String(prev.garantiaInicio ?? "").trim()
                            ) {
                              next.garantiaInicio = new Date().toISOString().slice(0, 10);
                            }
                            return next;
                          });
                        }}
                        className="mt-2 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                      >
                        <option value="En proceso">En proceso</option>
                        <option value="Prospecto">Prospecto</option>
                        <option value="Completado/Entregado">Completado/Entregado</option>
                      </select>
                    </label>
                    <label className="text-xs font-semibold text-secondary">
                      Inicio de garantía (entrega)
                      <input
                        type="date"
                        value={toInputDate(draft.garantiaInicio)}
                        onChange={(e) =>
                          setDraft((prev) =>
                            prev ? { ...prev, garantiaInicio: e.target.value || "" } : prev,
                          )
                        }
                        className="mt-2 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                      />
                      <p className="mt-1 text-[10px] text-gray-500">
                        Si pasas a «Completado/Entregado» sin fecha, se usa hoy; ajústala si hace falta.
                      </p>
                    </label>
                  </div>
                </>
              ) : null}

              <div className="mt-5 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                  Archivos visibles al cliente
                </p>
                {(draft.archivos as ArchivoSeg[]).length === 0 ? (
                  <p className="text-sm text-secondary">Sin archivos aún.</p>
                ) : (
                  (draft.archivos as ArchivoSeg[]).map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between gap-2 rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm"
                    >
                      <span className="truncate">{file.name}</span>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-xs uppercase text-secondary">{file.type}</span>
                        <button
                          type="button"
                          onClick={() => removeArchivo(file.id)}
                          className="text-xs font-semibold text-rose-600 hover:underline"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-[1fr_100px]">
                <input
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="Nombre del archivo"
                  className="rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                />
                <select
                  value={newFileType}
                  onChange={(e) => {
                    setNewFileType(e.target.value);
                    setNewFileSrc(undefined);
                  }}
                  className="rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                >
                  <option value="pdf">PDF</option>
                  <option value="jpg">JPG</option>
                </select>
              </div>
              <label className="mt-2 block cursor-pointer text-xs text-gray-600">
                <span className="mb-1 block font-semibold">
                  {newFileType === "pdf" ? "Archivo PDF" : "Imagen JPG"}
                </span>
                <span className={filePickButtonClass}>
                  <input
                    type="file"
                    accept={newFileType === "pdf" ? "application/pdf,.pdf" : "image/*"}
                    tabIndex={-1}
                    className="sr-only"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) {
                        setNewFileSrc(undefined);
                        e.target.value = "";
                        return;
                      }
                      try {
                        setNewFileSrc(await readFileAsDataUrl(f));
                        setNewFileName((prev) => (prev.trim() ? prev : f.name));
                      } catch {
                        setNewFileSrc(undefined);
                      } finally {
                        e.target.value = "";
                      }
                    }}
                  />
                  Elegir archivo en tu equipo
                </span>
              </label>
              <button
                type="button"
                onClick={addArchivo}
                className="mt-3 w-full rounded-2xl border border-primary/10 bg-white py-3 text-xs font-semibold text-secondary transition hover:border-primary/25 hover:bg-primary/[0.04]"
              >
                Añadir a la lista
              </button>
              <p className="mt-2 text-[11px] text-gray-500">
                Puedes solo poner un nombre y añadir (enlace simbólico) o elegir un archivo para que el
                cliente pueda abrirlo en /seguimiento.
              </p>

              <div
                className="mt-6 rounded-2xl border border-primary/10 bg-white p-4"
                data-receipt-version={receiptTick}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                  Pagos del cliente
                </p>
                <p className="mt-2 text-sm text-secondary">
                  {isAdmin
                    ? "Montos, fechas y comprobante por parcialidad."
                    : "Fechas y foto/PDF de recibo. Los montos los ajusta administración."}
                </p>
                <div className="mt-4 space-y-4">
                  {(
                    [
                      { key: "anticipo" as const, label: "Anticipo" },
                      { key: "segundoPago" as const, label: "2do pago" },
                      { key: "liquidacion" as const, label: "Liquidación" },
                    ] as const
                  ).map((item) => (
                    <div
                      key={item.key}
                      className="rounded-xl border border-primary/5 bg-primary/[0.02] p-3"
                    >
                      <p className="text-xs font-semibold text-primary">{item.label}</p>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        <label className="text-[11px] font-semibold text-secondary">
                          Monto
                          <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="off"
                            disabled={!isAdmin}
                            value={pagoAmountText[item.key]}
                            onChange={(e) => {
                              if (!isAdmin) return;
                              setPagoAmountText((prev) => ({
                                ...prev,
                                [item.key]: digitsOnly(e.target.value),
                              }));
                            }}
                            onBlur={() => {
                              if (!isAdmin) return;
                              const n = parseMoneyInput(pagoAmountText[item.key]);
                              setPagoAmountText((prev) => ({
                                ...prev,
                                [item.key]: n === 0 ? "" : String(n),
                              }));
                              updatePago(item.key, { amount: n });
                            }}
                            className="mt-1 w-full rounded-xl border border-primary/10 bg-white px-3 py-2 text-sm outline-none disabled:bg-gray-100"
                          />
                        </label>
                        <label className="text-[11px] font-semibold text-secondary">
                          Fecha de pago
                          <input
                            type="text"
                            placeholder="Ej. 12/mar/2026"
                            value={draft.pagos[item.key].date ?? ""}
                            onChange={(e) => updatePago(item.key, { date: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-primary/10 bg-white px-3 py-2 text-sm outline-none"
                          />
                        </label>
                      </div>
                      <label className="mt-2 block cursor-pointer text-[11px] font-semibold text-secondary">
                        <span className="mb-1 block">Comprobante (foto o PDF)</span>
                        <span className={filePickButtonClass}>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            tabIndex={-1}
                            className="sr-only"
                            onChange={(e) => {
                              const input = e.target;
                              const f = input.files?.[0];
                              if (!f) {
                                input.value = "";
                                return;
                              }
                              void (async () => {
                                try {
                                  const dataUrl = await readFileAsDataUrl(f);
                                  pendingReceiptsRef.current[item.key] = dataUrl;
                                  setReceiptTick((t) => t + 1);
                                } catch {
                                  /* ignore */
                                } finally {
                                  input.value = "";
                                }
                              })();
                            }}
                          />
                          Elegir archivo
                        </span>
                      </label>
                      {(() => {
                        const src =
                          pendingReceiptsRef.current[item.key] ??
                          baselineReceiptsRef.current[item.key] ??
                          "";
                        return src.length > 2 ? (
                          <p className="mt-1 text-[10px] text-emerald-700">Comprobante cargado.</p>
                        ) : null;
                      })()}
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
                  <span className="rounded-full bg-primary/5 px-3 py-1 text-secondary">
                    Inversión:{" "}
                    <span className="font-semibold text-primary">
                      {formatCurrency(draft.inversion)}
                    </span>
                  </span>
                  <span className="rounded-full bg-primary/5 px-3 py-1 text-secondary">
                    Suma pagos:{" "}
                    <span className="font-semibold text-primary">{formatCurrency(totalPagado)}</span>
                  </span>
                  <span className="rounded-full bg-accent/10 px-3 py-1 text-accent">
                    Restante: {formatCurrency(restante)}
                  </span>
                </div>
              </div>
            </>
          ) : null}

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-2xl border border-primary/10 bg-white py-3 text-xs font-semibold text-secondary"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!draft || Boolean(loadError)}
              onClick={handleSave}
              className="w-full rounded-2xl bg-accent py-3 text-xs font-semibold text-white disabled:opacity-50"
            >
              Guardar cambios
            </button>
          </div>
      </div>
    </div>
  );

  return createPortal(modalTree, document.body);
}
