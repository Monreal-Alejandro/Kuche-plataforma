# 🔌 Guía de Integración Frontend - Backend

**Archivo:** Ejemplos concretos de integración  
**Fecha:** Marzo 2026

---

## 📁 Paso 1: Crear el archivo tareasApi.ts

Crea el archivo en: `src/lib/axios/tareasApi.ts`

```typescript
/**
 * API de Tareas
 * Endpoints para gestión del tablero Kanban de tareas
 */

import axiosInstance, { ApiResponse } from './axiosConfig';

/* ========================================================================
   TYPES & INTERFACES
   ======================================================================== */

export interface ArchivoTarea {
  id: string;
  nombre: string;
  tipo: "pdf" | "render" | "otro";
  url?: string;
  createdAt?: Date;
}

export interface Tarea {
  _id: string;
  titulo: string;
  etapa: "citas" | "disenos" | "cotizacion" | "contrato";
  estado: "pendiente" | "completada";
  asignadoA: string;              // ID del usuario
  asignadoANombre: string;        // Nombre del usuario (populado por backend)
  proyecto: string;               // ID del proyecto
  nombreProyecto: string;         // Nombre del proyecto (populado por backend)
  notas?: string;
  archivos?: ArchivoTarea[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CrearTareaData {
  titulo: string;
  etapa: "citas" | "disenos" | "cotizacion" | "contrato";
  estado?: "pendiente" | "completada";
  asignadoA: string;
  proyecto: string;
  notas?: string;
}

export interface ActualizarTareaData {
  titulo?: string;
  etapa?: "citas" | "disenos" | "cotizacion" | "contrato";
  estado?: "pendiente" | "completada";
  asignadoA?: string;
  notas?: string;
}

export interface FiltrosTareas {
  etapa?: string;
  estado?: string;
  asignadoA?: string;
  proyecto?: string;
}

/* ========================================================================
   API FUNCTIONS
   ======================================================================== */

/**
 * Obtener todas las tareas con filtros opcionales
 */
export const obtenerTareas = async (
  filtros?: FiltrosTareas
): Promise<ApiResponse<Tarea[]>> => {
  const response = await axiosInstance.get<ApiResponse<Tarea[]>>('/api/tareas', {
    params: filtros,
  });
  return response.data;
};

/**
 * Obtener una tarea por ID
 */
export const obtenerTarea = async (id: string): Promise<ApiResponse<Tarea>> => {
  const response = await axiosInstance.get<ApiResponse<Tarea>>(`/api/tareas/${id}`);
  return response.data;
};

/**
 * Crear nueva tarea
 */
export const crearTarea = async (
  data: CrearTareaData
): Promise<ApiResponse<Tarea>> => {
  const response = await axiosInstance.post<ApiResponse<Tarea>>('/api/tareas', data);
  return response.data;
};

/**
 * Actualizar tarea completa
 */
export const actualizarTarea = async (
  id: string,
  data: ActualizarTareaData
): Promise<ApiResponse<Tarea>> => {
  const response = await axiosInstance.put<ApiResponse<Tarea>>(`/api/tareas/${id}`, data);
  return response.data;
};

/**
 * Cambiar etapa de una tarea (para drag & drop)
 */
export const cambiarEtapa = async (
  id: string,
  etapa: "citas" | "disenos" | "cotizacion" | "contrato"
): Promise<ApiResponse<Tarea>> => {
  const response = await axiosInstance.patch<ApiResponse<Tarea>>(
    `/api/tareas/${id}/etapa`,
    { etapa }
  );
  return response.data;
};

/**
 * Cambiar estado de una tarea
 */
export const cambiarEstado = async (
  id: string,
  estado: "pendiente" | "completada"
): Promise<ApiResponse<Tarea>> => {
  const response = await axiosInstance.patch<ApiResponse<Tarea>>(
    `/api/tareas/${id}/estado`,
    { estado }
  );
  return response.data;
};

/**
 * Agregar archivos a una tarea
 */
export const agregarArchivos = async (
  id: string,
  archivos: Array<{ nombre: string; tipo: string; url: string }>
): Promise<ApiResponse<Tarea>> => {
  const response = await axiosInstance.post<ApiResponse<Tarea>>(
    `/api/tareas/${id}/archivos`,
    { archivos }
  );
  return response.data;
};

/**
 * Eliminar tarea
 */
export const eliminarTarea = async (id: string): Promise<ApiResponse<null>> => {
  const response = await axiosInstance.delete<ApiResponse<null>>(`/api/tareas/${id}`);
  return response.data;
};
```

---

## 📝 Paso 2: Exportar en index.ts

Agrega al archivo `src/lib/axios/index.ts`:

```typescript
// ... otras exportaciones

// Tareas API
export * as tareasApi from './tareasApi';
export * from './tareasApi';
```

---

## 🔄 Paso 3: Actualizar empleado/page.tsx

### 3.1 Agregar imports

```typescript
// Reemplazar este comentario:
// TODO: Importar APIs cuando estén disponibles
// import * as tareasApi from "@/lib/axios/tareasApi";

// Por:
import * as tareasApi from "@/lib/axios/tareasApi";
```

### 3.2 Mapear Tarea del backend a KanbanTask del frontend

Agregar función helper:

```typescript
/**
 * Convierte una Tarea del backend al formato KanbanTask del frontend
 */
const tareaToKanbanTask = (tarea: tareasApi.Tarea): KanbanTask => {
  return {
    id: tarea._id,
    title: tarea.titulo,
    stage: tarea.etapa,
    status: tarea.estado,
    assignedTo: tarea.asignadoANombre,  // Nombre, no ID
    project: tarea.nombreProyecto,       // Nombre, no ID
    notes: tarea.notas,
    files: tarea.archivos?.map(archivo => ({
      id: archivo.id,
      name: archivo.nombre,
      type: archivo.tipo,
    })) || [],
  };
};

/**
 * Convierte un KanbanTask del frontend a CrearTareaData para el backend
 */
const kanbanTaskToTarea = (
  task: Partial<KanbanTask>,
  asignadoAId: string,
  proyectoId: string
): tareasApi.CrearTareaData => {
  return {
    titulo: task.title || '',
    etapa: task.stage || 'citas',
    estado: task.status || 'pendiente',
    asignadoA: asignadoAId,
    proyecto: proyectoId,
    notas: task.notes,
  };
};
```

### 3.3 Reemplazar useEffect de localStorage por API

**ANTES (localStorage):**
```typescript
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
      }
    } catch {
      // Ignorar errores
    }
  };

  syncFromStorage();
  // ... resto del código
}, []);
```

**DESPUÉS (API):**
```typescript
useEffect(() => {
  /**
   * Cargar tareas desde el backend
   */
  const cargarTareas = async () => {
    try {
      setLoading(true);
      
      // Obtener tareas del backend
      const response = await tareasApi.obtenerTareas();
      
      if (response.success && response.data) {
        // Convertir formato backend → frontend
        const tareasFormateadas = response.data.map(tareaToKanbanTask);
        setKanbanTasks(tareasFormateadas);
      }
    } catch (error) {
      console.error('Error al cargar tareas:', error);
      // Fallback a tareas iniciales en caso de error
      setKanbanTasks(initialKanbanTasks);
    } finally {
      setLoading(false);
    }
  };

  cargarTareas();
}, []);
```

### 3.4 Actualizar función moveTaskToStage para usar API

**ANTES (solo local):**
```typescript
const moveTaskToStage = (taskId: string, stage: TaskStage) => {
  updateTask(taskId, (task) => ({ ...task, stage }));
};
```

**DESPUÉS (con API):**
```typescript
const moveTaskToStage = async (taskId: string, stage: TaskStage) => {
  // Actualización optimista (UI primero)
  const tareaAnterior = kanbanTasks.find(t => t.id === taskId);
  updateTask(taskId, (task) => ({ ...task, stage }));
  
  try {
    // Sincronizar con backend
    const response = await tareasApi.cambiarEtapa(taskId, stage);
    
    if (!response.success) {
      // Revertir si falla
      if (tareaAnterior) {
        updateTask(taskId, () => tareaAnterior);
      }
      console.error('Error al cambiar etapa:', response.message);
    }
  } catch (error) {
    // Revertir si hay error de red
    if (tareaAnterior) {
      updateTask(taskId, () => tareaAnterior);
    }
    console.error('Error de red al cambiar etapa:', error);
  }
};
```

### 3.5 Actualizar función setTaskStatus para usar API

**ANTES:**
```typescript
const setTaskStatus = (taskId: string, status: TaskStatus) => {
  updateTask(taskId, (task) => ({ ...task, status }));
};
```

**DESPUÉS:**
```typescript
const setTaskStatus = async (taskId: string, status: TaskStatus) => {
  const tareaAnterior = kanbanTasks.find(t => t.id === taskId);
  updateTask(taskId, (task) => ({ ...task, status }));
  
  try {
    const response = await tareasApi.cambiarEstado(taskId, status);
    
    if (!response.success) {
      if (tareaAnterior) {
        updateTask(taskId, () => tareaAnterior);
      }
      console.error('Error al cambiar estado:', response.message);
    }
  } catch (error) {
    if (tareaAnterior) {
      updateTask(taskId, () => tareaAnterior);
    }
    console.error('Error de red al cambiar estado:', error);
  }
};
```

### 3.6 Actualizar handlers de drag & drop

**Modificar el onDrop:**
```typescript
onDrop={async (event) => {
  event.preventDefault();
  const taskId = event.dataTransfer.getData("text/plain");
  
  if (taskId) {
    await moveTaskToStage(taskId, column.id);  // Ahora es async
  }
  
  setDraggedTaskId(null);
  setDragOverColumnId(null);
}}
```

### 3.7 Agregar estado de loading

```typescript
// Agregar estado
const [loading, setLoading] = useState(true);

// Mostrar loading mientras carga
if (loading) {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p className="mt-2 text-sm text-secondary">Cargando tareas...</p>
      </div>
    </div>
  );
}
```

---

## 🎯 Paso 4: Filtrar tareas del usuario

### 4.1 Usar user del AuthContext

```typescript
const { user } = useAuth();

// En useEffect, filtrar tareas solo del usuario actual
useEffect(() => {
  const cargarTareas = async () => {
    try {
      setLoading(true);
      
      // Si viewMode es "mine", filtrar por usuario actual
      const filtros: tareasApi.FiltrosTareas = {};
      if (viewMode === "mine" && user?._id) {
        filtros.asignadoA = user._id;
      }
      
      const response = await tareasApi.obtenerTareas(filtros);
      
      if (response.success && response.data) {
        const tareasFormateadas = response.data.map(tareaToKanbanTask);
        setKanbanTasks(tareasFormateadas);
      }
    } catch (error) {
      console.error('Error al cargar tareas:', error);
    } finally {
      setLoading(false);
    }
  };

  cargarTareas();
}, [viewMode, user?._id]);  // Re-cargar cuando cambie el modo o usuario
```

---

## ⚠️ Manejo de Errores

### Agregar toast/notificaciones

```typescript
// Opción 1: Usar estado simple
const [errorMessage, setErrorMessage] = useState<string | null>(null);

// Mostrar error
{errorMessage && (
  <div className="fixed bottom-4 right-4 rounded-lg bg-red-500 px-4 py-3 text-white shadow-lg">
    {errorMessage}
  </div>
)}

// En el catch de las funciones:
catch (error) {
  setErrorMessage('Error al actualizar la tarea');
  setTimeout(() => setErrorMessage(null), 3000);
}
```

```typescript
// Opción 2: Usar librería toast (react-hot-toast)
import toast from 'react-hot-toast';

// En los catch:
catch (error) {
  toast.error('Error al actualizar la tarea');
}
```

---

## 🧪 Testing de Integración

### Checklist de pruebas:

1. **Carga inicial**
   - [ ] Las tareas se cargan desde el backend al abrir la página
   - [ ] Se muestra loading mientras carga
   - [ ] Si hay error, muestra mensaje o fallback

2. **Drag & Drop**
   - [ ] Al arrastrar tarea, se actualiza en UI inmediatamente
   - [ ] Se envía petición al backend
   - [ ] Si falla, se revierte el cambio en UI
   - [ ] Se muestra error al usuario

3. **Completar tarea**
   - [ ] Checkbox marca la tarea como completada en UI
   - [ ] Se sincroniza con backend
   - [ ] Si falla, se revierte

4. **Filtros**
   - [ ] "Ver todo" muestra todas las tareas
   - [ ] "Mis tareas" solo muestra las del usuario actual
   - [ ] Ambos filtros hacen peticiones al backend correctas

5. **Modales**
   - [ ] Modal de detalles muestra información correcta
   - [ ] Cambios en el modal se sincronizan

---

## 📊 Monitoreo y Debugging

### Console logs útiles:

```typescript
// Agregar en desarrollo
useEffect(() => {
  console.log('🔄 Tareas cargadas:', kanbanTasks.length);
  console.log('👤 Usuario actual:', user?.nombre);
  console.log('📊 Modo de vista:', viewMode);
}, [kanbanTasks, user, viewMode]);

// En las funciones API
const moveTaskToStage = async (taskId: string, stage: TaskStage) => {
  console.log('🎯 Moviendo tarea:', taskId, 'a', stage);
  
  try {
    const response = await tareasApi.cambiarEtapa(taskId, stage);
    console.log('✅ Respuesta backend:', response);
  } catch (error) {
    console.error('❌ Error:', error);
  }
};
```

---

## 🚀 Deployment

### Variables de entorno

Asegúrate de tener en `.env.local`:

```bash
NEXT_PUBLIC_API_URL=https://tu-backend.com
# o en desarrollo:
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Build y deploy

```bash
# 1. Verificar que no hay errores
npm run build

# 2. Si todo está bien, hacer commit
git add .
git commit -m "feat: Integrar tareasApi con backend"

# 3. Push y deploy
git push origin Front_plataforma
```

---

## ✅ Checklist Final

Antes de considerar la integración completa:

- [ ] Archivo `tareasApi.ts` creado y exportado
- [ ] Funciones helper de conversión implementadas
- [ ] useEffect carga tareas desde backend
- [ ] Drag & drop sincroniza con backend
- [ ] Completar tareas sincroniza con backend
- [ ] Filtro "Mis tareas" funciona correctamente
- [ ] Loading state implementado
- [ ] Manejo de errores con UI feedback
- [ ] Actualización optimista (UI first, luego backend)
- [ ] Reversión en caso de error
- [ ] Console logs para debugging (removibles en prod)
- [ ] Variables de entorno configuradas
- [ ] Build sin errores
- [ ] Testing manual completado

---

## 🎉 Resultado

Una vez completada esta integración:

✅ El tablero Kanban estará completamente funcional  
✅ Los cambios se sincronizarán con el backend en tiempo real  
✅ Múltiples usuarios podrán trabajar simultáneamente  
✅ Los datos persisten en la base de datos  
✅ La experiencia de usuario es fluida (optimistic updates)  

---

**Última actualización:** Marzo 9, 2026  
**Ver también:**
- [BACKEND_API_SPECS.md](./BACKEND_API_SPECS.md) - Especificaciones completas del backend
- [PROMPT_BACKEND.md](./PROMPT_BACKEND.md) - Prompt para generar código backend
