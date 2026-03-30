# ✅ LO QUE EL FRONTEND NECESITA SABER

**Documento específico sobre QUÉ NECESITA EL FRONTEND PARA FUNCIONAR**

---

## 🎯 LO MÁS IMPORTANTE

El backend cambió `'descartado'` a `'inactivo'`.

**El frontend DEBE:**
1. Usar `'inactivo'` en lugar de `'descartado'`
2. Conocer el campo `followUpEnteredAt`
3. Recibir cambios automáticos a los 10 días

---

## 📊 LO QUE CAMBIÓ

### Campo 1: `followUpStatus`
```
'pendiente'   → En espera
'confirmado'  → Confirmado
'inactivo'    → CAMBIÓ DE 'descartado'
```

### Campo 2: `followUpEnteredAt` (NUEVO)
```
- Es un timestamp en milisegundos
- Backend lo asigna automáticamente cuando entra a "contrato"
- Sirve para calcular alertas (3, 7, 10 días)
- Necesitas guardarlo y usarlo
```

### Sistema 3: Auto-inactivación (NUEVO COMPORTAMIENTO)
```
- Cada día a las 00:00, backend inactiva tareas
- Si están 10+ días en "contrato" con status "pendiente"
- Cambios aparecen en historialCambios
- Frontend debe estar preparado para verlos
```

---

## 🔄 COMPATIBILIDAD BACKWARD

**Si tu código aún envía `'descartado'`:**
```
Frontend envía: 'descartado'
Backend recibe: 'descartado'
Backend convierte a: 'inactivo'
Backend retorna: 'inactivo'
```

✅ **Funciona sin cambios**, pero deberías actualizar a `'inactivo'` eventualmente.

---

## 💻 CAMBIOS MÍNIMOS EN CÓDIGO

### 1. Actualizar tipos
```typescript
// Archivo: src/lib/kanban.ts (o similar)
// Cambiar:
type FollowUpStatus = 'pendiente' | 'confirmado' | 'descartado';

// Por:
type FollowUpStatus = 'pendiente' | 'confirmado' | 'inactivo';
```

### 2. Actualizar componentes
```typescript
// En cualquier lugar que muestres el status:
// Cambiar color/icono para 'descartado' a 'inactivo'
const statusColors = {
  'pendiente': 'yellow',
  'confirmado': 'green',
  'inactivo': 'gray',  // CAMBIO aquí
};
```

### 3. Actualizar filtros
```typescript
// Si tienes un filtro por status:
// Cambiar 'descartado' a 'inactivo'
const statusOptions = [
  { label: 'Pendiente', value: 'pendiente' },
  { label: 'Confirmado', value: 'confirmado' },
  { label: 'Inactivo', value: 'inactivo' },  // CAMBIO aquí
];
```

### 4. Actualizar funciones
```typescript
// Si tienes funciones que verifiquen el status:
// Cambiar 'descartado' a 'inactivo'
function isInactive(task) {
  return task.followUpStatus === 'inactivo';  // CAMBIO aquí
}
```

---

## 📡 CÓMO USAR LA API

### Obtener tareas normales
```
GET /api/tareas
Retorna todas las tareas
```

### Obtener solo tareas inactivas
```
GET /api/tareas?followUpStatus=inactivo
```

### Actualizar a inactivo
```
PATCH /api/tareas/{id}
Body: { "followUpStatus": "inactivo" }
```

### Crear con status inactivo
```
POST /api/tareas
Body: { 
  "nombreProyecto": "...",
  "followUpStatus": "inactivo"
}
```

---

## ⏰ TIMELINE DE ALERTAS

**Frontend DEBE mostrar alertas en estos momentos:**

```
Días en seguimiento → Qué mostrar
─────────────────────────────────
0-2 días           → Nada
3-6 días           → 🟡 Alerta amarilla "Dar seguimiento"
7-9 días           → 🔴 Alerta roja "URGENTE"
10+ días           → Ya está inactivo (backend lo cambió)
```

### Cómo calcular:
```typescript
const daysInFollowUp = (task) => {
  if (!task.followUpEnteredAt) return 0;
  return Math.floor(
    (Date.now() - task.followUpEnteredAt) / (24 * 60 * 60 * 1000)
  );
};

const days = daysInFollowUp(task);
if (days >= 3 && days < 7) showYellowAlert();
if (days >= 7 && days < 10) showRedAlert();
```

---

## 🤖 LO QUE OCURRE AUTOMÁTICAMENTE

### Cambio 1: Asignación de timestamp
**Cuándo:** Al cambiar `etapa` a `"contrato"`
**Qué:** Backend asigna `followUpEnteredAt = Date.now()`
**Impacto:** Frontend recibe timestamp sin enviarlo

### Cambio 2: Auto-inactivación
**Cuándo:** Diariamente a las 00:00
**Si:** Tarea en "contrato" + "pendiente" + 10+ días
**Qué:** Backend cambia a "inactivo" y "completada"
**Impacto:** Frontend ve cambios sin user action

### Cambio 3: Conversión de estado
**Cuándo:** Siempre que recibe `'descartado'`
**Qué:** Backend convierte a `'inactivo'`
**Impacto:** Frontend siempre recibe `'inactivo'`

---

## 🧪 VERIFICACIÓN RÁPIDA

Frontend debe poder:

- ✅ Mostrar tareas con status `'inactivo'`
- ✅ Crear tareas con status `'inactivo'`
- ✅ Actualizar a status `'inactivo'`
- ✅ Filtrar por `followUpStatus=inactivo`
- ✅ Calcular alertas desde `followUpEnteredAt`
- ✅ Ver cambios automáticos en historial
- ✅ Recibir timestamp `followUpEnteredAt` en respuestas
- ✅ Funcionar con compatibilidad backward (`'descartado'`)

---

## 📋 ARCHIVOS A ACTUALIZAR

En tu proyecto frontend, busca y actualiza:

- [ ] Tipos TypeScript (kanban.ts, workflow.ts, etc.)
- [ ] Componentes que muestren status (badges, icons)
- [ ] Funciones de filtrado
- [ ] Validaciones de enums (Zod)
- [ ] Mapeos de colores/labels
- [ ] Lógica de alertas
- [ ] Constants de estados válidos

---

## 🔗 ENDPOINTS DISPONIBLES

```
GET /api/tareas
GET /api/tareas/{id}
GET /api/tareas?followUpStatus=inactivo
GET /api/tareas?followUpStatus=pendiente
GET /api/tareas?followUpStatus=confirmado
POST /api/tareas
PATCH /api/tareas/{id}
PUT /api/tareas/{id}
```

**Todos funcionan igual que antes, solo que ahora:**
- ✅ Usan `'inactivo'` en lugar de `'descartado'`
- ✅ Incluyen `followUpEnteredAt` automáticamente
- ✅ Aceptan cambios automáticos del sistema

---

## ❓ PREGUNTAS RÁPIDAS

**P: ¿Debo actualizar AHORA?**  
R: No es urgente si usas compatibilidad backward. ✅ Pero se recomienda pronto.

**P: ¿Qué pasa si no actualizo?**  
R: Funcionará con `'descartado'`, pero recibirás `'inactivo'` de vuelta.

**P: ¿Cuánto tarda?**  
R: ~40 minutos de implementación.

**P: ¿Se pierde datos?**  
R: No. Cambios históricos se mantienen en `historialCambios`.

**P: ¿El cron job puede desactivarse?**  
R: No desde frontend. Contacta a backend si lo necesitas.

**P: ¿Qué pasa a las 00:00 y nadie está usando app?**  
R: Backend lo hace de todas formas. Frontend verá cambios al refresca.

---

## 🚨 ERRORES COMUNES A EVITAR

### ❌ NUNCA hagas esto:

```typescript
// ❌ Mostrar 'descartado' en la UI
<span>{task.followUpStatus}</span>

// ❌ Esperar que recibirás el mismo valor que enviaste
send('descartado'); // NO, recibirás 'inactivo'

// ❌ No refrescar después de cambios
updateStatus(id, 'inactivo');
display(task);  // STALE DATA

// ❌ No calcular alertas correctamente
// Debes usar followUpEnteredAt

// ❌ Olvidar que followUpEnteredAt puede venir en respuestas
// Aunque no lo enviaste

// ❌ Assumir que un proyecto nunca cambiará solo
// El cron job LO HACE automáticamente
```

### ✅ SIEMPRE haz esto:

```typescript
// ✅ Mapea valores antes de UI
const displayStatus = mapStatus(task.followUpStatus);

// ✅ Refresca después de cambios
const result = await updateStatus(id, status);
const updated = await getTask(id);

// ✅ Calcula alertas correctamente
const days = (Date.now() - task.followUpEnteredAt) / (24*60*60*1000);

// ✅ Prepárate para cambios automáticos
setInterval(() => refreshTasks(), 5 * 60 * 1000);

// ✅ Valida un solo valor que sea verdadero
const validStatus = ['pendiente', 'confirmado', 'inactivo'];
if (!validStatus.includes(status)) throw error;
```

---

## 💾 RESUMEN PARA GUARDAR

| Concepto | Detalles |
|----------|----------|
| **Cambio Principal** | `'descartado'` → `'inactivo'` |
| **Nuevo Campo** | `followUpEnteredAt` (timestamp ms) |
| **Auto-inactivación** | 10+ días con "pendiente" |
| **Compatibilidad** | Backend convierte `'descartado'` → `'inactivo'` |
| **Trabajo** | ~40 minutos |
| **Urgencia** | No es inmediato, pero recomendado |
| **Riesgo** | Bajo (backward compatible) |
| **Pruebas** | Sí, validar todos los estados |

---

## 🚀 PASOS FINALES

1. ✅ Lee este documento (5 min)
2. ✅ Actualiza tipos (5 min)
3. ✅ Actualiza componentes (15 min)
4. ✅ Actualiza lógica (10 min)
5. ✅ Prueba todo (10 min)
6. ✅ Deploy (5 min)

**Total: ~50 minutos**

---

## 📞 SOPORTE

Si algo no funciona:
1. Verifica qué valor está llegando desde API
2. Confirma que `followUpEnteredAt` existe
3. Revisa que tipos estén actualizados
4. Busca en los logs más documentación

---

**Backend:** ✅ LISTO  
**Frontend:** ⏳ A IMPLEMENTAR  
**Tiempo Estimado:** 40 min  

¡Adelante! 🚀
