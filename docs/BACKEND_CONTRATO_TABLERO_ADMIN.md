# Contrato Backend esperado para tablero Admin

Fecha: 2026-03-17

## Objetivo funcional

El tablero admin debe soportar este flujo completo:

1. **Cita registrada** en etapa `citas`.
2. Se puede **asignar empleado**, cambiar **estado** y **prioridad**, y marcar **completada**.
3. Al salir de `citas`, debe pasar a **`disenos`**.
4. Después debe pasar a **`cotizacion`** (cotización formal), donde se puede marcar completada y agendar visita de diseño.
5. Finalmente pasa a **`contrato`/seguimiento**.
6. En seguimiento debe existir aviso cuando un proyecto lleve **3 días sin cambios**.

---

## Endpoints mínimos requeridos

## 1) Lectura de tablero por columnas

### GET /api/kanban/citas
### GET /api/kanban/disenos
### GET /api/kanban/cotizacion
### GET /api/kanban/contrato

**Respuesta esperada**:

```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "titulo": "...",
      "etapa": "citas|disenos|cotizacion|contrato",
      "estado": "pendiente|completada",
      "asignadoA": ["userId"],
      "asignadoANombre": ["Nombre"],
      "nombreProyecto": "...",
      "notas": "...",
      "prioridad": "alta|media|baja",
      "followUpEnteredAt": 1710000000000,
      "followUpStatus": "pendiente|confirmado|descartado",
      "citaStarted": true,
      "citaFinished": false,
      "designApprovedByAdmin": false,
      "designApprovedByClient": false,
      "createdAt": "2026-03-17T00:00:00.000Z",
      "updatedAt": "2026-03-17T00:00:00.000Z"
    }
  ]
}
```

Notas:
- Si el backend no usa estos 4 endpoints, al menos debe existir `GET /api/tareas?etapa=...` por cada columna.
- Es obligatorio retornar `etapa` y `estado` para render y drag/drop.

---

## 2) Gestión de tareas Kanban (no-citas)

### PATCH /api/tareas/:id/etapa
Body:
```json
{ "etapa": "citas|disenos|cotizacion|contrato" }
```

### PATCH /api/tareas/:id/estado
Body:
```json
{ "estado": "pendiente|completada" }
```

### PATCH /api/tareas/:id
Body parcial (campos editables en UI):
```json
{
  "titulo": "...",
  "asignadoA": ["userId"],
  "notas": "...",
  "prioridad": "alta|media|baja",
  "followUpStatus": "pendiente|confirmado|descartado",
  "followUpEnteredAt": 1710000000000
}
```

### POST /api/tareas
Crea tarjeta nueva o tarjeta promovida desde cita.

### DELETE /api/tareas/:id
Elimina tarjeta de tablero.

---

## 3) Gestión de citas (etapa inicial)

### GET /api/citas/getAllCitas
Debe devolver todas las citas para construir tarjetas en `citas`.

### PUT /api/citas/:id/asignarIngeniero
Body:
```json
{ "ingenieroId": "userId" }
```

### PUT /api/citas/updateEstado/:id
Body:
```json
{ "estado": "programada|en_proceso|completada|cancelada" }
```

### PUT /api/citas/actualizarCita/:id
Permite editar datos de cliente y metadata de cita.

### DELETE /api/citas/eliminarCita/:id
Eliminar cita.

---

## 4) Regla de transición: cita -> diseños

Actualmente, frontend promueve una cita a tarea cuando se arrastra fuera de `citas`.

Comportamiento esperado:
1. Crear tarea en `POST /api/tareas` con etapa destino (`disenos` normalmente).
2. Marcar cita fuente como `completada` en `/api/citas/updateEstado/:id`.

## Recomendación backend (ideal)
Crear endpoint transaccional único:

### POST /api/workflow/citas/:id/promover
Body:
```json
{ "etapaDestino": "disenos" }
```

Respuesta:
- Marca cita completada.
- Crea tarea hija enlazada.
- Devuelve ambos recursos para evitar estados intermedios.

---

## 5) Seguimiento y alerta de 3 días

Para alertas de seguimiento se requiere fecha de última actividad por tarjeta. Puede ser:
- `followUpEnteredAt` (timestamp ms), o
- `updatedAt`.

Regla funcional:
- Si tarjeta en `contrato` lleva más de **3 días** sin cambios y `followUpStatus = pendiente`, se considera alerta.

## Recomendación backend
Agregar endpoint para evitar cálculo en frontend:

### GET /api/kanban/seguimiento/alertas?dias=3
Respuesta:
```json
{ "success": true, "data": { "count": 4, "ids": ["..."] } }
```

---

## 6) Validaciones requeridas

- Validar enums de `etapa`, `estado`, `prioridad`, `followUpStatus`.
- Validar existencia de usuario en asignaciones.
- Evitar mover tarjetas a etapas inválidas.
- Registrar historial de cambios (quién/qué/cuándo).

---

## 7) Errores esperados

Formato unificado:

```json
{
  "success": false,
  "message": "Descripción clara",
  "error": "Detalle técnico opcional"
}
```

Códigos sugeridos:
- `400` body inválido
- `401/403` permisos
- `404` recurso no encontrado
- `409` conflicto de transición
- `500` error interno

---

## Resumen de funciones obligatorias por historia de usuario

- Asignar empleado a cita/tarea.
- Cambiar estado y prioridad de tarjeta.
- Marcar tarea/cita como completada.
- Mover etapa por drag/drop.
- Promover cita a diseños.
- Avanzar a cotización formal.
- Avanzar a seguimiento.
- Detectar inactividad de 3 días en seguimiento.
