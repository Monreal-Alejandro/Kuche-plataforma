# Frontend Integration - Citas registradas como Tareas (Admin y Empleados)

Fecha: 2026-03-22
Estado: ACTIVO

## 1) Objetivo

Este documento define el contrato actual para frontend sobre:

- Como registrar una cita publica.
- Como esa cita se sincroniza automaticamente en `Tarea`.
- Como mostrarla en panel de Admin y Empleados (ingeniero/arquitecto).
- Campos reales del modelo actual (`Tarea`) y respuestas reales del API.

Importante:

- Ya NO existe `titulo` en `Tarea`.
- El frontend debe usar `cita.nombreCliente`, `cita.fechaAgendada`, etc., para render en UI.

## 2) Flujo actual (end-to-end)

1. Frontend publico agenda cita en `POST /api/citas/agregarCita`.
2. Backend crea registro en `Citas`.
3. Backend sincroniza automaticamente una `Tarea` con:
- `etapa = "citas"`
- `estado = "pendiente"` (mientras la cita no este completada)
- `sourceType = "cita"`
- `sourceId = <id de la cita>`
- `cita` (objeto embebido con datos del formulario)
4. Panel admin/empleados lee tarjetas desde `kanban` o `tareas`.

## 3) Endpoint publico para agendar cita

## `POST /api/citas/agregarCita`

Headers requeridos:

- `captcha-token` (tambien se acepta `captchatoken` y `x-captcha-token`)
- `Content-Type: application/json`

Body esperado:

```json
{
  "fechaAgendada": "2026-03-25T17:00:00.000Z",
  "nombreCliente": "Cliente Demo",
  "correoCliente": "cliente@correo.com",
  "telefonoCliente": "6181234567",
  "ubicacion": "Durango Capital",
  "informacionAdicional": "Horario solicitado: 11:00"
}
```

Respuesta exitosa:

```json
{
  "success": true,
  "data": {
    "_id": "citaId",
    "fechaAgendada": "2026-03-25T17:00:00.000Z",
    "nombreCliente": "Cliente Demo",
    "correoCliente": "cliente@correo.com",
    "telefonoCliente": "6181234567",
    "ubicacion": "Durango Capital",
    "informacionAdicional": "Horario solicitado: 11:00",
    "estado": "programada"
  },
  "message": "Cita creada exitosamente"
}
```

Notas de validacion relevantes:

- Solo dias habiles (lunes a viernes).
- Solo horario 9:00 a 18:00 (hora Mexico).
- Minimo 1 hora de anticipacion.
- Buffer de 1 hora entre citas.

## 4) Como queda la Tarea sincronizada (modelo real)

Coleccion: `Tarea` (`src/models/tarea.model.js`)

Campos clave actuales:

- `_id`
- `etapa`: `citas | disenos | cotizacion | contrato`
- `estado`: `pendiente | completada`
- `asignadoA`: `string[]`
- `asignadoANombre`: `string[]`
- `proyectoId`: `string | null`
- `nombreProyecto`: `string`
- `notas`: `string`
- `prioridad`: `alta | media | baja`
- `followUpEnteredAt`: `number | null`
- `followUpStatus`: `pendiente | confirmado | descartado`
- `citaStarted`: `boolean`
- `citaFinished`: `boolean`
- `designApprovedByAdmin`: `boolean`
- `designApprovedByClient`: `boolean`
- `sourceType`: `cita | diseno | null`
- `sourceId`: `string | null`
- `cita`: objeto
- `archivos`: arreglo
- `createdAt`, `updatedAt`

Objeto `cita`:

- `fechaAgendada`
- `nombreCliente`
- `correoCliente`
- `telefonoCliente`
- `ubicacion`
- `informacionAdicional`

## 5) Comportamiento de asignacion en citas

Cuando se registra una cita nueva:

- `asignadoA = []`
- `asignadoANombre = []`

Despues, Admin puede asignar ingeniero con:

- `PUT /api/citas/:id/asignarIngeniero`

Al asignar/quitar ingeniero, la `Tarea` sincronizada se actualiza automaticamente.

## 6) Endpoints para mostrar panel (recomendado)

Todos requieren autenticacion (`authRequired`).

## Kanban por columnas

- `GET /api/kanban/citas`
- `GET /api/kanban/disenos`
- `GET /api/kanban/cotizacion`
- `GET /api/kanban/contrato`

Query opcional:

- `?estado=pendiente|completada`

Respuesta (shape de tarjeta actual):

```json
{
  "success": true,
  "data": [
    {
      "_id": "taskId",
      "etapa": "citas",
      "estado": "pendiente",
      "asignadoA": [],
      "asignadoANombre": [],
      "nombreProyecto": "",
      "notas": "Horario solicitado: 11:00",
      "prioridad": "media",
      "followUpEnteredAt": null,
      "followUpStatus": "pendiente",
      "citaStarted": false,
      "citaFinished": false,
      "designApprovedByAdmin": false,
      "designApprovedByClient": false,
      "sourceType": "cita",
      "sourceId": "citaId",
      "cita": {
        "fechaAgendada": "2026-03-25T17:00:00.000Z",
        "nombreCliente": "Cliente Demo",
        "correoCliente": "cliente@correo.com",
        "telefonoCliente": "6181234567",
        "ubicacion": "Durango Capital",
        "informacionAdicional": "Horario solicitado: 11:00"
      },
      "createdAt": "2026-03-22T20:00:00.000Z",
      "updatedAt": "2026-03-22T20:00:00.000Z"
    }
  ]
}
```

## Fallback equivalente por tareas

- `GET /api/tareas?etapa=citas`

Tambien soporta filtros:

- `estado`
- `asignadoA`
- `proyecto`
- `prioridad`
- `followUpStatus`

## 7) Reglas por rol en panel

Reglas actuales implementadas:

- `admin`: ve y edita todas las tareas.
- `arquitecto`: ve y edita todas las tareas (staff).
- `ingeniero`:
- En listados (`/api/kanban/*` y `/api/tareas`), solo ve tareas asignadas a su usuario si no envia `asignadoA`.
- En detalle/edicion (`/api/tareas/:id`), solo puede ver/editar tareas donde su id esta en `asignadoA`.

## 8) Operaciones de tablero sobre tarea

- Cambiar etapa: `PATCH /api/tareas/:id/etapa`
- Cambiar estado: `PATCH /api/tareas/:id/estado`
- Actualizar tarjeta: `PATCH /api/tareas/:id`

Campos utiles para update:

```json
{
  "etapa": "citas",
  "estado": "pendiente",
  "asignadoA": ["adminOrEngineerId"],
  "notas": "Texto",
  "prioridad": "media",
  "followUpStatus": "pendiente",
  "followUpEnteredAt": null,
  "sourceType": "cita",
  "sourceId": "citaId",
  "cita": {
    "fechaAgendada": "2026-03-25T17:00:00.000Z",
    "nombreCliente": "Cliente Demo",
    "correoCliente": "cliente@correo.com",
    "telefonoCliente": "6181234567",
    "ubicacion": "Durango Capital",
    "informacionAdicional": "Horario solicitado: 11:00"
  }
}
```

## 9) Promocion de cita a otras etapas

Endpoint recomendado para flujo transaccional:

- `POST /api/workflow/citas/:id/promover`

Body:

```json
{
  "etapaDestino": "disenos"
}
```

Efecto:

- Marca cita como completada.
- Mueve/crea tarea asociada en etapa destino.
- Mantiene `sourceType = "cita"` y `sourceId`.

## 10) Cambios importantes para frontend (breaking)

1. El campo `titulo` en tarjetas de `Tarea` fue eliminado.
2. La UI debe renderizar con campos reales:
- Nombre cliente: `item.cita?.nombreCliente`
- Fecha: `item.cita?.fechaAgendada`
- Telefono: `item.cita?.telefonoCliente`
- Ubicacion: `item.cita?.ubicacion`
- Notas: `item.cita?.informacionAdicional` o `item.notas`
3. Trazabilidad actual:
- Canonico: `sourceType` + `sourceId`
- Legacy temporal (solo compatibilidad): `sourceCitaId` / `sourceDisenoId`

## 11) Checklist de integracion frontend

- [ ] En agendar cita, enviar header `captcha-token`.
- [ ] No crear tarea manual al agendar cita; backend la sincroniza solo.
- [ ] Consumir columnas con `GET /api/kanban/citas` para panel.
- [ ] Remover dependencia de `titulo` en tarjetas.
- [ ] Mostrar datos usando `item.cita.*`.
- [ ] Para ingeniero, considerar que solo vera tarjetas asignadas.
- [ ] Para asignar empleado a cita, usar `PUT /api/citas/:id/asignarIngeniero`.
- [ ] Para mover a diseno/cotizacion/contrato, usar `POST /api/workflow/citas/:id/promover`.
