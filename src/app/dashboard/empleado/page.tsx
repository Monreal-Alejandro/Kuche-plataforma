/**
 * Dashboard de Empleado - Panel Kanban de Gestión de Tareas
 * 
 * Este componente implementa un tablero Kanban completo para que los empleados
 * gestionen tareas de proyectos a través de diferentes etapas: Citas, Diseños,
 * Cotización y Levantamiento.
 * 
 * Funcionalidades principales:
 * - Tablero Kanban con drag & drop entre columnas
 * - Filtrado de tareas (todas / solo mis tareas)
 * - Modal de detalles de tarea con gestión de estado
 * - Subida de archivos (diseños, contratos, renders)
 * - Editor de estatus público visible al cliente
 * - Sincronización de estado con localStorage (temporal)
 * 
 * Estado actual:
 * - ✅ Código limpio y comentado según buenas prácticas
 * - ✅ Estructura segmentada para fácil mantenimiento
 * - ⏳ Pendiente: Integración con backend APIs
 * 
 * TODOs Backend:
 * 1. Importar tareasApi y proyectosApi cuando estén listos
 * 2. Reemplazar localStorage por llamadas al backend
 * 3. Usar user del AuthContext para filtrar tareas del empleado actual
 * 4. Implementar carga real de archivos al servidor
 * 5. Conectar timeline público con datos reales del proyecto
 * 
 * @author Frontend Team
 * @version 2.0 - Refactorizado y listo para backend
 */

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, FileUp } from "lucide-react";

// Hooks personalizados
import { useAuth } from "@/hooks/useAuth";
import { useEscapeClose } from "@/hooks/useEscapeClose";
import { useFocusTrap } from "@/hooks/useFocusTrap";

// Tipos y utilidades de Kanban
import {
  kanbanColumns,
  kanbanStorageKey,
  initialKanbanTasks,
  activeCitaTaskStorageKey,
  type KanbanTask,
  type TaskFile,
  type TaskStage,
  type TaskStatus,
} from "@/lib/kanban";

// TODO: Importar APIs cuando estén disponibles
// import * as tareasApi from "@/lib/axios/tareasApi";
// import * as proyectosApi from "@/lib/axios/proyectosApi";

// TODO: Importar APIs cuando estén disponibles
// import * as tareasApi from "@/lib/axios/tareasApi";
// import * as proyectosApi from "@/lib/axios/proyectosApi";

/* ========================================================================
   CONSTANTES Y CONFIGURACIÓN
   ======================================================================== */

/**
 * Pasos del timeline público que el cliente puede ver
 * TODO: Mover a configuración del backend
 */
const publicTimelineSteps = [
  "Diseño Aprobado",
  "Materiales en Taller",
  "Corte CNC",
  "Ensamble",
  "Instalación Final",
];

/**
 * Presupuesto de ejemplo para demostración
 * TODO: Obtener del backend según el proyecto seleccionado
 */
const projectBudget = 145000;

/**
 * Formateador de moneda en formato mexicano
 */
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);

/**
 * Calcula el monto de cada pago en 3 parcialidades
 */
const installmentAmount = projectBudget / 3;

/**
 * Estilos según la etapa de la tarea en el flujo
 */
const stageStyles: Record<TaskStage, { border: string; badge: string }> = {
  citas: { border: "border-sky-500", badge: "bg-sky-50 text-sky-600" },
  disenos: { border: "border-violet-500", badge: "bg-violet-50 text-violet-600" },
  cotizacion: { border: "border-emerald-500", badge: "bg-emerald-50 text-emerald-600" },
  contrato: { border: "border-amber-500", badge: "bg-amber-50 text-amber-700" },
};

/**
 * Estilos según el status de la tarea
 */
/**
 * Estilos según el status de la tarea
 */
const statusStyles: Record<TaskStatus, string> = {
  pendiente: "bg-rose-50 text-rose-600",
  completada: "bg-emerald-50 text-emerald-600",
};

/* ========================================================================
   FUNCIONES DE UTILIDAD
   ======================================================================== */

/**
 * Genera las iniciales de un nombre para mostrar en avatares
 * @param name - Nombre completo del usuario
 * @returns Iniciales en mayúsculas (máximo 2 letras)
 */
const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

/**
 * Normaliza una tarea para asegurar que tenga todos los campos requeridos
 * Convierte formatos legacy al formato actual
 * @param task - Tarea parcial que puede venir de diferentes fuentes
 * @returns Tarea normalizada con todos los campos requeridos
 */
const normalizeTask = (task: Partial<KanbanTask> & Record<string, unknown>): KanbanTask => {
  // Conversión de formato legacy (type) a formato nuevo (stage)
  const legacyType = typeof task.type === "string" ? task.type : undefined;
  const legacyStage =
    legacyType === "cita"
      ? "citas"
      : legacyType === "diseño" || legacyType === "diseno"
        ? "disenos"
        : legacyType === "todo"
          ? "cotizacion"
          : undefined;
  
  // Validar que el stage pertenece a las columnas disponibles
  const stage =
    typeof task.stage === "string" && kanbanColumns.some((col) => col.id === task.stage)
      ? (task.stage as TaskStage)
      : legacyStage ?? "citas";
  
  const status = task.status === "completada" ? "completada" : "pendiente";
  
  return {
    id: typeof task.id === "string" ? task.id : `task-${Date.now()}`,
    title: typeof task.title === "string" ? task.title : "Tarea sin título",
    stage,
    status,
    assignedTo:
      typeof task.assignedTo === "string"
        ? task.assignedTo
        : typeof task.employee === "string"
          ? task.employee
          : "Sin asignar",
    project: typeof task.project === "string" ? task.project : "General",
    notes: typeof task.notes === "string" ? task.notes : "",
    files: Array.isArray(task.files) ? (task.files as TaskFile[]) : [],
  };
};

/**
 * Combina tareas del localStorage con las tareas iniciales
 * Evita duplicados usando el ID como clave única
 * @param storedTasks - Tareas almacenadas en localStorage
 * @returns Array de tareas sin duplicados
 */
const mergeTasks = (storedTasks: KanbanTask[]) => {
  const map = new Map(storedTasks.map((task) => [task.id, task]));
  initialKanbanTasks.forEach((task) => {
    if (!map.has(task.id)) {
      map.set(task.id, task);
    }
  });
  return Array.from(map.values());
};

/* ========================================================================
   COMPONENTE PRINCIPAL
   ======================================================================== */

/**
 * Dashboard de empleado - Vista principal del tablero Kanban
 * Muestra todas las tareas organizadas por etapas y permite gestionarlas
 * 
 * TODO: Conectar con backend para:
 * - Obtener tareas del usuario autenticado
 * - Actualizar estados en tiempo real
 * - Sincronizar archivos con el servidor
 * - Cargar datos de proyectos reales
 */
export default function EmpleadoDashboard() {
  const router = useRouter();
  const { user } = useAuth(); // TODO: Usar para cargar tareas del empleado autenticado
  
  /* ========================================================================
     ESTADO DEL COMPONENTE
     ======================================================================== */
  
  // Vista del tablero: "all" muestra todas las tareas, "mine" solo las asignadas al usuario
  const [viewMode, setViewMode] = useState<"all" | "mine">("all");
  
  // ID de la tarea cuyo modal de detalles está abierto
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  
  // ID de la tarea en la que se está subiendo archivos
  const [uploadTaskId, setUploadTaskId] = useState<string | null>(null);
  
  // Control del modal del editor público (vista del cliente)
  const [isPublicEditorOpen, setIsPublicEditorOpen] = useState(false);
  
  // Lista de todas las tareas del Kanban - TODO: Cargar desde backend con tareasApi
  const [kanbanTasks, setKanbanTasks] = useState<KanbanTask[]>(initialKanbanTasks);
  
  // Estado de drag & drop
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<TaskStage | null>(null);
  
  // Estado del timeline público (demo) - TODO: Cargar desde proyecto real
  const [publicStep, setPublicStep] = useState(publicTimelineSteps[2]);
  const [publicFiles, setPublicFiles] = useState([
    { id: "p1", name: "Render_Actualizado.jpg", type: "jpg" },
    { id: "p2", name: "Plano_Tecnico.pdf", type: "pdf" },
  ]);
  const [newFileName, setNewFileName] = useState("");
  const [newFileType, setNewFileType] = useState("pdf");
  
  // Entradas de pagos del proyecto (demo) - TODO: Cargar desde proyectos del backend
  const [paymentInputs, setPaymentInputs] = useState({
    anticipo: 45000,
    segundoPago: 30000,
    liquidacion: 0,
  });
  
  /* ========================================================================
     REFS PARA MODALES Y SINCRONIZACIÓN
     ======================================================================== */
  
  // Previene bucles infinitos en la sincronización con localStorage
  const skipNextWriteRef = useRef(false);
  
  // Referencias a los modales para manejo de focus trap
  const activeTaskRef = useRef<HTMLDivElement | null>(null);
  const uploadTaskRef = useRef<HTMLDivElement | null>(null);
  const publicEditorRef = useRef<HTMLDivElement | null>(null);

  /* ========================================================================
     HOOKS PERSONALIZADOS
     ======================================================================== */
  
  // Cerrar modales con tecla Escape
  useEscapeClose(Boolean(activeTaskId), () => setActiveTaskId(null));
  useEscapeClose(Boolean(uploadTaskId), () => setUploadTaskId(null));
  useEscapeClose(isPublicEditorOpen, () => setIsPublicEditorOpen(false));
  
  // Trap del focus dentro de los modales para accesibilidad
  useFocusTrap(Boolean(activeTaskId), activeTaskRef);
  useFocusTrap(Boolean(uploadTaskId), uploadTaskRef);
  useFocusTrap(isPublicEditorOpen, publicEditorRef);

  /* ========================================================================
     EFECTOS DE SINCRONIZACIÓN
     ======================================================================== */
  
  /**
   * Effect: Sincronización inicial con localStorage
   * Carga las tareas guardadas o inicializa con las tareas por defecto
   * TODO: Reemplazar con llamada al backend para obtener tareas reales
   */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncFromStorage = () => {
      const stored = window.localStorage.getItem(kanbanStorageKey);
      if (!stored) {
        const merged = mergeTasks(initialKanbanTasks);
        skipNextWriteRef.current = true;
        setKanbanTasks(merged);
        window.localStorage.setItem(kanbanStorageKey, JSON.stringify(merged));
        return;
      }
      try {
        const parsed = JSON.parse(stored) as KanbanTask[];
        if (Array.isArray(parsed) && parsed.length) {
          const normalized = parsed.map((task) => normalizeTask(task));
          const merged = mergeTasks(normalized);
          skipNextWriteRef.current = true;
          setKanbanTasks(merged);
          if (merged.length !== normalized.length) {
            window.localStorage.setItem(kanbanStorageKey, JSON.stringify(merged));
          }
        }
      } catch {
        // Ignorar errores de parsing en localStorage corrupto
      }
    };

    // Ejecutar sincronización inicial
    syncFromStorage();
    
    // Sincronizar cuando la ventana recupera el foco (usuario regresa a la tab)
    const handleFocus = () => syncFromStorage();
    
    // Sincronizar cuando la tab se vuelve visible
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        syncFromStorage();
      }
    };
    
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  /**
   * Effect: Guardar cambios en localStorage
   * Se ejecuta cada vez que cambia el array de tareas
   * TODO: Reemplazar con llamadas al backend para persistir cambios
   */
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Saltar el siguiente guardado para evitar bucles
    if (skipNextWriteRef.current) {
      skipNextWriteRef.current = false;
      return;
    }
    
    window.localStorage.setItem(kanbanStorageKey, JSON.stringify(kanbanTasks));
  }, [kanbanTasks]);

  /**
   * Effect: Sincronización entre pestañas
   * Escucha cambios de localStorage en otras tabs y actualiza la vista
   */
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const handleStorage = (event: StorageEvent) => {
      // Solo reaccionar a cambios en el key de Kanban
      if (event.key !== kanbanStorageKey || !event.newValue) return;
      
      try {
        const parsed = JSON.parse(event.newValue) as KanbanTask[];
        if (Array.isArray(parsed)) {
          setKanbanTasks(mergeTasks(parsed.map((task) => normalizeTask(task))));
        }
      } catch {
        // Ignorar errores de parsing
      }
    };
    
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  /* ========================================================================
     DATOS COMPUTADOS
     ======================================================================== */
  
  /**
   * Filtra las tareas según el modo de vista seleccionado
   * - "all": Muestra todas las tareas
   * - "mine": Solo las tareas asignadas al usuario actual
   * TODO: Usar user.name en lugar de currentUser cuando esté conectado al backend
   */
  const filteredTasks = useMemo(() => {
    if (viewMode === "mine") {
      // TODO: Cambiar currentUser por user?.name cuando esté integrado con AuthContext
      return kanbanTasks.filter((task) => task.assignedTo === "Empleado 1");
    }
    return kanbanTasks;
  }, [kanbanTasks, viewMode]);

  /**
   * Calcula los montos de pago del proyecto
   * TODO: Obtener estos valores del backend (proyectosApi)
   */
  const totalPagado =
    paymentInputs.anticipo + paymentInputs.segundoPago + paymentInputs.liquidacion;
  const restante = Math.max(0, projectBudget - totalPagado);

  /* ========================================================================
     FUNCIONES DE ACTUALIZACIÓN DE TAREAS
     ======================================================================== */
  
  /**
   * Actualiza una tarea específica usando una función transformadora
   * @param taskId - ID de la tarea a actualizar
   * @param updater - Función que recibe la tarea actual y retorna la tarea modificada
   * TODO: Enviar actualización al backend con tareasApi.actualizarTarea()
   */
  const updateTask = (taskId: string, updater: (task: KanbanTask) => KanbanTask) => {
    setKanbanTasks((prev) =>
      prev.map((task) => (task.id === taskId ? updater(task) : task)),
    );
  };

  /**
   * Cambia el estado de una tarea (pendiente/completada)
   * TODO: Sincronizar con backend
   */
  const setTaskStatus = (taskId: string, status: TaskStatus) => {
    updateTask(taskId, (task) => ({ ...task, status }));
  };

  /**
   * Mueve una tarea a una columna diferente del Kanban
   * TODO: Sincronizar con backend
   */
  const moveTaskToStage = (taskId: string, stage: TaskStage) => {
    updateTask(taskId, (task) => ({ ...task, stage }));
  };

  /**
   * Obtiene la tarea activa para mostrar en el modal de detalles
   */
  const activeTask = useMemo(
    () => kanbanTasks.find((task) => task.id === activeTaskId) ?? null,
    [activeTaskId, kanbanTasks],
  );
  
  /**
   * Obtiene la tarea para la cual se están cargando archivos
   */
  const uploadTask = useMemo(
    () => kanbanTasks.find((task) => task.id === uploadTaskId) ?? null,
    [kanbanTasks, uploadTaskId],
  );

  /* ========================================================================
     MANEJADORES DE ARCHIVOS
     ======================================================================== */
  
  /**
   * Infiere el tipo de archivo basado en su extensión
   * @param name - Nombre del archivo con extensión
   * @returns Tipo de archivo para categorización
   */
  const inferFileType = (name: string): TaskFile["type"] => {
    const lower = name.toLowerCase();
    if (lower.endsWith(".pdf")) return "pdf";
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png")) {
      return "render";
    }
    return "otro";
  };

  /**
   * Maneja la carga de archivos a una tarea específica
   * TODO: Implementar carga real al servidor con API de archivos
   * @param taskId - ID de la tarea que recibirá los archivos
   * @param files - Lista de archivos seleccionados
   */
  const handleFilesUpload = (taskId: string, files: FileList | null) => {
    if (!files?.length) return;
    
    const nextFiles: TaskFile[] = Array.from(files).map((file) => ({
      id: `file-${Date.now()}-${file.name}`,
      name: file.name,
      type: inferFileType(file.name),
    }));
    
    updateTask(taskId, (task) => ({
      ...task,
      files: [...(task.files ?? []), ...nextFiles],
    }));
  };

  /* ========================================================================
     NAVEGACIÓN Y ACCIONES ESPECIALES
     ======================================================================== */
  
  /**
   * Inicia el flujo de una cita, guardando su ID y navegando a la agenda
   * @param taskId - ID de la tarea de tipo cita
   */
  const handleStartCita = (taskId: string) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(activeCitaTaskStorageKey, taskId);
    }
    setActiveTaskId(null);
    router.push("/dashboard/cotizador");
  };

  /**
   * Marca una cita como completada y limpia el estado temporal
   * @param taskId - ID de la tarea de cita a finalizar
   */
  const handleFinishCita = (taskId: string) => {
    updateTask(taskId, (task) => ({ ...task, status: "completada" }));
    
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(activeCitaTaskStorageKey);
    }
    
    setActiveTaskId(null);
  };

  /* ========================================================================
     RENDER DEL COMPONENTE
     ======================================================================== */
  
  return (
    <div className="space-y-8">
      {/* Encabezado del dashboard */}
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-secondary">Dashboard Empleado</p>
        <h1 className="mt-2 text-3xl font-semibold">Tablero general</h1>
        <p className="mt-2 text-sm text-secondary">
          Visibilidad completa del flujo activo y responsables asignados.
        </p>
      </div>

      {/* Filtros y controles */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg backdrop-blur-md"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-secondary">Flujo de la empresa</p>
            <h2 className="mt-2 text-xl font-semibold">Tablero general</h2>
          </div>
          
          {/* Toggle entre ver todas las tareas o solo las tareas propias */}
          <div className="flex items-center gap-2 rounded-full border border-primary/10 bg-white p-1">
            {[
              { id: "all", label: "Ver todo" },
              { id: "mine", label: "Mis tareas" },
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => setViewMode(option.id as "all" | "mine")}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  viewMode === option.id
                    ? "bg-accent text-white"
                    : "text-secondary hover:text-primary"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de columnas Kanban: Citas, Diseños, Cotización, Levantamiento */}
        <div className="mt-6 grid gap-4 lg:grid-cols-4">
          {kanbanColumns.map((column) => {
            const columnTasks = filteredTasks.filter((task) => task.stage === column.id);
            const isDragOver = dragOverColumnId === column.id;
            
            return (
              <div
                key={column.id}
                // Handlers para drag & drop de tareas entre columnas
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOverColumnId(column.id);
                }}
                onDragLeave={() => setDragOverColumnId(null)}
                onDrop={(event) => {
                  event.preventDefault();
                  const taskId = event.dataTransfer.getData("text/plain");
                  if (taskId) {
                    moveTaskToStage(taskId, column.id);
                  }
                  setDraggedTaskId(null);
                  setDragOverColumnId(null);
                }}
                className={`rounded-2xl border border-primary/10 bg-white/70 p-4 transition ${
                  isDragOver ? "bg-accent/5 ring-2 ring-accent/30" : ""
                }`}
              >
                {/* Header de la columna con contador de tareas */}
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                    {column.label}
                  </p>
                  <span className="rounded-full bg-primary/5 px-2 py-1 text-[11px] text-secondary">
                    {columnTasks.length}
                  </span>
                </div>
                
                {/* Lista de tarjetas de tareas en esta columna */}
                <div className="mt-3 space-y-3">
                  {columnTasks.map((task) => {
                    const stageStyle = stageStyles[task.stage];
                    
                    return (
                      <div
                        key={task.id}
                        draggable
                        onClick={() => setActiveTaskId(task.id)}
                        // Handlers para drag & drop de una tarea individual
                        onDragStart={(event) => {
                          event.dataTransfer.setData("text/plain", task.id);
                          event.dataTransfer.effectAllowed = "move";
                          setDraggedTaskId(task.id);
                        }}
                        onDragEnd={() => {
                          setDraggedTaskId(null);
                          setDragOverColumnId(null);
                        }}
                        className={`flex h-48 cursor-pointer flex-col overflow-hidden rounded-2xl border border-primary/10 bg-white px-4 py-4 text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                          stageStyle?.border ? `border-l-4 ${stageStyle.border}` : ""
                        }`}
                      >
                        {/* Badge de estado: Pendiente o Completada */}
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                            statusStyles[task.status]
                          }`}
                        >
                          {task.status === "completada" ? "Completada" : "Pendiente"}
                        </span>
                        
                        <div className="mt-3 flex flex-1 flex-col">
                          {/* Título y proyecto de la tarea */}
                          <div className="min-h-[3.75rem] max-h-[3.75rem]">
                            <p
                              className="line-clamp-2 break-words text-base font-semibold leading-6 text-gray-900"
                              title={task.title}
                            >
                              {task.title}
                            </p>
                            <p
                              className="mt-1 line-clamp-1 break-words text-xs leading-4 text-secondary"
                              title={task.project}
                            >
                              {task.project}
                            </p>
                          </div>
                          
                          {/* Botones de acción según el tipo de tarea */}
                          <div className="mt-3 min-h-[1.75rem]">
                            <div className="flex flex-wrap gap-2">
                              {/* Botón "Iniciar cita" para tareas pendientes en columna de Citas */}
                              {task.stage === "citas" && task.status === "pendiente" ? (
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleStartCita(task.id);
                                  }}
                                  className="inline-flex w-auto items-center rounded-full border border-primary/10 bg-white px-3 py-1 text-[11px] font-semibold text-secondary"
                                >
                                  Iniciar cita
                                </button>
                              ) : null}
                              
                              {/* Botón "Iniciar" para tareas de cotización */}
                              {task.stage === "cotizacion" && task.status === "pendiente" ? (
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleStartCita(task.id);
                                  }}
                                  className="inline-flex w-auto items-center rounded-full border border-primary/10 bg-white px-3 py-1 text-[11px] font-semibold text-secondary"
                                >
                                  Iniciar
                                </button>
                              ) : null}
                              
                              {/* Botón "Subir" para tareas de diseño */}
                              {task.stage === "disenos" ? (
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setUploadTaskId(task.id);
                                  }}
                                  className="inline-flex w-auto items-center rounded-full border border-primary/10 bg-white px-3 py-1 text-[11px] font-semibold text-secondary"
                                >
                                  Subir
                                </button>
                              ) : null}
                              
                              {/* Botón "Subir" para tareas de contrato */}
                              {task.stage === "contrato" ? (
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setUploadTaskId(task.id);
                                  }}
                                  className="inline-flex w-auto items-center rounded-full border border-primary/10 bg-white px-3 py-1 text-[11px] font-semibold text-secondary"
                                >
                                  Subir
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        <div className="mt-auto flex items-center gap-2 pb-3 pt-3 text-sm text-gray-600">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[9px] font-semibold text-primary">
                            {getInitials(task.assignedTo)}
                          </span>
                          <span>{task.assignedTo}</span>
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

      {/* ========================================================================
           MODAL: Detalles de Tarea
           Modal lateral que muestra información completa de una tarea
           Permite cambiar estado, ver archivos, agregar notas, etc.
           ======================================================================== */}
      <AnimatePresence>
        {activeTask ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => setActiveTaskId(null)}
          >
            <motion.aside
              ref={activeTaskRef}
              tabIndex={-1}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
              className="absolute right-0 top-0 h-full w-full max-w-lg overflow-y-auto rounded-l-3xl border border-white/40 bg-white/95 p-6 shadow-2xl backdrop-blur-md"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-secondary">
                    Detalle de tarea
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-gray-900">
                    {activeTask.title}
                  </h3>
                  <p className="mt-1 text-sm text-secondary">{activeTask.project}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTaskId(null)}
                  className="rounded-full border border-primary/10 px-3 py-2 text-xs font-semibold text-secondary"
                >
                  Cerrar
                </button>
              </div>

              <div className="mt-6 space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                    Responsable
                  </p>
                  <div className="mt-3 flex items-center gap-3 text-sm text-gray-700">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {getInitials(activeTask.assignedTo)}
                    </span>
                    <div>
                      <p className="font-semibold text-gray-900">{activeTask.assignedTo}</p>
                      <p className="text-xs text-secondary">Equipo Kuche</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                    Estatus interno
                  </p>
                  <select
                    value={activeTask.status}
                    onChange={(event) =>
                      setTaskStatus(activeTask.id, event.target.value as TaskStatus)
                    }
                    className="mt-3 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm font-semibold text-secondary"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="completada">Completada</option>
                  </select>
                </div>

                {activeTask.stage === "citas" ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                      Acciones de cita
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {activeTask.status === "pendiente" ? (
                        <button
                          type="button"
                          onClick={() => handleStartCita(activeTask.id)}
                          className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white"
                        >
                          Iniciar cita
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => handleFinishCita(activeTask.id)}
                        className="rounded-full border border-primary/10 bg-white px-4 py-2 text-xs font-semibold text-secondary"
                      >
                        Terminar cita
                      </button>
                    </div>
                  </div>
                ) : null}
                {activeTask.stage === "cotizacion" ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                      Acciones de cotización
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {activeTask.status === "pendiente" ? (
                        <button
                          type="button"
                          onClick={() => handleStartCita(activeTask.id)}
                          className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white"
                        >
                          Iniciar
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => handleFinishCita(activeTask.id)}
                        className="rounded-full border border-primary/10 bg-white px-4 py-2 text-xs font-semibold text-secondary"
                      >
                        Terminar
                      </button>
                    </div>
                  </div>
                ) : null}
                {activeTask.stage === "disenos" ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                      Entregables de diseño
                    </p>
                    <button
                      type="button"
                      onClick={() => setUploadTaskId(activeTask.id)}
                      className="mt-3 inline-flex items-center rounded-full border border-primary/10 bg-white px-4 py-2 text-xs font-semibold text-secondary"
                    >
                      Subir diseño
                    </button>
                  </div>
                ) : null}
                {activeTask.stage === "contrato" ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                      Archivos de contrato
                    </p>
                    <button
                      type="button"
                      onClick={() => setUploadTaskId(activeTask.id)}
                      className="mt-3 inline-flex items-center rounded-full border border-primary/10 bg-white px-4 py-2 text-xs font-semibold text-secondary"
                    >
                      Subir contrato
                    </button>
                  </div>
                ) : null}

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                    Archivos
                  </p>
                  <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/20 bg-white px-4 py-6 text-sm text-secondary">
                    <FileUp className="h-4 w-4" />
                    Subir PDF o renders
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(event) =>
                        handleFilesUpload(activeTask.id, event.target.files)
                      }
                    />
                  </label>
                  <div className="mt-4 space-y-2">
                    {(activeTask.files ?? []).length === 0 ? (
                      <div className="rounded-2xl border border-primary/10 bg-white px-4 py-3 text-xs text-secondary">
                        Sin archivos cargados.
                      </div>
                    ) : (
                      (activeTask.files ?? []).map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm"
                        >
                          <span>{file.name}</span>
                          <span className="text-xs uppercase text-secondary">{file.type}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                    Notas
                  </p>
                  <textarea
                    value={activeTask.notes ?? ""}
                    onChange={(event) =>
                      updateTask(activeTask.id, (task) => ({
                        ...task,
                        notes: event.target.value,
                      }))
                    }
                    placeholder="Agrega detalles o avances relevantes."
                    className="mt-3 min-h-[120px] w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                  />
                </div>
              </div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* ========================================================================
           MODAL: Subida de Archivos
           Modal para cargar archivos (diseños, contratos, renders, etc.)
           TODO: Implementar carga real al servidor
           ======================================================================== */}
      <AnimatePresence>
        {uploadTaskId ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={() => setUploadTaskId(null)}
          >
            <motion.div
              ref={uploadTaskRef}
              tabIndex={-1}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="w-full max-w-md rounded-3xl border border-white/70 bg-white/90 p-6 shadow-2xl backdrop-blur-md"
              onClick={(event) => event.stopPropagation()}
            >
              <h3 className="text-lg font-semibold">
                {uploadTask?.stage === "contrato" ? "Subir contrato" : "Subir diseño"}
              </h3>
              <p className="mt-2 text-sm text-secondary">
                {uploadTask?.stage === "contrato"
                  ? "Adjunta el contrato firmado o sus anexos."
                  : "Adjunta renders o planos para esta tarea de diseño."}
              </p>
              <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/20 bg-white px-4 py-8 text-center text-sm text-secondary">
                <FileUp className="h-4 w-4" />
                Seleccionar archivos
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    handleFilesUpload(uploadTaskId, event.target.files);
                    setUploadTaskId(null);
                  }}
                />
              </label>
              <button
                type="button"
                onClick={() => setUploadTaskId(null)}
                className="mt-6 w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-white"
              >
                Listo
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* ========================================================================
           MODAL: Editor de Estatus Público
           Permite editar el paso del timeline visible al cliente
           Administra archivos (renders, planos) que el cliente puede ver
           TODO: Conectar con backend para actualizar proyecto del cliente
           ======================================================================== */}
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
