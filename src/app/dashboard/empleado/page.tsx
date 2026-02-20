"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileUp,
  LayoutGrid,
} from "lucide-react";

import {
  kanbanColumns,
  kanbanStorageKey,
  initialKanbanTasks,
  type KanbanTask,
  type TaskType,
  type TaskStatus,
} from "@/lib/kanban";

const tabs: { id: TaskType; label: string; icon: React.ReactNode }[] = [
  { id: "todo", label: "Todo", icon: <LayoutGrid className="h-4 w-4" /> },
  { id: "cita", label: "Citas", icon: <Calendar className="h-4 w-4" /> },
  { id: "diseño", label: "Diseños", icon: <FileUp className="h-4 w-4" /> },
];

const publicTimelineSteps = [
  "Diseño Aprobado",
  "Materiales en Taller",
  "Corte CNC",
  "Ensamble",
  "Instalación Final",
];

const projectBudget = 145000;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);

const installmentAmount = projectBudget / 3;

export default function EmpleadoDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TaskType>("todo");
  const [uploadTask, setUploadTask] = useState<string | null>(null);
  const [isPublicEditorOpen, setIsPublicEditorOpen] = useState(false);
  const [kanbanTasks, setKanbanTasks] = useState<KanbanTask[]>(initialKanbanTasks);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<TaskStatus | null>(null);
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(kanbanStorageKey);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as KanbanTask[];
      if (Array.isArray(parsed) && parsed.length) {
        setKanbanTasks(
          parsed.map((task) => ({
            employee: "Sin asignar",
            project: "General",
            ...task,
          })),
        );
      }
    } catch {
      // ignore malformed storage
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(kanbanStorageKey, JSON.stringify(kanbanTasks));
  }, [kanbanTasks]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== kanbanStorageKey || !event.newValue) return;
      try {
        const parsed = JSON.parse(event.newValue) as KanbanTask[];
        if (Array.isArray(parsed)) {
          setKanbanTasks(
            parsed.map((task) => ({
              employee: "Sin asignar",
              project: "General",
              ...task,
            })),
          );
        }
      } catch {
        // ignore malformed storage
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const filteredTasks = useMemo(() => {
    if (activeTab === "todo") return kanbanTasks;
    return kanbanTasks.filter((task) => task.type === activeTab);
  }, [activeTab, kanbanTasks]);

  const totalPagado =
    paymentInputs.anticipo + paymentInputs.segundoPago + paymentInputs.liquidacion;
  const restante = Math.max(0, projectBudget - totalPagado);

  const handleTaskAction = (taskType: TaskType, taskId: string) => {
    if (taskType === "diseño") {
      setUploadTask(taskId);
      return;
    }
  };

  const setTaskStatus = (taskId: string, status: TaskStatus) => {
    setKanbanTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, status } : task)),
    );
  };

  const statusOrder = kanbanColumns.map((column) => column.id);
  const shiftTaskStatus = (taskId: string, direction: "left" | "right") => {
    setKanbanTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        const currentIndex = statusOrder.indexOf(task.status);
        if (currentIndex === -1) return task;
        const nextIndex = direction === "left" ? currentIndex - 1 : currentIndex + 1;
        if (nextIndex < 0 || nextIndex >= statusOrder.length) return task;
        return { ...task, status: statusOrder[nextIndex] };
      }),
    );
  };

  const moveTaskToStatus = (taskId: string, status: TaskStatus) => {
    setKanbanTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, status } : task)),
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-secondary">Dashboard Empleado</p>
        <h1 className="mt-2 text-3xl font-semibold">Mi productividad</h1>
        <p className="mt-2 text-sm text-secondary">
          Ordena pendientes, abre citas y sube archivos en segundos.
        </p>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg backdrop-blur-md"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-secondary">Mis pendientes</p>
            <h2 className="mt-2 text-xl font-semibold">Tablero personal</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition ${
                  activeTab === tab.id
                    ? "border-accent bg-accent text-white"
                    : "border-primary/10 bg-white text-secondary hover:border-primary/30"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {kanbanColumns.map((column) => {
            const columnTasks = filteredTasks.filter((task) => task.status === column.id);
            const isDragOver = dragOverColumnId === column.id;
            return (
              <div
                key={column.id}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOverColumnId(column.id);
                }}
                onDragLeave={() => setDragOverColumnId(null)}
                onDrop={(event) => {
                  event.preventDefault();
                  const taskId = event.dataTransfer.getData("text/plain");
                  if (taskId) {
                    moveTaskToStatus(taskId, column.id);
                  }
                  setDraggedTaskId(null);
                  setDragOverColumnId(null);
                }}
                className={`rounded-2xl border border-primary/10 bg-white/70 p-4 transition ${
                  isDragOver ? "bg-accent/5 ring-2 ring-accent/30" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                    {column.label}
                  </p>
                  <span className="rounded-full bg-primary/5 px-2 py-1 text-[11px] text-secondary">
                    {columnTasks.length}
                  </span>
                </div>
                <div className="mt-3 space-y-3">
                  {columnTasks.map((task) => {
                    const statusIndex = statusOrder.indexOf(task.status);
                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.setData("text/plain", task.id);
                          event.dataTransfer.effectAllowed = "move";
                          setDraggedTaskId(task.id);
                        }}
                        onDragEnd={() => {
                          setDraggedTaskId(null);
                          setDragOverColumnId(null);
                        }}
                        className="rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">{task.title}</p>
                            <p className="mt-1 text-xs text-secondary capitalize">{task.type}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => shiftTaskStatus(task.id, "left")}
                              disabled={statusIndex <= 0}
                              className="rounded-full border border-primary/10 p-1 text-secondary transition disabled:opacity-40"
                              aria-label="Mover a la izquierda"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => shiftTaskStatus(task.id, "right")}
                              disabled={statusIndex >= statusOrder.length - 1}
                              className="rounded-full border border-primary/10 p-1 text-secondary transition disabled:opacity-40"
                              aria-label="Mover a la derecha"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <select
                            value={task.status}
                            onChange={(event) =>
                              setTaskStatus(task.id, event.target.value as TaskStatus)
                            }
                            className="rounded-full border border-primary/10 bg-white px-3 py-1 text-[11px] font-semibold text-secondary"
                          >
                            {kanbanColumns.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => handleTaskAction(task.type, task.id)}
                            className="rounded-full border border-primary/10 bg-white px-3 py-1 text-[11px] font-semibold text-secondary"
                          >
                            {task.type === "diseño"
                              ? "Subir"
                              : task.type === "cita"
                                ? "Abrir"
                                : "Ver"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {columnTasks.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-primary/10 bg-white/50 px-4 py-6 text-center text-xs text-secondary">
                      Sin tareas en esta etapa.
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="grid grid-cols-1 gap-6 md:grid-cols-2"
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
        {uploadTask ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="w-full max-w-md rounded-3xl border border-white/70 bg-white/90 p-6 shadow-2xl backdrop-blur-md"
            >
              <h3 className="text-lg font-semibold">Subir archivos</h3>
              <p className="mt-2 text-sm text-secondary">
                Adjunta planos, renders o referencias del diseño seleccionado.
              </p>
              <div className="mt-4 rounded-2xl border border-dashed border-primary/20 bg-white px-4 py-8 text-center text-sm text-secondary">
                Arrastra archivos aquí o haz clic para cargar.
              </div>
              <button
                onClick={() => setUploadTask(null)}
                className="mt-6 w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-white"
              >
                Listo
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isPublicEditorOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          >
            <motion.div
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
