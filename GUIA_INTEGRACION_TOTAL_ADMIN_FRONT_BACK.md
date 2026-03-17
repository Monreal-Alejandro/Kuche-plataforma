# Guía de Integración Total Admin Frontend ↔ Backend

Fecha: 2026-03-17
Frontend objetivo: `/admin`
Base URL frontend: `NEXT_PUBLIC_API_URL=http://localhost:3001`

---

## 1) Objetivo

Dejar **todo el panel admin operativo** sin mocks ni lógica duplicada, con comunicación estable al backend para:

- Ver y gestionar citas
- Ver y mover diseños
- Ver cotizaciones formales
- Ver seguimientos (contrato)
- Agregar materiales/herrajes
- Actualizar precios

---

## 2) Arquitectura (Modelo - Vista - Controlador)

### Modelo (servicios y normalización)

- `src/lib/axios/axiosConfig.ts`
  - Config global Axios (`Authorization`, `Content-Type`, `withCredentials`)
- `src/lib/axios/tareasApi.ts`
  - CRUD tareas + etapa + estado + archivos
- `src/lib/axios/citasApi.ts`
  - CRUD/acciones de citas
- `src/lib/axios/catalogosApi.ts`
  - Materiales y herrajes
- `src/lib/axios/kanbanApi.ts`
  - `/api/kanban/*` con fallback a `/api/tareas?etapa=*`
- `src/lib/admin-workflow.ts`
  - Normaliza tarjetas de backend (`tarea` y `cita`) a formato único de UI

### Vista (pantallas)

- `src/app/admin/page.tsx`
- `src/app/admin/agenda/page.tsx`
- `src/app/admin/operaciones/page.tsx`
- `src/app/admin/disenos/page.tsx`
- `src/app/admin/precios/page.tsx`
- `src/app/admin/clientes-en-proceso/page.tsx`
- `src/app/admin/clientes-confirmados/page.tsx`
- `src/app/admin/clientes-descartados/page.tsx`

### Controlador (eventos por pantalla)

- Handlers de drag/drop, guardar, asignar, aprobar, confirmar, descartar, crear/eliminar
- Persistencia central por servicios Axios del modelo

---

## 3) Headers y CORS requeridos

## Headers obligatorios

- `Authorization: Bearer <token>` (rutas protegidas)
- `Content-Type: application/json`
- `captcha-token` (solo creación de cita pública)

## CORS backend

Permitir:

- `http://localhost:3000`
- `http://localhost:5173`
- Métodos `GET, POST, PATCH, PUT, DELETE`
- Headers `Authorization, Content-Type, captcha-token`

---

## 4) Envelope de respuesta esperado

Éxito:

```json
{ "success": true, "data": {} }
```

Error:

```json
{ "success": false, "message": "Descripción del error", "error": "detalle opcional" }
```

Códigos mínimos esperados:

- `400` payload inválido
- `401` no autenticado
- `403` sin permisos
- `404` recurso no encontrado
- `409` conflicto de negocio
- `500` error interno

---

## 5) Endpoints necesarios (fuente única)

## Kanban

- `GET /api/kanban/citas`
- `GET /api/kanban/disenos`
- `GET /api/kanban/cotizacion`
- `GET /api/kanban/contrato`

Fallback soportado por frontend:

- `GET /api/tareas?etapa=citas`
- `GET /api/tareas?etapa=disenos`
- `GET /api/tareas?etapa=cotizacion`
- `GET /api/tareas?etapa=contrato`

## Tareas

- `GET /api/tareas`
- `GET /api/tareas/:id`
- `POST /api/tareas`
- `PATCH /api/tareas/:id`
- `PATCH /api/tareas/:id/etapa`
- `PATCH /api/tareas/:id/estado`
- `DELETE /api/tareas/:id`
- `POST /api/tareas/:id/archivos`

## Citas

- `POST /api/citas/agregarCita` (con `captcha-token`)
- `GET /api/citas/getAllCitas`
- `GET /api/citas/verCitas`
- `GET /api/citas/misCitas`
- `GET /api/citas/porCliente?correo=...`
- `GET /api/citas/verCita/:id`
- `PUT /api/citas/actualizarCita/:id`
- `PUT /api/citas/:id/asignarIngeniero`
- `PUT /api/citas/updateEstado/:id`
- `PUT /api/citas/:id/iniciar`
- `PUT /api/citas/:id/finalizar`
- `POST /api/citas/:id/cancel`
- `DELETE /api/citas/eliminarCita/:id`

## Catálogos

- `GET /api/catalogos/materiales`
- `POST /api/catalogos/materiales`
- `PATCH /api/catalogos/materiales/:id`
- `DELETE /api/catalogos/materiales/:id`
- `GET /api/catalogos/herrajes`
- `POST /api/catalogos/herrajes`
- `PATCH /api/catalogos/herrajes/:id`
- `DELETE /api/catalogos/herrajes/:id`

---

## 6) Simplificación aplicada (sin código de más)

Se eliminó la lógica duplicada de `operaciones` que mezclaba creación forzada de tarea + cierre de cita para mover tarjetas.

Ahora el flujo es:

1. Mover tarjeta (tarea o cita) → `PATCH /api/tareas/:id/etapa`
2. Guardar tarjeta de cita en etapa `citas` → `PATCH /api/tareas/:id` (fallback de backend cuando `id` es cita)
3. Guardar tarjeta de tarea → `PATCH /api/tareas/:id`
4. Eliminar cita sigue por endpoint de citas (`DELETE /api/citas/eliminarCita/:id`)
5. Eliminar tarea sigue por endpoint de tareas (`DELETE /api/tareas/:id`)

Esto evita el error frecuente de `Proyecto no encontrado` durante arrastre de citas.

---

## 7) Estado de funcionalidades pedidas

### Materiales y precios

- Alta de material/herraje: **habilitado**
- Edición de precio: **habilitado**
- Eliminación de material/herraje: **habilitado**
- Carga desde backend (sin localStorage): **habilitado**

### Citas, diseños, cotizaciones y seguimientos

- Citas (agenda/admin): **habilitado**
- Diseños (`etapa = disenos`): **habilitado**
- Cotizaciones (`etapa = cotizacion`): **habilitado**
- Seguimientos (`etapa = contrato` + `followUpStatus`): **habilitado**

---

## 8) Reglas para evitar fallos de integración

- En operaciones, para mover entre columnas usar siempre `PATCH /api/tareas/:id/etapa`.
- Para actualizar estado usar `PATCH /api/tareas/:id/estado` o `PATCH /api/tareas/:id`.
- Si backend responde `404 Proyecto no encontrado`, no reintentar con el mismo `proyecto` inválido.
- En `POST /api/tareas`, usar `proyecto` válido según backend (id real o formato acordado).

---

## 9) Checklist final de arranque

- [ ] Backend en `http://localhost:3001`
- [ ] Frontend en `http://localhost:3000`
- [ ] Login devuelve JWT válido
- [ ] CORS permite `3000` y `5173`
- [ ] Endpoints de kanban responden 200
- [ ] Endpoints de tareas permiten create/update/move/delete
- [ ] Catálogos responden y guardan cambios
- [ ] Flujo admin carga sin datos simulados

---

## 10) Archivos clave modificados para la simplificación

- `src/app/admin/operaciones/page.tsx`
  - Unificación de drag/drop y guardado por endpoint de tareas
  - Eliminación de lógica duplicada de conversión cita→tarea en cliente
- `src/lib/axios/tareasApi.ts`
  - `actualizarTarea` usa `PATCH` para actualización parcial

---

## 11) Troubleshooting rápido

### Error 404 "Proyecto no encontrado"

Causa típica: `POST /api/tareas` con `proyecto` inválido.

Acciones:

1. Verificar request real (método, URL, body, headers)
2. Confirmar formato esperado de `proyecto` con backend
3. Si no existe el proyecto, crear/seleccionar uno válido antes de guardar

### Error 401/403

- Revisar expiración de token
- Revisar permisos por rol

### Error 500

- Revisar body enviado por frontend
- Revisar validaciones/stack backend para endpoint puntual

---

## 12) Resultado

Con esta configuración, el frontend queda alineado al contrato backend en estructura MVC, sin duplicidad de flujo en operaciones y con las rutas principales de admin comunicando a backend de forma consistente.
