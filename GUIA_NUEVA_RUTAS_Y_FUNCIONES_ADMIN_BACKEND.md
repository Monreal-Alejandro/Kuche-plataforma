# Guía Nueva — Rutas y Funciones Admin Frontend/Backend

Fecha: 2026-03-17
Estado: actualizada con correcciones por errores `500 cambiar etapa` y `404 herrajes`.

---

## 1) Qué se corrigió en frontend

### A. Cambio de etapa (error 500)

Se corrigió el flujo de operaciones para que el frontend intente primero:

- `PATCH /api/tareas/:id` con body `{ etapa: "..." }`

Y si falla, use fallback:

- `PATCH /api/tareas/:id/etapa` con body `{ etapa: "..." }`

Esto se aplicó en drag & drop y guardado desde modal.

### B. Catálogos (error 404 herrajes)

Se agregaron fallbacks de ruta para materiales/herrajes.

Orden de intento para **herrajes**:

1. `/api/catalogos/herrajes`
2. `/api/herrajes`
3. `/api/catalogo/herrajes`

Orden de intento para **materiales**:

1. `/api/catalogos/materiales`
2. `/api/materiales`
3. `/api/catalogo/materiales`

Se aplica para GET/POST/PATCH/DELETE.

### C. Cita completada visible y prioritaria

- Las citas completadas ya **no se ocultan** en operaciones.
- Cuando una cita llega con estado completada, la prioridad visual se fuerza a **alta** automáticamente.

---

## 2) Flujo funcional esperado por módulo

## Operaciones (`/admin/operaciones`)

### Mover tarjeta entre columnas

1. Frontend manda `PATCH /api/tareas/:id` con `{ etapa }`
2. Si backend no soporta ese caso, frontend manda `PATCH /api/tareas/:id/etapa`
3. Backend responde envelope estándar
4. Frontend recarga tablero

### Guardar cambios de tarjeta

- `PATCH /api/tareas/:id` con payload parcial (`titulo`, `estado`, `asignadoA`, `etapa`, etc.)

### Eliminar

- Si es cita: `DELETE /api/citas/eliminarCita/:id`
- Si es tarea: `DELETE /api/tareas/:id`

---

## Catálogos (`/admin/precios`)

### Cargar

- Materiales: fallback de rutas (3 intentos)
- Herrajes: fallback de rutas (3 intentos)

### Crear

- Material: `POST` sobre la primera ruta disponible
- Herraje: `POST` sobre la primera ruta disponible

### Editar precio

- Material: `PATCH .../:id` sobre ruta disponible
- Herraje: `PATCH .../:id` sobre ruta disponible

### Eliminar

- `DELETE .../:id` sobre ruta disponible

---

## Agenda/Citas (`/admin/agenda`)

- Asignación de ingeniero: `PUT /api/citas/:id/asignarIngeniero`
- Estado de cita: `PUT /api/citas/updateEstado/:id`
- Lectura principal admin: `GET /api/citas/getAllCitas`

---

## Diseños/Cotización/Seguimiento

- Fuente principal: `GET /api/kanban/disenos`, `GET /api/kanban/cotizacion`, `GET /api/kanban/contrato`
- Fallback: `GET /api/tareas?etapa=...`

---

## 3) Contrato mínimo que backend debe garantizar

## Headers

- `Authorization: Bearer <token>` en rutas protegidas
- `Content-Type: application/json`
- `captcha-token` en creación pública de cita

## Envelope

Éxito:

```json
{ "success": true, "data": ... }
```

Error:

```json
{ "success": false, "message": "...", "error": "..." }
```

## Códigos HTTP

- 400 validación
- 401 autenticación
- 403 permisos
- 404 recurso
- 409 conflicto
- 500 error interno

---

## 4) Endpoints finales recomendados (canónicos)

## Kanban

- `GET /api/kanban/citas`
- `GET /api/kanban/disenos`
- `GET /api/kanban/cotizacion`
- `GET /api/kanban/contrato`

## Tareas

- `GET /api/tareas`
- `GET /api/tareas/:id`
- `POST /api/tareas`
- `PATCH /api/tareas/:id`
- `PATCH /api/tareas/:id/etapa`
- `PATCH /api/tareas/:id/estado`
- `DELETE /api/tareas/:id`

## Citas

- `GET /api/citas/getAllCitas`
- `PUT /api/citas/:id/asignarIngeniero`
- `PUT /api/citas/updateEstado/:id`
- `PUT /api/citas/actualizarCita/:id`
- `DELETE /api/citas/eliminarCita/:id`

## Catálogos

Canónico esperado:

- `GET/POST/PATCH/DELETE /api/catalogos/materiales`
- `GET/POST/PATCH/DELETE /api/catalogos/herrajes`

Compatibilidad temporal (si backend no usa canónico):

- `/api/materiales`, `/api/catalogo/materiales`
- `/api/herrajes`, `/api/catalogo/herrajes`

---

## 5) Qué esperar ahora en la UI

- Ya debes poder arrastrar tarjetas sin depender solo de `/etapa`.
- Si backend tiene herrajes en ruta alternativa, el módulo de precios debe cargar/guardar.
- Citas completadas siguen visibles y con prioridad alta.

---

## 6) Si vuelve a fallar, qué enviar al backend (formato exacto)

Para reproducir cualquier fallo, enviar:

1. Método HTTP
2. URL completa
3. Headers enviados
4. Body enviado
5. Status code
6. Body de respuesta

Ejemplo:

```txt
PATCH /api/tareas/69b.../etapa
Headers: Authorization, Content-Type
Body: { "etapa": "disenos" }
Response: 500 { "success": false, "message": "Error al cambiar etapa" }
```

---

## 7) Archivos frontend modificados en esta corrección

- `src/app/admin/operaciones/page.tsx`
- `src/lib/admin-workflow.ts`
- `src/lib/axios/catalogosApi.ts`

Con esto, el frontend queda más tolerante a variaciones de rutas backend y mantiene el comportamiento de negocio solicitado para citas completadas.
