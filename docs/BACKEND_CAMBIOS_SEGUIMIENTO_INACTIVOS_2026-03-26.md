# Guía de Cambios Backend: Sistema de Seguimiento y Proyectos Inactivos

**Fecha:** 26 de Marzo, 2026  
**Versión:** 1.0

---

## 📝 Resumen Ejecutivo

Se han realizado cambios significativos en el frontend para mejorar el flujo de seguimiento de clientes. El término **"descartado"** ha sido reemplazado por **"inactivo"** en toda la plataforma para mejor claridad semántica. Además, se ha implementado un sistema de notificaciones con contador de 3 días para dar seguimiento a tareas.

---

## 🔄 Cambios en Enumeraciones y Tipos

### 1. **Estado de Seguimiento (`FollowUpStatus`)**

**Antes:**
```
"pendiente" | "confirmado" | "descartado"
```

**Después:**
```
"pendiente" | "confirmado" | "inactivo"
```

### Impacto en el Backend:
- **API REST**: Todos los endpoints que acepten o devuelvan estados de seguimiento deben cambiar:
  - Endpoints que verifiquen `status === "descartado"` → `status === "inactivo"`
  - Bases de datos deben migrar registros existentes con `status: "descartado"` a `status: "inactivo"`

**Ubicación en código backend (esperada):**
```typescript
// En tipos/enums
export type SeguimientoStatus = "pendiente" | "confirmado" | "inactivo";

// En esquema de base de datos
followUpStatus: { type: String, enum: ["pendiente", "confirmado", "inactivo"], default: "pendiente" }
```

---

## 📊 Endpoints Afectados

### 1. **PUT `/api/tareas/:id/estado`** (o equivalente)
Cambiar estado de seguimiento de una tarea

**Body esperado:**
```json
{
  "followUpStatus": "inactivo",
  "status": "completada"
}
```

**Cambios requeridos:**
- Validar que `followUpStatus` solo acepte: `"pendiente"`, `"confirmado"`, `"inactivo"`
- Si recibe `"descartado"`, debe convertir automáticamente a `"inactivo"` (para compatibilidad hacia atrás)

### 2. **GET `/api/tareas?followUpStatus=inactivo`** (o filtrado equivalente)
Listar todas las tareas con estado inactivo

**Cambios requeridos:**
- Actualizar filtros para usar `"inactivo"` en lugar de `"descartado"`
- Mantener compatibilidad si alguien usa el antiguo filtro

### 3. **GET `/api/tareas/estadisticas`** (o análitica)
Obtener estadísticas de tareas

**Cambios requeridos:**
- Campo `descartados` → `inactivos`
- Contar registros donde `followUpStatus === "inactivo"`

**Respuesta esperada:**
```json
{
  "pendientes": 15,
  "confirmados": 8,
  "inactivos": 3
}
```

---

## 🕐 Sistema de Notificaciones de Seguimiento (Contador de 3 Días)

### Funcionamiento Actual en Frontend:

El sistema ya está implementado con estas constantes en `KanbanTablero.tsx`:

```typescript
const FOLLOWUP_WARNING_DAYS = 3;      // Mostrar alerta amarilla
const FOLLOWUP_URGENT_DAYS = 7;       // Mostrar alerta roja
const FOLLOWUP_AUTO_DISCARD_DAYS = 10; // Cambiar a inactivo automáticamente
```

### Lógica de Alertas:

| Días Transcurridos | Estado | UI |
|---|---|---|
| 0-2 | `"none"` | Sin alerta |
| 3-6 | `"warning"` | Alerta amarilla "Dar seguimiento" |
| 7-9 | `"urgent"` | Alerta roja crítica |
| 10+ | `"expired"` | Cambiar automáticamente a inactivo |

### Backend - Recomendaciones de Implementación:

#### 1. **Agregar campo `followUpEnteredAt` en modelo de Tarea**

```typescript
interface Tarea {
  id: string;
  stage: "citas" | "disenos" | "cotizacion" | "contrato";
  followUpStatus: "pendiente" | "confirmado" | "inactivo";
  followUpEnteredAt?: number; // Timestamp en ms cuando entró a "contrato"
  // ... otros campos
}
```

#### 2. **Registrar el timestamp al pasar a "contrato"**

**Cuando se llama PUT `/api/tareas/:id/estado` con `stage: "contrato"`:**

```typescript
if (updates.stage === "contrato") {
  updates.followUpEnteredAt = Date.now(); // Guardar timestamp
}
```

#### 3. **Endpoint para obtener alertas pendientes** (Opcional pero Recomendado)

```
GET /api/tareas/alertas/seguimiento?diasThreshold=3
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "warning": [ // 3+ días
      { id: "task-1", cliente: "Juan Pérez", diasEnSeguimiento: 4 }
    ],
    "urgent": [ // 7+ días
      { id: "task-2", cliente: "María García", diasEnSeguimiento: 8 }
    ],
    "expired": [ // 10+ días
      { id: "task-3", cliente: "Carlos López", diasEnSeguimiento: 14 }
    ]
  }
}
```

#### 4. **Tarea Cron: Auto-inactivar proyectos después de 10 días**

```typescript
// Ejecutar diariamente
async function dailyFollowUpCheck() {
  const INACTIVITY_THRESHOLD_MS = 10 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  const tasksToInactivate = await Tarea.find({
    stage: "contrato",
    followUpStatus: "pendiente",
    followUpEnteredAt: { $lt: now - INACTIVITY_THRESHOLD_MS }
  });

  for (const task of tasksToInactivate) {
    await Tarea.updateOne(
      { _id: task._id },
      { 
        followUpStatus: "inactivo",
        status: "completada"
      }
    );
  }
}
```

---

## 🗂️ Cambios en Base de Datos

### 1. **Script de Migración**

```javascript
// MongoDB ejemplo
db.tareas.updateMany(
  { followUpStatus: "descartado" },
  { $set: { followUpStatus: "inactivo" } }
);

// Verificar
db.tareas.countDocuments({ followUpStatus: "inactivo" });
```

### 2. **Verificar índices para rendimiento**

```javascript
// Crear índice si no existe
db.tareas.createIndex({ followUpStatus: 1, followUpEnteredAt: 1 });
db.tareas.createIndex({ stage: 1, followUpStatus: 1 });
```

---

## 🔗 Flujo Completo de Seguimiento

```
┌─────────────────────────────────────────────────────────┐
│  1. Cotización Completada                               │
│     Tarea pasa a stage: "contrato"                      │
└─────────────────┬───────────────────────────────────────┘
                  │ followUpEnteredAt = Date.now()
                  ▼
┌─────────────────────────────────────────────────────────┐
│  2. Área de Seguimiento                                 │
│     followUpStatus: "pendiente"                         │
│     Botones: [Confirmar Cliente] [Marcar Inactivo]     │
└─────────────────┬───────────────────────────────────────┘
                  │
        ┌─────────┼─────────┐
        │         │         │
        ▼ 3 días  ▼ 7 días  ▼ 10 días
    Alerta    Alerta    Auto-inactivar
    Amarilla  Roja      
└─────────────────────────────────────────────────────────┘
                  │
        ┌─────────┼────────────────┐
        │         │                │
        ▼         ▼                ▼
    Confirmado Pendiente      INACTIVO
    (verde)    (continuando)  (gris)
```

---

## 🧪 Testing Recomendado

### 1. **Pruebas Unit**
```typescript
describe("FollowUp Status", () => {
  it("Should convert 'descartado' to 'inactivo'", async () => {
    const result = await updateTaskFollowUp(taskId, { followUpStatus: "descartado" });
    expect(result.followUpStatus).toBe("inactivo");
  });

  it("Should auto-inactivate after 10 days", async () => {
    // Setup: create task 11 days ago
    // Execute: run daily cron
    // Assert: status changed to "inactivo"
  });
});
```

### 2. **Pruebas de Integración**
- Pasar tarea a "contrato" y verificar que `followUpEnteredAt` se registra
- Verificar alertas en 3, 7 y 10 días
- Confirmar cliente y verificar que cambia a "confirmado"
- Marcar inactivo y verificar que cambia a "inactivo"

### 3. **Pruebas de Performance**
- Verificar que query de alertas no exceda cierto tiempo
- Índices creados correctamente

---

## 📋 Cambios en Frontend (Ya Realizados)

✅ Reemplazado `"descartado"` por `"inactivo"` en:
- `src/lib/kanban.ts`: Tipo `FollowUpStatus`
- `src/lib/admin-workflow.ts`: Mapeo y función `isTaskDiscarded`
- `src/lib/axios/tareasApi.ts`: Tipo `SeguimientoTarea`
- `src/app/admin/operaciones/page.tsx`: Acción de descartar cliente
- `src/components/KanbanTablero.tsx`: Toda lógica de seguimiento
- `src/app/dashboard/clientes-en-proceso/page.tsx`: Filtros

✅ Renombrado en rutas:
- `/admin/clientes-descartados` → Contenido actualizado (nota: renombrar carpeta manualmente si es necesario)
- Menú: "Clientes Descartados" → "Proyectos Inactivos"

✅ Botones y UI:
- "Descartar cliente" → "Marcar inactivo"
- "Cliente descartado" → "Proyecto inactivo"

✅ Sistema de notificaciones:
- Contador de 3 días ya implementado en frontend
- Alerta amarilla después de 3 días
- Alerta roja después de 7 días

---

## ⚠️ Consideraciones Importantes

1. **Compatibilidad hacia atrás**: Si el backend recibe `"descartado"`, debe convertirlo automáticamente a `"inactivo"`
2. **Índices de base de datos**: Crear índices para `followUpStatus` y `followUpEnteredAt` para optimizar queries
3. **Cron job**: Ejecutar automáticamente cada día para cambiar proyectos a inactivos después de 10 días
4. **Notificaciones**: Considerar implementar push notifications cuando se alcancen los umbrales de 3 y 7 días
5. **Auditoría**: Registrar quién cambió el estado de un proyecto y cuándo

---

## 📞 Preguntas Frecuentes

### ¿Qué pasa con los proyectos ya marcados como "descartado"?
Realizar migración en base de datos y convertir todos a `"inactivo"`.

### ¿Se deshabilita automáticamente el auto-inactivar?
No, continúa activo cada 10 días si el proyecto está en "pendiente".

### ¿Cuál es el formato de timestamp esperado?
Milisegundos desde epoch (JavaScript `Date.now()`).

### ¿Se puede reactivar un proyecto inactivo?
Sí, hay un botón "Reactivar proyecto" en la vista de proyectos inactivos que cambia el status y `followUpEnteredAt`.

---

## 📦 Entregables del Backend

1. ✅ Cambiar tipos de `"descartado"` a `"inactivo"`
2. ✅ Migrar datos de base de datos
3. ✅ Crear índices de base de datos
4. ✅ Implementar tarea cron diaria
5. ✅ Validar endpoints retornan `"inactivo"`
6. ✅ Testing completo
7. ⚠️ Considerar endpoint de alertas (opcional)

---

**Próxima reunión:** Validar que backend responde correctamente con `"inactivo"` en lugar de `"descartado"`
