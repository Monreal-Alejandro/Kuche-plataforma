# ✅ CHECKLIST TÉCNICO: Frontend Ready-to-Integrate

**Documento Rápido para Implementación Inmediata**  
**Fecha:** 26 de Marzo, 2026

---

## 🎯 LO QUE CAMBIÓ EN EL BACKEND

### Enum `followUpStatus`
```javascript
// ANTES (DEPRECATED)
'descartado' 

// AHORA (NUEVO)
'pendiente'   ← En espera de confirmación
'confirmado'  ← Cliente confirmó
'inactivo'    ← Proyecto descartado (era 'descartado')
```

---

## ⚡ CAMBIOS MÍNIMOS REQUERIDOS EN FRONTEND

### 1. Reemplazar "descartado" por "inactivo"
```typescript
// src/lib/kanban.ts
// CAMBIAR:
type FollowUpStatus = 'pendiente' | 'confirmado' | 'descartado';

// POR:
type FollowUpStatus = 'pendiente' | 'confirmado' | 'inactivo';
```

### 2. Actualizar componentes UI
```typescript
// Componentes que muestren status badges
const statusMap = {
  'pendiente': { color: 'yellow', label: 'Pendiente' },
  'confirmado': { color: 'green', label: 'Confirmado' },
  'inactivo': { color: 'gray', label: 'Inactivo' }  // ANTES: 'descartado'
};
```

### 3. Actualizar funciones de lógica
```typescript
// ANTES
function isTaskDiscarded(task) {
  return task.followUpStatus === 'descartado';
}

// AHORA
function isTaskInactive(task) {
  return task.followUpStatus === 'inactivo';
}
```

### 4. Actualizar constantes
```typescript
// ANTES
const VALID_FOLLOWUP_STATUS = ['pendiente', 'confirmado', 'descartado'];

// AHORA
const VALID_FOLLOWUP_STATUS = ['pendiente', 'confirmado', 'inactivo'];
```

---

## 🔌 ENDPOINTS DISPONIBLES (SIN CAMBIOS)

### Get Tareas
```bash
GET /api/tareas
GET /api/tareas?followUpStatus=inactivo
GET /api/tareas?followUpStatus=pendiente
GET /api/tareas?followUpStatus=confirmado
```

**Respuesta:** 
```json
{
  "success": true,
  "data": [
    {
      "followUpStatus": "inactivo",        // ← Cambia de 'descartado'
      "followUpEnteredAt": 1711446000000,  // ← Timestamp cuando entró a 'contrato'
      // ... otros campos
    }
  ]
}
```

### Create Tarea
```bash
POST /api/tareas
Body: {
  "etapa": "contrato",
  "followUpStatus": "pendiente",     // ← Usar 'inactivo' en lugar de 'descartado'
  "nombreProyecto": "...",
  // ... otros campos
}
```

### Update Tarea
```bash
PATCH /api/tareas/:id
Body: {
  "followUpStatus": "inactivo",      // ← Cambiar a 'inactivo'
  "estado": "completada"
}
```

---

## 🔄 COMPATIBILIDAD BACKWARD (IMPORTANTE)

✅ Si aún envías `"descartado"`:
```json
{
  "followUpStatus": "descartado"
}
```

✅ Backend automáticamente lo convierte a:
```json
{
  "followUpStatus": "inactivo"
}
```

**En logs verás:** `⚠️ Converting deprecated followUpStatus "descartado" to "inactivo"`

---

## 📋 INFORMACIÓN CLAVE PARA MOSTRAR

### Campo `followUpEnteredAt`
- **Qué es:** Timestamp (en milisegundos) cuando la tarea entró a etapa "contrato"
- **Cúando se asigna:** Backend automáticamente cuando `etapa` cambia a `"contrato"`
- **Para qué sirve:** Calcular cuántos días lleva en seguimiento

**Cálculo en Frontend:**
```javascript
const daysInFollowUp = (task) => {
  if (!task.followUpEnteredAt) return 0;
  const ms = Date.now() - task.followUpEnteredAt;
  return Math.floor(ms / (24 * 60 * 60 * 1000));
};
```

### Alertas (Basadas en `followUpEnteredAt`)
```javascript
const days = daysInFollowUp(task);

if (days >= 3 && days < 7) {
  showYellowAlert('Dar seguimiento'); // 3-6 días
}
if (days >= 7 && days < 10) {
  showRedAlert('URGENTE');            // 7-9 días
}
if (days >= 10) {
  // Backend ya lo inactivó automáticamente
  // Frontend muestra como 'inactivo'
}
```

---

## 🗂️ ARCHIVOS A ACTUALIZAR EN FRONTEND

| Archivo | Cambio |
|---------|--------|
| `src/lib/kanban.ts` | Cambiar tipo `FollowUpStatus` |
| `src/lib/admin-workflow.ts` | Actualizar mapeos de estado |
| `src/lib/axios/tareasApi.ts` | Actualizar tipos |
| `src/components/KanbanTablero.tsx` | Actualizar lógica y UI |
| `src/app/admin/operaciones/page.tsx` | Actualizar botones y acciones |
| `src/app/dashboard/clientes-en-proceso/page.tsx` | Actualizar filtros |
| `src/app/dashboard/proyectos-inactivos/page.tsx` | Cambiar ruta/componente para "inactivos" |
| Esquemas Zod | Actualizar enums en validaciones |

---

## 🧪 TESTS RÁPIDOS

### Test 1: Obtener inactivos
```bash
curl http://localhost:3001/api/tareas?followUpStatus=inactivo
# Debe retornar lista de tareas con followUpStatus='inactivo'
```

### Test 2: Crear con estado nuevo
```bash
curl -X POST http://localhost:3001/api/tareas \
  -H "Content-Type: application/json" \
  -d '{
    "etapa": "contrato",
    "nombreProyecto": "Test",
    "followUpStatus": "inactivo"
  }'
# Debe aceptar 'inactivo' sin errores
```

### Test 3: Compatibilidad backward
```bash
curl -X PATCH http://localhost:3001/api/tareas/{id} \
  -H "Content-Type: application/json" \
  -d '{"followUpStatus": "descartado"}'
# Respuesta debe tener 'inactivo', no 'descartado'
```

---

## ❌ PROBLEMAS COMUNES Y SOLUCIONES

### Problema: Validación falla con "inactivo"
**Solución:** Actualizar enum en schema Zod
```typescript
// ANTES
const followUpStatusEnum = z.enum(['pendiente', 'confirmado', 'descartado']);

// DESPUÉS
const followUpStatusEnum = z.enum(['pendiente', 'confirmado', 'inactivo']);
```

### Problema: `followUpEnteredAt` es null
**Solución:** Backend lo asigna automáticamente al cambiar etapa a "contrato"
```javascript
// Si es null, simplemente:
const days = task.followUpEnteredAt ? ... : 0;
```

### Problema: Interfaz muestra "descartado" en respuestas antiguas 
**Solución:** El backend SIEMPRE retorna "inactivo" (ya convertido), actualiza UI

### Problema: Botón "Descartar" aún existe
**Solución:** Cambiar label a "Marcar inactivo"
```typescript
// ANTES
<button>Descartar cliente</button>

// DESPUÉS
<button>Marcar inactivo</button>
```

---

## 📊 ESTADOS EN KANBAN

```
┌─────────────────────────────────────┐
│ ETAPA: Contrato                     │
├─────────────────────────────────────┤
│                                     │
│ PENDIENTE (yellow)                  │
│ ├─ 0-2 días: Sin alerta            │
│ ├─ 3-6 días: Alerta amarilla       │
│ ├─ 7-9 días: Alerta roja           │
│ └─ 10+ días: Auto-inactiva         │
│                                     │
│ ✅ CONFIRMADO (green)              │
│ └─ Cliente confirmó                │
│                                     │
│ ⚪ INACTIVO (gray)                 │
│ └─ Proyecto descartado             │
│                                     │
└─────────────────────────────────────┘
```

---

## ⏰ CRON JOB INFO

- **Qué hace:** Auto-inactiva tareas después de 10 días en "contrato" con status "pendiente"
- **Cuándo:** Diariamente a las 00:00 (medianoche)
- **Impacto:** 
  - `followUpStatus` → `"inactivo"`
  - `estado` → `"completada"`
  - Se registra en `historialCambios` con `by: "SYSTEM_AUTO_INACTIVATE"`

**Frontend debe estar preparado para ver cambios automáticos sin user action**

---

## 🚀 PASOS DE IMPLEMENTACIÓN

### Paso 1: Actualizar tipos (5 min)
```bash
# Buscar y reemplazar en todo el proyecto:
# "descartado" → "inactivo" (en tipos y enums)
```

### Paso 2: Actualizar componentes (15 min)
```bash
# Actualizar UI components para mostrar "inactivo"
# Actualizar botones de acción
# Actualizar colores/badges
```

### Paso 3: Actualizar lógica (10 min)
```bash
# Actualizar funciones que filtren por status
# Actualizar cálculos de alertas
# Actualizar queries a API
```

### Paso 4: Probar (10 min)
```bash
# Ejecutar tests
# Verificar endpoints
# Probar flujo completo
```

**Total Approx:** 40 minutos

---

## 🎯 VALIDACIÓN FINAL

Antes de desplegar:

- [ ] ¿Todos los `'descartado'` fueron reemplazados por `'inactivo'`?
- [ ] ¿Los tipos TypeScript están actualizados?
- [ ] ¿El UI muestra "Inactivo" en lugar de "Descartado"?
- [ ] ¿Los botones dicen "Marcar inactivo"?
- [ ] ¿Los filtros funcionan con `followUpStatus=inactivo`?
- [ ] ¿Se puede crear tarea con status 'inactivo'?
- [ ] ¿Se pueden actualizar a 'inactivo'?
- [ ] ¿Las alertas se calculan correctamente desde `followUpEnteredAt`?
- [ ] ¿El histórico muestra cambios automáticos del cron job?
- [ ] ¿La compatibilidad backward funciona (enviar 'descartado')?

---

## 📞 SOPORTE

Si algo no funciona:
1. Verifica los tipos en schemas Zod
2. Revisa que `followUpEnteredAt` existe en la respuesta
3. Comprueba los logs del servidor para errores
4. Consulta la guía completa: `FRONTEND_GUIA_INTEGRACION_FOLLOWUP_2026-03-26.md`

---

**Last Updated:** 26 de Marzo, 2026  
**Backend Status:** ✅ OPERACIONAL  
**Ready for Integration:** ✅ YES
