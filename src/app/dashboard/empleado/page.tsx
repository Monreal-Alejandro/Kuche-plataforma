 "use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

import { useEscapeClose } from "@/hooks/useEscapeClose";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { KanbanTablero } from "@/components/KanbanTablero";

const projectBudget = 145000;
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(value);
const installmentAmount = projectBudget / 3;

const publicTimelineSteps = [
  "Diseño Aprobado",
  "Materiales en Taller",
  "Corte CNC",
  "Ensamble",
  "Instalación Final",
];

export default function EmpleadoDashboard() {
  const router = useRouter();
  const [isPublicEditorOpen, setIsPublicEditorOpen] = useState(false);
  const [publicStep, setPublicStep] = useState(publicTimelineSteps[2]);
  const [publicFiles, setPublicFiles] = useState([
    { id: "p1", name: "Render_Actualizado.jpg", type: "jpg" },
    { id: "p2", name: "Plano_Tecnico.pdf", type: "pdf" },
  ]);
  const [newFileName, setNewFileName] = useState("");
  const [newFileType, setNewFileType] = useState("pdf");
  const [paymentInputs, setPaymentInputs] = useState({
    anticipo: 45000,
    segundoPago: 30000,
    liquidacion: 0,
  });
  const publicEditorRef = useRef<HTMLDivElement | null>(null);
  const totalPagado =
    paymentInputs.anticipo + paymentInputs.segundoPago + paymentInputs.liquidacion;
  const restante = Math.max(0, projectBudget - totalPagado);
  useEscapeClose(isPublicEditorOpen, () => setIsPublicEditorOpen(false));
  useFocusTrap(isPublicEditorOpen, publicEditorRef);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-secondary">Dashboard Empleado</p>
        <h1 className="mt-2 text-3xl font-semibold">Tablero general</h1>
        <p className="mt-2 text-sm text-secondary">
          Visibilidad completa del flujo activo y responsables asignados.
        </p>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg backdrop-blur-md"
      >
        <KanbanTablero />
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="grid grid-cols-1 gap-6 md:grid-cols-3"
      >
        <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg backdrop-blur-md">
          <p className="text-xs uppercase tracking-[0.3em] text-secondary">Salud del día</p>
          <h3 className="mt-2 text-xl font-semibold">Ritmo impecable</h3>
          <p className="mt-3 text-sm text-secondary">
            4 tareas completadas, 2 citas próximas y 1 diseño para validar.
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            Todo en orden
          </div>
        </div>
        <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg backdrop-blur-md">
          <p className="text-xs uppercase tracking-[0.3em] text-secondary">Cotización</p>
          <h3 className="mt-2 text-xl font-semibold">Cotizador Pro</h3>
          <p className="mt-3 text-sm text-secondary">
            Genera estimaciones visuales y desglose técnico para taller.
          </p>
          <button
            onClick={() => router.push("/dashboard/cotizador")}
            className="mt-4 rounded-2xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow"
          >
            Abrir cotizador
          </button>
        </div>
        <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg backdrop-blur-md">
          <p className="text-xs uppercase tracking-[0.3em] text-secondary">Cotización</p>
          <h3 className="mt-2 text-xl font-semibold">Cotizador Preliminar</h3>
          <p className="mt-3 text-sm text-secondary">
            Crea una estimación rápida para prospectos antes de formalizar.
          </p>
          <button
            onClick={() => router.push("/dashboard/cotizador-preliminar")}
            className="mt-4 rounded-2xl border border-primary/20 bg-white px-4 py-2 text-xs font-semibold text-primary shadow-sm transition hover:border-primary/40"
          >
            Abrir preliminar
          </button>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg backdrop-blur-md"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-secondary">Detalles de proyecto</p>
            <h3 className="mt-2 text-xl font-semibold">Cliente K-8821 · Residencial</h3>
            <p className="mt-2 text-sm text-secondary">
              Actualiza el estatus público y sube entregables.
            </p>
          </div>
          <button
            onClick={() => setIsPublicEditorOpen(true)}
            className="rounded-2xl bg-primary px-4 py-2 text-xs font-semibold text-white"
          >
            Editar Estatus Público
          </button>
        </div>
      </motion.section>

      <AnimatePresence>
        {isPublicEditorOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          >
            <motion.div
              ref={publicEditorRef}
              tabIndex={-1}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-2xl backdrop-blur-md"
            >
              <div className="max-h-[90vh] overflow-y-auto p-6">
                <h3 className="text-lg font-semibold">Editar estatus público</h3>
                <p className="mt-2 text-sm text-secondary">
                  Cambia el paso actual y agrega nuevos archivos visibles al cliente.
                </p>

                <div className="mt-4">
                  <label className="text-xs font-semibold text-secondary">
                    Paso actual
                    <select
                      value={publicStep}
                      onChange={(event) => setPublicStep(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                    >
                      {publicTimelineSteps.map((step) => (
                        <option key={step} value={step}>
                          {step}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="mt-5 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                    Archivos actuales
                  </p>
                  {publicFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm"
                    >
                      <span>{file.name}</span>
                      <span className="text-xs text-secondary uppercase">{file.type}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-[1fr_140px]">
                  <input
                    value={newFileName}
                    onChange={(event) => setNewFileName(event.target.value)}
                    placeholder="Nombre del archivo"
                    className="rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                  />
                  <select
                    value={newFileType}
                    onChange={(event) => setNewFileType(event.target.value)}
                    className="rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                  >
                    <option value="pdf">PDF</option>
                    <option value="jpg">JPG</option>
                  </select>
                </div>

                <button
                  onClick={() => {
                    if (!newFileName.trim()) return;
                    setPublicFiles((prev) => [
                      ...prev,
                      {
                        id: `p-${Date.now()}`,
                        name: newFileName.trim(),
                        type: newFileType,
                      },
                    ]);
                    setNewFileName("");
                  }}
                  className="mt-3 w-full rounded-2xl border border-primary/10 bg-white py-3 text-xs font-semibold text-secondary"
                >
                  Subir nuevo archivo
                </button>

                <div className="mt-6 rounded-2xl border border-primary/10 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                    Pagos del cliente
                  </p>
                  <p className="mt-2 text-sm text-secondary">
                    Registra cuánto ha pagado el cliente en cada etapa.
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {[
                      { key: "anticipo", label: "Anticipo" },
                      { key: "segundoPago", label: "2do pago" },
                      { key: "liquidacion", label: "Liquidación" },
                    ].map((item) => (
                      <label key={item.key} className="text-xs font-semibold text-secondary">
                        {item.label}
                        <input
                          type="number"
                          min={0}
                          value={paymentInputs[item.key as keyof typeof paymentInputs]}
                          onChange={(event) =>
                            setPaymentInputs((prev) => ({
                              ...prev,
                              [item.key]: Number(event.target.value || 0),
                            }))
                          }
                          className="mt-2 w-full rounded-2xl border border-primary/10 bg-white px-3 py-2 text-sm outline-none"
                        />
                        <span className="mt-2 block text-[11px] font-medium text-secondary">
                          Restante:{" "}
                          {formatCurrency(
                            Math.max(
                              0,
                              installmentAmount -
                                paymentInputs[item.key as keyof typeof paymentInputs],
                            ),
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
                    <span className="rounded-full bg-primary/5 px-3 py-1 text-secondary">
                      Pagado:{" "}
                      <span className="font-semibold text-primary">
                        {formatCurrency(totalPagado)}
                      </span>
                    </span>
                    <span className="rounded-full bg-accent/10 px-3 py-1 text-accent">
                      Restante: {formatCurrency(restante)}
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setIsPublicEditorOpen(false)}
                    className="w-full rounded-2xl border border-primary/10 bg-white py-3 text-xs font-semibold text-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => setIsPublicEditorOpen(false)}
                    className="w-full rounded-2xl bg-accent py-3 text-xs font-semibold text-white"
                  >
                    Guardar cambios
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
