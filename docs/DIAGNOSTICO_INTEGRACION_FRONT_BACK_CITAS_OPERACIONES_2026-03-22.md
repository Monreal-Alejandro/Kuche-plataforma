# Diagnostico Integracion Front-Back (Citas, Tareas y Panel Operaciones)

Fecha: 2026-03-22
Autor: GitHub Copilot (GPT-5.3-Codex)
Estado: En validacion con backend

## 1) Contexto

Se ajusto el frontend para consumir el contrato nuevo donde la cita publica se sincroniza automaticamente en `Tarea` y el tablero opera sobre datos canonicamente trazados por `sourceType` + `sourceId`.

Objetivo operativo:
- Registrar cita publica con captcha.
- Visualizar tarjetas en panel admin y empleado con datos `item.cita.*`.
- Permitir asignacion desde admin.
- Mantener flujo de estado/etapa funcional.

## 2) Cambios implementados en frontend

### 2.1 Mapeo canónico de tarjetas y payloads

Archivo: `src/lib/admin-workflow.ts`

Hecho:
- Se agrego soporte formal a `sourceType`, `sourceId` y `cita` embebida.
- Se detecta tarjeta de cita por contrato canonico y por compatibilidad legacy.
- Se remueve dependencia dura de `titulo` para render/update (ahora es opcional).
- En updates de tarea se envia `sourceType/sourceId/cita` cuando aplica.

Impacto:
- Render y persistencia compatibles con backend actual de `Tarea`.

### 2.2 Tipado alineado al backend actual

Archivo: `src/lib/axios/tareasApi.ts`

Hecho:
- `titulo` pasa a opcional.
- Se agregan campos `sourceType`, `sourceId`, `sourceCitaId`, `sourceDisenoId`, `cita`.
- Se agregan tipos `SourceTypeTarea` y `CitaTarea`.

Impacto:
- Se evita romper front cuando backend no manda `titulo`.

### 2.3 Flujo de promocion cita -> etapa destino

Archivo: `src/lib/axios/adminWorkflowApi.ts`

Hecho:
- Promocion usa `sourceId` canonico como ID de cita.
- Fallback legacy conservado.

Impacto:
- Menor riesgo de usar IDs incorrectos al promover.

### 2.4 Update de cita priorizando edicion de titulo/notas

Archivo: `src/contexts/AdminWorkflowContext.tsx`

Hecho:
- En `updateTask` para citas, `cita.informacionAdicional` prioriza:
  1) `patch.title`
  2) `patch.notes`
  3) valor merged existente.
- Se mantiene actualizacion de asignacion (`ingenieroId`) en el mismo flujo.

Impacto:
- Cambios del modal lateral se reflejan en la cita sincronizada.

### 2.5 Modal lateral de operaciones restaurado y funcional

Archivo: `src/app/admin/operaciones/page.tsx`

Hecho:
- Se restauro modal lateral con edicion completa:
  - Etapa, estado, prioridad
  - Responsable
  - Titulo
  - Proyecto/cliente
  - Fecha limite
  - Direccion/localidad
  - Maps URL
  - Notas
- Guardado vuelve a pegar al backend con `updateTask`.

Impacto:
- Se recupera flujo de operacion esperado por admin.

### 2.6 Lista de usuarios para asignacion (todos los roles activos)

Archivo: `src/app/admin/operaciones/page.tsx`

Hecho:
- Se cambia fuente principal a `listarUsuarios()` (`GET /api/usuarios`), con fallback a `listarEmpleados()`.
- Se filtran usuarios activos (`activo !== false`).

Impacto:
- El selector de responsable ya no depende solo de `/api/usuarios/empleados`.
- Permite delegar tareas a usuarios de diferentes roles (segun backend devuelva).

## 3) Inquietudes reportadas y diagnostico

### 3.1 "Solo veo admins para asignar"

Diagnostico:
- Antes el panel consumia `GET /api/usuarios/empleados` exclusivamente.
- Si backend filtra incorrectamente ese endpoint, el front solo ve admins.

Accion front aplicada:
- Cambio a `GET /api/usuarios` con fallback.

Validacion pendiente backend:
- Confirmar que `/api/usuarios` devuelve todos los roles esperados (`admin`, `arquitecto`, `empleado` o `ingeniero`) con `activo=true`.

### 3.2 "No cambia estatus o datos"

Diagnostico probable (pueden coexistir):
- El backend puede rechazar parcialmente updates por validaciones o diferencias de contrato.
- Algunos endpoints de cita y tarea tienen rutas distintas y respuestas heterogeneas.
- Posible mismatch de roles (`empleado` en frontend vs `ingeniero` en algunas reglas backend/documentacion).
- Si backend no sincroniza correctamente Cita -> Tarea en updates, el panel puede refrescar y mostrar valor antiguo.

Accion front aplicada:
- Ajuste de payloads canonicamente alineados y refresco tras cada update.
- Priorizacion de `title/notes` al actualizar `cita.informacionAdicional`.

## 4) Requisitos de backend para garantizar funcionamiento correcto

Se requiere confirmar/ajustar lo siguiente:

1. Usuarios para asignacion
- Endpoint recomendado: `GET /api/usuarios`.
- Debe devolver todos los usuarios activos asignables en tablero, no solo admins.
- Debe incluir `_id`, `nombre`, `rol`, `activo`.

2. Consistencia de roles
- Definir y unificar enum de rol en backend y frontend.
- Actualmente el frontend tipa `admin | arquitecto | empleado`, pero documentacion tambien menciona `ingeniero`.
- Recomendado: mapear `ingeniero` <-> `empleado` o unificar definitivamente en ambos lados.

3. Update de cita en operaciones
- Endpoint: `PUT /api/citas/actualizarCita/:id` debe aceptar y persistir:
  - `nombreCliente`
  - `informacionAdicional`
  - `ubicacion`
- Endpoint: `PUT /api/citas/:id/asignarIngeniero` debe aceptar:
  - `{ ingenieroId?: string }`
  - permitir desasignar con `ingenieroId` ausente/null de forma controlada.
- Endpoint: `PUT /api/citas/updateEstado/:id` debe persistir `programada|en_proceso|completada|cancelada`.

4. Sincronizacion Cita -> Tarea
- Al actualizar cita/asignacion/estado, la `Tarea` vinculada por `sourceType="cita"` y `sourceId=<citaId>` debe reflejar cambios.
- Si no hay sincronizacion en estos updates, el tablero mostrara datos stale al recargar.

5. Update de tarea
- Endpoint: `PATCH /api/tareas/:id` debe aceptar campos usados por el front:
  - `etapa`, `estado`, `asignadoA`, `nombreProyecto`, `notas`, `prioridad`, `fechaLimite`, `ubicacion`, `mapsUrl`
  - `followUpStatus`, `followUpEnteredAt`, `citaStarted`, `citaFinished`
  - `sourceType`, `sourceId`, `cita` (cuando aplique)

6. Estandar de respuesta API
- Recomendado uniforme:
```json
{ "success": true, "data": { ... }, "message": "..." }
```
- Evitar mezclar retorno directo de entidad y `ApiResponse` en rutas criticas de operaciones.

## 5) Casos de prueba integracion (front-back)

1. Asignacion por rol
- Abrir Operaciones (admin).
- Verificar selector con usuarios de distintos roles.
- Asignar tarea/cita a usuario no-admin.
- Confirmar persistencia tras refresh.

2. Edicion modal lateral en cita
- Cambiar `Titulo` y `Notas`.
- Guardar.
- Validar que backend guarda en `cita.informacionAdicional` (prioridad titulo).
- Confirmar en tablero y recarga.

3. Cambio de estado cita
- Pendiente -> Completada y viceversa.
- Confirmar sincronizacion en `Tarea` asociada.

4. Promocion de cita
- Mover de `citas` a `disenos`.
- Verificar uso de `sourceId` correcto y trazabilidad conservada.

5. Tarea sin `titulo`
- Obtener tarjeta desde kanban/tareas sin `titulo`.
- Confirmar que front renderiza con `cita.*` / `notas` sin romper.

## 6) Resumen ejecutivo

- Frontend ya fue ajustado para el contrato nuevo y el modal lateral funcional fue restaurado.
- El problema de ver solo admins se ataco en frontend consumiendo `/api/usuarios` (todos los roles activos).
- Si persisten fallas de estatus/datos, el siguiente punto critico es backend: sincronizacion Cita->Tarea, consistencia de roles y aceptacion de payloads en updates.

## 7) Siguiente paso recomendado

Ejecutar una sesion de validacion conjunta front-back con trazas de request/response para estos endpoints:
- `GET /api/usuarios`
- `GET /api/kanban/citas`
- `PUT /api/citas/actualizarCita/:id`
- `PUT /api/citas/:id/asignarIngeniero`
- `PUT /api/citas/updateEstado/:id`
- `PATCH /api/tareas/:id`

Con eso se identifica exactamente si el bloqueo restante es de contrato, validacion o sincronizacion en backend.
