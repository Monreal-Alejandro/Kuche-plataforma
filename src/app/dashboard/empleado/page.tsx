 "use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Plus } from "lucide-react";

import { useEscapeClose } from "@/hooks/useEscapeClose";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { KanbanTablero } from "@/components/KanbanTablero";
import {
  kanbanColumns,
  kanbanStorageKey,
  type KanbanTask,
  type TaskPriority,
  type TaskStage,
} from "@/lib/kanban";

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

const CURRENT_USER = "Valeria";

const TEAM_STORAGE_KEY = "kuche_team_members";
const defaultTeamMembers = [
  { id: "e1", name: "Valeria" },
  { id: "e2", name: "Luis" },
  { id: "e3", name: "Majo" },
  { id: "e4", name: "Carlos" },
];

function loadTeamMembers(): { id: string; name: string }[] {
  if (typeof window === "undefined") return defaultTeamMembers;
  try {
    const stored = window.localStorage.getItem(TEAM_STORAGE_KEY);
    if (!stored) return defaultTeamMembers;
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((m: { id?: string; name?: string }) => ({
        id: String(m?.id ?? `e${Date.now()}`),
        name: String(m?.name ?? "").trim() || "Sin nombre",
      })).filter((m) => m.name !== "Sin nombre");
    }
  } catch {
    // ignore
  }
  return defaultTeamMembers;
}

export default function EmpleadoDashboard() {
  const router = useRouter();
  const [teamMembers, setTeamMembers] = useState<{ id: string; name: string }[]>(defaultTeamMembers);
  const [viewMode, setViewMode] = useState<"all" | "mine">("mine");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isPublicEditorOpen, setIsPublicEditorOpen] = useState(false);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
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
  const [newTaskProject, setNewTaskProject] = useState("");
  const [newTaskStage, setNewTaskStage] = useState<TaskStage>("citas");
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>("media");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskLocation, setNewTaskLocation] = useState("");
  const [newTaskMapsUrl, setNewTaskMapsUrl] = useState("");
  const [taskError, setTaskError] = useState("");

  const publicEditorRef = useRef<HTMLDivElement | null>(null);
  const newTaskModalRef = useRef<HTMLDivElement | null>(null);
  const totalPagado =
    paymentInputs.anticipo + paymentInputs.segundoPago + paymentInputs.liquidacion;
  const restante = Math.max(0, projectBudget - totalPagado);
  
  useEscapeClose(isPublicEditorOpen, () => setIsPublicEditorOpen(false));
  useEscapeClose(isNewTaskModalOpen, () => setIsNewTaskModalOpen(false));
  useFocusTrap(isPublicEditorOpen, publicEditorRef);
  useFocusTrap(isNewTaskModalOpen, newTaskModalRef);

  useEffect(() => {
    setTeamMembers(loadTeamMembers());
  }, []);

  const handleCreateTask = () => {
    const project = newTaskProject.trim();
    if (!project) {
      setTaskError("Escribe el proyecto o cliente.");
      return;
    }
    const now = Date.now();
    const newTask: KanbanTask = {
      id: `task-${now}`,
      title: project,
      stage: newTaskStage,
      status: "pendiente",
      assignedTo: [CURRENT_USER],
      project,
      notes: "",
      files: [],
      priority: newTaskPriority,
      dueDate: newTaskDueDate.trim() || undefined,
      location: newTaskLocation.trim() || undefined,
      mapsUrl: newTaskMapsUrl.trim() || undefined,
      createdAt: now,
      codigoProyecto: `K-${now}`,
    };
    try {
      const stored = window.localStorage.getItem(kanbanStorageKey);
      const current: KanbanTask[] = stored ? JSON.parse(stored) : [];
      const next = Array.isArray(current) ? [...current, newTask] : [newTask];
      window.localStorage.setItem(kanbanStorageKey, JSON.stringify(next));
      setRefreshTrigger((t) => t + 1);
      setIsNewTaskModalOpen(false);
      setNewTaskProject("");
      setNewTaskStage("citas");
      setNewTaskPriority("media");
      setNewTaskDueDate("");
      setNewTaskLocation("");
      setNewTaskMapsUrl("");
      setTaskError("");
    } catch {
      setTaskError("No se pudo guardar la tarea.");
    }
  };

  const openNewTaskModal = () => {
    setNewTaskProject("");
    setNewTaskStage("citas");
    setNewTaskPriority("media");
    setNewTaskDueDate("");
    setNewTaskLocation("");
    setNewTaskMapsUrl("");
    setTaskError("");
    setIsNewTaskModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-secondary">Dashboard Empleado</p>
          <h1 className="mt-2 text-3xl font-semibold">Tablero general</h1>
          <p className="mt-2 text-sm text-secondary">
            Hola {CURRENT_USER}, aquí está tu flujo de trabajo.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-2xl border border-primary/10 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode("mine")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                viewMode === "mine"
                  ? "bg-primary text-white"
                  : "text-secondary hover:bg-primary/5"
              }`}
            >
              Mis tareas
            </button>
            <button
              type="button"
              onClick={() => setViewMode("all")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                viewMode === "all"
                  ? "bg-primary text-white"
                  : "text-secondary hover:bg-primary/5"
              }`}
            >
              Ver todo
            </button>
          </div>
          <button
            type="button"
            onClick={openNewTaskModal}
            className="flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Nueva tarea
          </button>
        </div>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg backdrop-blur-md"
      >
        <KanbanTablero
          filterByEmployee={viewMode === "mine" ? CURRENT_USER : null}
          refreshTrigger={refreshTrigger}
          teamMembers={teamMembers}
          allowDeleteTask={false}
        />
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
          <h3 className="mt-2 text-xl font-semibold">Levantamiento Detallado</h3>
          <p className="mt-3 text-sm text-secondary">
            Crea una estimación rápida para prospectos antes de formalizar.
          </p>
          <button
            onClick={() => router.push("/dashboard/cotizador-preliminar")}
            className="mt-4 rounded-2xl border border-primary/20 bg-white px-4 py-2 text-xs font-semibold text-primary shadow-sm transition hover:border-primary/40"
          >
            Abrir levantamiento
          </button>
        </div>
        <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg backdrop-blur-md">
          <p className="text-xs uppercase tracking-[0.3em] text-secondary">Clientes</p>
          <h3 className="mt-2 text-xl font-semibold">Clientes en proceso</h3>
          <p className="mt-3 text-sm text-secondary">
            Ver tus clientes en proceso y los PDF de cotizaciones.
          </p>
          <button
            onClick={() => router.push("/dashboard/clientes-en-proceso")}
            className="mt-4 rounded-2xl border border-primary/20 bg-white px-4 py-2 text-xs font-semibold text-primary shadow-sm transition hover:border-primary/40"
          >
            Ver clientes
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

      {isNewTaskModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <motion.div
            ref={newTaskModalRef}
            tabIndex={-1}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-lg rounded-3xl border border-white/70 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Nueva tarea</h3>
              <button
                type="button"
                onClick={() => setIsNewTaskModalOpen(false)}
                className="rounded-full border border-primary/10 px-3 py-1 text-xs font-semibold text-secondary"
              >
                Cerrar
              </button>
            </div>
            <p className="mt-2 text-sm text-secondary">
              La tarea será asignada automáticamente a ti ({CURRENT_USER}).
            </p>
            <div className="mt-4 space-y-4">
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                Proyecto / Cliente
                <input
                  value={newTaskProject}
                  onChange={(e) => setNewTaskProject(e.target.value)}
                  placeholder="Ej. Residencial Vega"
                  className="mt-2 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                Etapa
                <select
                  value={newTaskStage}
                  onChange={(e) => setNewTaskStage(e.target.value as TaskStage)}
                  className="mt-2 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                >
                  {kanbanColumns.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                Prioridad
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                  className="mt-2 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                >
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                </select>
              </label>
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                Fecha límite (opcional)
                <input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                Ubicación (opcional)
                <input
                  value={newTaskLocation}
                  onChange={(e) => setNewTaskLocation(e.target.value)}
                  placeholder="Ej. Col. Centro"
                  className="mt-2 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                URL de Maps (opcional)
                <input
                  type="url"
                  value={newTaskMapsUrl}
                  onChange={(e) => setNewTaskMapsUrl(e.target.value)}
                  placeholder="https://maps.google.com/..."
                  className="mt-2 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                />
              </label>
            </div>
            {taskError ? (
              <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-600">
                {taskError}
              </p>
            ) : null}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsNewTaskModalOpen(false)}
                className="rounded-2xl border border-primary/10 bg-white px-5 py-2 text-xs font-semibold text-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateTask}
                className="rounded-2xl bg-primary px-5 py-2 text-xs font-semibold text-white"
              >
                Crear tarea
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </div>
  );
}
