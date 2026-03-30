# Resumen de Cambios Front-Back Funcionales

Fecha: 2026-03-22
Autor: GitHub Copilot (GPT-5.3-Codex)
Estado: Implementado en frontend y listo para validacion con backend

## 1) Objetivo

Este documento resume los cambios funcionales ya implementados en frontend para que backend pueda validar contrato, sincronizacion y persistencia sin ambiguedad.

## 2) Cambios principales implementados

### 2.1 Contrato canonico Cita <-> Tarea

Se estandarizo el uso de:

- `sourceType`
- `sourceId`
- `cita` embebida en la tarjeta

Archivos clave:

- `src/lib/admin-workflow.ts`
- `src/lib/axios/tareasApi.ts`
- `src/lib/axios/adminWorkflowApi.ts`
- `src/contexts/AdminWorkflowContext.tsx`

Comportamiento esperado:

- Si la tarjeta proviene de cita, debe mapearse por `sourceType="cita"` + `sourceId=<citaId>`.
- La UI deja de depender de `titulo` como obligatorio.
- En updates de cita, `informacionAdicional` se llena con prioridad desde edicion (`title/notes`) para mantener consistencia visual en panel.

### 2.2 Flujo de cita a cotizador preliminar

Implementado en admin y empleado:

- `Iniciar cita` abre `/dashboard/cotizador-preliminar`.
- Se guarda contexto de tarea activa para terminar/continuar flujo.

Archivos clave:

- `src/app/admin/operaciones/page.tsx`
- `src/app/dashboard/empleado/page.tsx`
- `src/app/dashboard/cotizador-preliminar/page.tsx`

### 2.3 Eliminacion de dependencias runtime en localStorage

Se migro la mayor parte del runtime a almacenamiento en memoria:

- `src/lib/runtime-store.ts`

Y se conecto en modulos criticos:

- auth (`authApi`, `axiosConfig`)
- tablero/kanban
- cotizador preliminar
- secciones de agenda/seguimiento relacionadas

Nota:

- Este store es en memoria de ejecucion (se pierde al recargar pagina, por diseno actual).

### 2.4 Cotizador preliminar: seccion de tipos de paredes

Se agrego soporte completo de paredes con impacto en precio y persistencia en payload/PDF.

Modelo:

- `PreliminarWallType`
- `PreliminarWallSpec`
- `wallSpecs`
- `wallCostEstimate`

Archivos:

- `src/lib/kanban.ts`
- `src/app/dashboard/cotizador-preliminar/page.tsx`
- `src/lib/pdf-preliminar.ts`

Reglas actuales frontend:

- Multiples paredes por cotizacion.
- Unidades en cm.
- Validaciones por pared.
- Costo por paredes se integra al subtotal/rango.
- PDF muestra resumen, detalle y costo estimado de paredes.

### 2.5 Aprobacion de diseño con agenda de visita (nueva funcionalidad)

Implementado en ambos paneles solicitados:

- `admin/disenos`
- `admin/operaciones`

Comportamiento:

- Al dar `Aprobar` diseño (admin), se abre modal de agenda de visita.
- Modal agenda fecha/hora disponible.
- Disponibilidad se calcula con horarios ocupados de otras tareas (`visitScheduledAt`, `scheduledAt`, `cita.fechaAgendada`).
- Si cierran modal sin guardar:
  - la aprobacion admin se conserva
  - aparece estado `Falta agendar visita`
- La tarea permanece en etapa `disenos` (sin crear nueva columna).
- Se mantiene boton/flujo de aprobacion cliente.

Archivos:

- `src/components/admin/VisitScheduleModal.tsx` (nuevo)
- `src/app/admin/disenos/page.tsx`
- `src/app/admin/operaciones/page.tsx`
- `src/lib/kanban.ts` (campo nuevo `visitScheduledAt`)
- `src/lib/admin-workflow.ts` (mapeo y payload)

### 2.6 Asignacion de tareas a uno o mas empleados (nueva mejora)

Implementado en `admin/operaciones`:

- Al crear pendiente: permite seleccionar 1 o mas responsables.
- Al editar tarea: permite seleccionar 1 o mas responsables.
- Persistencia enviada en `asignadoA`/`assignedToIds` como arreglo.

Archivo:

- `src/app/admin/operaciones/page.tsx`

Extension implementada para disenos:

- `admin/disenos` ahora permite asignar uno o mas responsables por tarjeta de diseño.
- Se persiste en `assignedToIds` y `assignedTo` via `updateTask`.

Archivo:

- `src/app/admin/disenos/page.tsx`

Limitacion actual en agenda (citas):

- `admin/agenda` usa `PUT /api/citas/:id/asignarIngeniero` con `ingenieroId` unico.
- Sin cambio backend en ese endpoint, agenda no puede persistir multi-responsable real.

## 3) Campos nuevos/actualizados para backend

### 3.1 En tarea (frontend)

- `visitScheduledAt?: string` (ISO datetime)

### 3.2 En preliminar

- `wallSpecs?: PreliminarWallSpec[]`
- `wallCostEstimate?: number`

### 3.3 En asignacion

- `asignadoA` ahora se usa como arreglo multi-responsable en create/update.

## 4) Endpoints involucrados en la operacion actual

- `POST /api/citas/agregarCita`
- `PUT /api/citas/:id/asignarIngeniero`
- `PUT /api/citas/actualizarCita/:id`
- `PUT /api/citas/updateEstado/:id`
- `GET /api/kanban/citas`
- `GET /api/kanban/disenos`
- `GET /api/kanban/cotizacion`
- `GET /api/kanban/contrato`
- `PATCH /api/tareas/:id`
- `PATCH /api/tareas/:id/etapa`
- `PATCH /api/tareas/:id/estado`
- `POST /api/workflow/citas/:id/promover`
- `GET /api/usuarios` (fuente principal para asignaciones)

## 5) Requisitos backend para que todo opere correctamente

1. Aceptar y persistir `asignadoA` como arreglo de IDs (uno o mas).
2. Aceptar/persistir `visitScheduledAt` en updates de tarea.
3. Mantener serializacion consistente de `sourceType`, `sourceId`, `cita` en tarjetas.
4. Mantener sincronizacion Cita -> Tarea al editar cita/estado/asignacion.
5. Aceptar `wallSpecs` y `wallCostEstimate` dentro de datos preliminares guardados en tarjeta/proyecto.
6. Si se quiere multi-responsable tambien en agenda de citas, extender `asignarIngeniero` para aceptar arreglo (ej. `ingenieroIds`).
7. Mantener respuesta uniforme tipo:
   - `{ success: boolean, data?: any, message?: string }`

## 6) Validacion recomendada (QA)

1. Crear tarea desde operaciones con 2 empleados y confirmar persistencia tras refresh.
2. Editar tarea y agregar/quitar responsables multiples.
3. Asignar responsables multiples desde `admin/disenos` y confirmar persistencia tras refresh.
4. Aprobar diseño y agendar visita; validar bloqueo de horario ocupado.
5. Cerrar modal sin guardar y confirmar badge `Falta agendar visita`.
6. Guardar visita y confirmar visualizacion de fecha/hora de visita.
7. En preliminar, capturar paredes, guardar, y validar PDF/payload con detalle de paredes.

## 7) Archivos de referencia de esta entrega

- `src/app/admin/operaciones/page.tsx`
- `src/app/admin/disenos/page.tsx`
- `src/components/admin/VisitScheduleModal.tsx`
- `src/lib/admin-workflow.ts`
- `src/lib/kanban.ts`
- `src/app/dashboard/cotizador-preliminar/page.tsx`
- `src/lib/pdf-preliminar.ts`
- `src/lib/runtime-store.ts`

## 8) Documento complementario (upload Dropbox)

Para la parte de subida de archivos y contrato requerido de backend para Dropbox:

- `docs/REQUERIMIENTOS_BACKEND_UPLOAD_DROPBOX_2026-03-22.md`
