# Integración Frontend — Kanban / Citas

Este documento describe las rutas relevantes para mostrar y gestionar las citas desde el frontend (Kanban) y cómo se espera que el frontend haga las peticiones para que todo funcione.

## Respuesta estándar

- Éxito: `{ success: true, data: ..., message?: '...' }`
- Error: `{ success: false, message: '...', error?: 'detalle' }`

## Encabezados comunes

- `Authorization`: `Bearer <token>` (para rutas protegidas)
- `Content-Type`: `application/json`
- `captcha-token`: (solo para `POST /api/citas` público al crear cita)

## Rutas principales (Kanban / Citas)

### GET /api/kanban/citas

- Auth: requiere `Authorization` (backend valida permisos según rol)
- Query: opcional `?estado=` u otros filtros simples
- Respuesta: `{ success: true, data: [ cards ] }`
- Cada card debe incluir al menos:
  - `_id`
  - `title` (generado)
  - `estado`
  - `fechaAgendada`
  - `cliente: { nombre, correo, telefono }`
  - `ingenieroAsignado` (objeto o `null`)
  - `raw` (cita original opcional)
- Uso: listar tarjetas por columna en Kanban (mapear `estado` a columna)

### PUT /api/citas/:id/asignarIngeniero

- Auth: solo `admin`
- Body: `{ "ingenieroId": "<id>" }`
  - Si se envía `null` o no se incluye, la asignación se remueve
- Respuesta: `{ success: true, data: { message, cita } }`
- La `cita` debe regresar actualizada y poblada con `ingenieroAsignado`
- Errores comunes:
  - `400` (id inválido)
  - `403` (no admin)
  - `404` (cita o ingeniero no existe)

### PUT /api/citas/:id/iniciar

- Auth: `admin` o `ingeniero`/`arquitecto` asignado
- Body opcional:
  - `{ medidas?, estilo?, especificaciones?, materialesPreferidos? }`
- Efecto:
  - cambia `estado` -> `en_proceso`
  - setea `fechaInicio`
  - agrega entrada en `historialEstados`
- Respuesta: `{ success: true, data: { message, cita } }`
- Errores:
  - `400` si no está en `programada`
  - `403` si usuario no asignado

### PUT /api/citas/:id/finalizar

- Auth: `admin` o `ingeniero`/`arquitecto` asignado
- Body opcional:
  - `{ ingenieroId?, fechaEstimadaFinalizacion?, notasInternas? }`
- Efecto:
  - cambia `estado` -> `completada`
  - setea `fechaTermino`
  - agrega `historialEstados`
  - crea `OrdenTrabajo` (resumen en respuesta)
- Respuesta: `201 { success: true, data: { message, cita, ordenTrabajo } }`

### GET /api/citas/:id

- Auth: protegido; ingenieros solo pueden ver sus citas
- Respuesta: `{ success: true, data: cita }`

### GET /api/citas

- Lista todas las citas (con paginación/filtrado si aplica)
- Respuesta: `{ success: true, data: [citas] }`

### GET /api/citas/availability?fecha=YYYY-MM-DD

- Ruta pública
- Respuesta: `{ success: true, fecha: 'YYYY-MM-DD', horariosOcupados: ['09:00','10:00'] }`

### POST /api/citas (creación pública)

- Header requerido: `captcha-token`
- Body ejemplo:

```json
{
  "fechaAgendada": "2026-03-20T10:00:00-06:00",
  "nombreCliente": "Ana",
  "correoCliente": "a@e.com",
  "telefonoCliente": "5512345678",
  "ubicacion": "CDMX",
  "diseno": "<idDesc>"
}
```

- Validaciones:
  - mínimo 1 hora de anticipación
  - solo lunes a viernes
  - hora entre 09:00 y 18:00
  - buffer de 1 hora entre citas
- Respuesta:
  - `201 { success: true, data: cita }`
  - o `400 { success: false, message, ... }`

## Flujo recomendado para Frontend (Asignación y Kanban funcional)

1. Mostrar columnas Kanban
   - Llamar `GET /api/kanban/citas`
   - Mapear `card.estado` a columnas (`programada`, `en_proceso`, `completada`, `cancelada`)
   - Renderizar `ingenieroAsignado?.nombre` o botón `Asignar` si `null`

2. Asignar trabajador (acción admin)
   - UI: selector con lista de ingenieros
   - Fuente sugerida: `GET /api/usuarios?role=ingeniero` (o endpoint equivalente)
   - Petición: `PUT /api/citas/:id/asignarIngeniero` con `{ ingenieroId }`
   - Tras éxito: reemplazar card con `data.cita`

3. Iniciar trabajo (acción ingeniero asignado o admin)
   - UI: botón `Iniciar` en tarjeta/moda
   - Petición: `PUT /api/citas/:id/iniciar`
   - Tras éxito: card cambia a `en_proceso`

4. Finalizar trabajo
   - UI: botón `Finalizar`
   - Petición: `PUT /api/citas/:id/finalizar`
   - Tras éxito: card pasa a `completada` y se usa `data.ordenTrabajo`

## Ejemplos (fetch)

### Asignar ingeniero (admin)

```javascript
fetch('/api/citas/644d.../asignarIngeniero', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({ ingenieroId: '603a...' })
}).then(r => r.json()).then(res => {
  if (res.success) updateCard(res.data.cita)
  else showError(res.message)
})
```

### Iniciar cita (ingeniero asignado)

```javascript
fetch('/api/citas/644d.../iniciar', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({ medidas: '...', especificaciones: '...' })
}).then(r => r.json()).then(res => {
  if (res.success) refreshCard(res.data.cita)
})
```

### Finalizar cita

```javascript
fetch('/api/citas/644d.../finalizar', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({ notasInternas: 'Trabajo completado' })
}).then(r => r.json()).then(res => {
  if (res.success) showOrder(res.data.ordenTrabajo)
})
```

## Notas importantes para frontend

- Respetar `Authorization` y roles:
  - solo `admin` puede asignar
  - `ingeniero`/`arquitecto` solo pueden iniciar/finalizar si están asignados
- Tras mutación (`asignar`, `iniciar`, `finalizar`), refrescar card (`GET /api/citas/:id`) o reconsultar columna
- El backend guarda `historialEstados`; para timeline usar `GET /api/citas/:id`
- En creación pública, enviar siempre `captcha-token`

---

Si quieres, se puede agregar una colección Thunder/Postman y snippets equivalentes en Axios/React.