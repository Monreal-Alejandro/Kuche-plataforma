"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, CheckCircle2, FileUp, LayoutGrid } from "lucide-react";

type TaskType = "todo" | "cita" | "diseño";

const tasks = [
  { id: "t1", title: "Revisar medidas cliente Vega", type: "todo" as TaskType },
  { id: "t2", title: "Cita showroom 10:30 AM", type: "cita" as TaskType },
  { id: "t3", title: "Diseño cocina Solaris", type: "diseño" as TaskType },
  { id: "t4", title: "Cotizar clóset Estudio A", type: "todo" as TaskType },
  { id: "t5", title: "Cita instalación 4:00 PM", type: "cita" as TaskType },
];

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

export default function EmpleadoDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TaskType>("todo");
  const [uploadTask, setUploadTask] = useState<string | null>(null);
  const [isPublicEditorOpen, setIsPublicEditorOpen] = useState(false);
  const [publicStep, setPublicStep] = useState(publicTimelineSteps[2]);
  const [publicFiles, setPublicFiles] = useState([
    { id: "p1", name: "Render_Actualizado.jpg", type: "jpg" },
    { id: "p2", name: "Plano_Tecnico.pdf", type: "pdf" },
  ]);
  const [newFileName, setNewFileName] = useState("");
  const [newFileType, setNewFileType] = useState("pdf");

  const filteredTasks = useMemo(() => {
    if (activeTab === "todo") return tasks;
    return tasks.filter((task) => task.type === activeTab);
  }, [activeTab]);

  const handleTaskAction = (taskType: TaskType, taskId: string) => {
    if (taskType === "diseño") {
      setUploadTask(taskId);
      return;
    }
    if (taskType === "cita") {
      router.push("/dashboard/levantamiento");
      return;
    }
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

        <div className="mt-6 space-y-3">
          {filteredTasks.map((task) => (
            <button
              key={task.id}
              onClick={() => handleTaskAction(task.type, task.id)}
              className="flex w-full items-center justify-between rounded-2xl border border-primary/10 bg-white px-5 py-4 text-left text-sm transition hover:border-primary/20"
            >
              <div>
                <p className="font-semibold">{task.title}</p>
                <p className="text-xs text-secondary capitalize">{task.type}</p>
              </div>
              <span className="text-xs text-secondary">
                {task.type === "diseño" ? "Subir" : task.type === "cita" ? "Abrir" : "Ver"}
              </span>
            </button>
          ))}
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
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
          <p className="text-xs uppercase tracking-[0.3em] text-secondary">Atajo rápido</p>
          <h3 className="mt-2 text-xl font-semibold">Levantamiento activo</h3>
          <p className="mt-3 text-sm text-secondary">
            Inicia un levantamiento rápido desde tu tablero personal.
          </p>
          <button
            onClick={() => router.push("/dashboard/levantamiento")}
            className="mt-4 rounded-2xl bg-accent px-4 py-2 text-xs font-semibold text-white shadow"
          >
            Abrir levantamiento
          </button>
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
              className="w-full max-w-lg rounded-3xl border border-white/70 bg-white/90 p-6 shadow-2xl backdrop-blur-md"
            >
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
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
