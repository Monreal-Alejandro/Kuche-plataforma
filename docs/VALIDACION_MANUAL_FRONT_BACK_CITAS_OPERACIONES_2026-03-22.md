# Validacion Manual Front-Back (Citas y Operaciones)

Fecha: 2026-03-22
Estado: Lista para ejecutar
Objetivo: Detectar exactamente en que endpoint/campo se rompe la sincronizacion entre frontend y backend.

## 1) Precondiciones

- Backend levantado y accesible.
- Frontend levantado con sesion de admin activa.
- Tener al menos:
  - 1 cita en etapa `citas`.
  - 1 tarea en etapa distinta de `citas`.
- Tener token de admin para pruebas por API (Postman/Insomnia/curl).

## 2) Regla clave de roles (importante en este proyecto)

En este sistema, un usuario "empleado" puede venir con variantes en `rol`.
No bloquear por coincidencia exacta de una sola cadena.

Normalizacion recomendada para asignacion:
- `admin` -> administracion
- `arquitecto` -> staff tecnico
- `empleado` -> staff operativo
- `ingeniero` -> staff operativo
- `empleado_general` -> staff operativo
- `staff` -> staff operativo

Implementacion sugerida en backend (conceptual):
- Mantener un conjunto de roles asignables.
- Validar por inclusion en conjunto, no por igualdad de un unico valor.

Ejemplo de conjunto asignable:
```txt
admin, arquitecto, empleado, ingeniero, empleado_general, staff
```

## 3) Checklist rapido de integracion

- `GET /api/usuarios` devuelve usuarios activos de todos los roles asignables.
- `GET /api/kanban/citas` devuelve tarjetas con `sourceType`, `sourceId`, `cita`.
- `PUT /api/citas/:id/asignarIngeniero` acepta IDs de usuarios con roles variantes.
- `PUT /api/citas/actualizarCita/:id` persiste `informacionAdicional`, `ubicacion`, `nombreCliente`.
- `PUT /api/citas/updateEstado/:id` persiste estado y sincroniza su tarea.
- `PATCH /api/tareas/:id` aplica cambios y los refleja al refrescar tablero.

## 4) Casos de prueba detallados

## Caso A: Usuarios para asignacion (todos los roles)

Endpoint:
- `GET /api/usuarios`

Esperado:
- `success: true`
- Lista con usuarios activos y distintos roles (no solo admin).
- Campos minimos por item: `_id`, `nombre`, `rol`, `activo`.

Falla comun:
- Endpoint filtra por rol admin por error.

Accion backend requerida si falla:
- Corregir query de filtro para incluir roles asignables.

## Caso B: Citas en kanban con contrato canonico

Endpoint:
- `GET /api/kanban/citas`

Esperado por tarjeta:
- `_id`
- `etapa: "citas"`
- `estado`
- `sourceType: "cita"`
- `sourceId: <id de cita>`
- `cita: { fechaAgendada, nombreCliente, correoCliente, telefonoCliente, ubicacion, informacionAdicional }`

Falla comun:
- Falta `sourceType/sourceId` o no viene `cita` embebida.

Accion backend requerida si falla:
- Incluir campos canonicos en serializer de kanban/tareas.

## Caso C: Asignar responsable desde admin

Endpoint:
- `PUT /api/citas/:id/asignarIngeniero`

Body ejemplo:
```json
{
  "ingenieroId": "USER_ID_VARIANTE_ROL"
}
```

Esperado:
- `success: true`
- Cita con `ingenieroAsignado` actualizado.
- Tras refresh del tablero, `asignadoA/asignadoANombre` o equivalente sincronizado.

Falla comun:
- Backend solo permite un rol exacto y rechaza otros variantes.

Accion backend requerida si falla:
- Expandir validacion de rol asignable por conjunto de roles.

## Caso D: Editar datos de cita desde modal lateral

Endpoint:
- `PUT /api/citas/actualizarCita/:id`

Body ejemplo:
```json
{
  "nombreCliente": "Cliente Prueba",
  "ubicacion": "Durango Centro",
  "informacionAdicional": "Horario solicitado: 12:00"
}
```

Esperado:
- `success: true`
- Datos persistidos en cita.
- Datos reflejados en `Tarea` sincronizada al refrescar.

Falla comun:
- Backend responde success pero no sincroniza la tarea asociada.

Accion backend requerida si falla:
- Forzar sincronizacion Cita -> Tarea por `sourceType="cita"` + `sourceId=<citaId>`.

## Caso E: Cambio de estatus de cita

Endpoint:
- `PUT /api/citas/updateEstado/:id`

Body ejemplo:
```json
{
  "estado": "en_proceso"
}
```

Esperado:
- `success: true`
- Estado de cita actualizado.
- Tarjeta en panel refleja el nuevo estado tras refresh.

Falla comun:
- Estado cambia en cita pero no en tarea sincronizada.

Accion backend requerida si falla:
- Sincronizar estado de tarea vinculada en el mismo flujo transaccional.

## Caso F: Update de tarea no-cita

Endpoint:
- `PATCH /api/tareas/:id`

Body ejemplo:
```json
{
  "etapa": "disenos",
  "estado": "pendiente",
  "asignadoA": ["USER_ID"],
  "nombreProyecto": "Proyecto X",
  "notas": "Actualizar plano",
  "prioridad": "media",
  "fechaLimite": "2026-03-30",
  "ubicacion": "Durango",
  "mapsUrl": "https://maps.google.com/?q=durango"
}
```

Esperado:
- `success: true`
- Se reflejan cambios al recargar tablero.

Falla comun:
- Backend ignora campos o valida esquema distinto al consumido por front.

Accion backend requerida si falla:
- Alinear validadores DTO/esquema con payload real del panel.

## 5) Trazas sugeridas para depuracion

Agregar logs temporales en backend:
- Entrada y salida de:
  - `PUT /api/citas/actualizarCita/:id`
  - `PUT /api/citas/:id/asignarIngeniero`
  - `PUT /api/citas/updateEstado/:id`
  - sincronizador Cita -> Tarea
- Loggear:
  - `citaId`
  - `sourceId` buscado
  - tarea encontrada/no encontrada
  - diff de campos aplicados

## 6) Contrato minimo recomendado (backend)

Respuesta uniforme sugerida:
```json
{
  "success": true,
  "data": {},
  "message": "Operacion exitosa"
}
```

Evitar mezclar:
- a veces objeto plano
- a veces `ApiResponse`

La mezcla complica manejo robusto en front y oculta errores parciales.

## 7) Resultado esperado despues de correcciones

- Admin puede delegar a usuarios de distintos roles validos.
- Editar en modal lateral cambia datos reales y se refleja en panel.
- Estados de cita/tarea quedan consistentes despues de cada accion.
- Promocion de cita mantiene trazabilidad con `sourceType/sourceId`.

## 8) Registro de ejecucion (llenar durante QA)

- Caso A (usuarios): PASS/FAIL + evidencia
- Caso B (kanban citas): PASS/FAIL + evidencia
- Caso C (asignar): PASS/FAIL + evidencia
- Caso D (editar cita): PASS/FAIL + evidencia
- Caso E (estado cita): PASS/FAIL + evidencia
- Caso F (update tarea): PASS/FAIL + evidencia

Notas:
- Adjuntar request/response exactos y timestamp por caso.
- Si falla, registrar payload enviado por front y payload recibido en backend.
