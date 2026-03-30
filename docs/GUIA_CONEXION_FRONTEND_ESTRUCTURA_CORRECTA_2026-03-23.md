# Guia De Conexion Frontend-Backend (Estructura Correcta)

Fecha: 2026-03-23
Estado: Vigente para la implementacion actual del backend

## 1) Estructura De Rutas Activa

Prefijo global: `/api`

Rutas principales para el flujo de tablero admin:

- Auth: `/api/auth/*`
- Tareas: `/api/tareas/*`
- Kanban: `/api/kanban/*`
- Workflow de promocion: `/api/workflow/*`
- Archivos canonicos: `/api/archivos/*`
- Uploads de compatibilidad frontend: `/api/uploads`, `/api/dropbox/upload`, `/api/files/upload`

Archivos estaticos locales (fallback):

- `GET /uploads/...` (servidos por Express desde carpeta local `uploads/`)

## 2) Endpoints Canonicos Que Debe Usar Frontend

### 2.1 Autenticacion

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/auth/verify`

Header recomendado para todas las rutas protegidas:

- `Authorization: Bearer <token>`

Nota:

- El backend tambien acepta token por cookie (`token`), pero para SPA es mejor estandarizar `Authorization`.

### 2.2 Kanban (lectura por columnas)

- `GET /api/kanban/citas`
- `GET /api/kanban/disenos`
- `GET /api/kanban/cotizacion`
- `GET /api/kanban/contrato`
- `GET /api/kanban/seguimiento/alertas?dias=3`

Contrato relevante devuelto por tarea:

- Campos legacy y nuevos:
- `visitScheduledAt` (legacy)
- `visita` (nuevo objeto recomendado)
- `designApprovedByAdmin`, `designApprovedByClient`
- `archivos[]` con `url` normalizada para consumo frontend

### 2.3 Tareas (CRUD y acciones)

- `GET /api/tareas`
- `GET /api/tareas/:id`
- `POST /api/tareas`
- `PATCH /api/tareas/:id`
- `PUT /api/tareas/:id`
- `PATCH /api/tareas/:id/etapa`
- `PATCH /api/tareas/:id/estado`
- `PATCH /api/tareas/:id/notas`
- `POST /api/tareas/:id/archivos`

### 2.4 Workflow desde cita

- `POST /api/workflow/citas/:id/promover`

Uso:

- Promueve una cita y crea/relaciona tarea dentro del flujo actual.

### 2.5 Uploads (recomendacion)

Ruta canonica para frontend nuevo:

- `POST /api/uploads` con `multipart/form-data` y campo `file`

Rutas de compatibilidad soportadas:

- `POST /api/dropbox/upload`
- `POST /api/files/upload`
- `POST /api/uploads/multiple` (campo `files[]`)

Respuesta compatible esperada (single upload):

- `success`
- `url`
- `fileUrl`
- `provider`
- `data` (metadatos del archivo)

## 3) Contrato Recomendado Para Visita (Nuevo)

Usar `visita` como objeto principal para agenda/aprobaciones:

```json
{
  "visita": {
    "fechaProgramada": "2026-03-28T17:30:00.000Z",
    "aprobadaPorAdmin": true,
    "aprobadaPorCliente": false
  }
}
```

Compatibilidad mantenida:

- El backend sincroniza `visita.fechaProgramada` con `visitScheduledAt`.
- El backend sincroniza `visita.aprobadaPorAdmin` con `designApprovedByAdmin`.
- El backend sincroniza `visita.aprobadaPorCliente` con `designApprovedByClient`.

Regla frontend:

- Leer y escribir prioritariamente `visita`.
- Mantener soporte de lectura para `visitScheduledAt` solo como fallback temporal.

## 4) Flujo Frontend Recomendado (Disenos/Aprobacion/Agenda/Preview)

1. Login y almacenamiento de token.
2. Cargar columna de disenos: `GET /api/kanban/disenos`.
3. Al aprobar y agendar visita: `PATCH /api/tareas/:id` con objeto `visita`.
4. Subir archivo de diseno: `POST /api/uploads`.
5. Asociar archivo a tarea: `POST /api/tareas/:id/archivos` o incluirlo en actualizacion de tarea segun flujo UI.
6. Refrescar `GET /api/kanban/disenos` y renderizar `archivos[].url`.

## 5) Checklist De Integracion Frontend

Marcar cada punto al validar:

- [ ] Todas las llamadas protegidas mandan `Authorization: Bearer <token>`.
- [ ] El frontend usa rutas canonicamente bajo `/api/...`.
- [ ] Para uploads simples se usa `POST /api/uploads` con campo `file`.
- [ ] Para multiples se usa `POST /api/uploads/multiple` con campo `files[]`.
- [ ] El frontend consume `data.url || url || fileUrl` en respuesta de upload.
- [ ] El frontend persiste visita con objeto `visita` (no solo campos planos).
- [ ] El frontend al leer usa `visita.fechaProgramada` como principal.
- [ ] En `kanban/disenos` se muestra preview con `archivos[].url`.
- [ ] Se maneja error `400` cuando llega fecha invalida desde UI.
- [ ] Se maneja error `401/403` para token ausente/expirado.

## 6) Consideraciones Operativas

Dropbox:

- Si Dropbox no tiene scopes correctos, puede entrar fallback local (segun configuracion).
- Modo estricto opcional: `REQUIRE_DROPBOX_UPLOADS=true` para forzar error si Dropbox falla.

CORS local actual:

- Origenes permitidos por defecto: `http://localhost:5173`, `http://localhost:3000`.

## 7) Riesgos/Observaciones De Estructura Detectados

- Corregido en codigo: configuracion CORS sin duplicidad de `methods` en `src/app.js`.
- Corregido en codigo: comentarios de rutas/controlador de archivos alineados al comportamiento real (Dropbox + DigitalOcean + fallback local).
- Advertencia no bloqueante vigente al iniciar backend: indice duplicado de Mongoose en `nombre` (fuera del flujo de integracion frontend de tareas/kanban/uploads).
- Advertencia no bloqueante vigente: uso de AWS SDK v2 en libreria de almacenamiento.

## 8) Convencion Final Recomendada

Para evitar incongruencias entre equipos:

- Frontend usa `visita` como contrato oficial para agenda/aprobacion.
- Backend mantiene campos legacy mientras dura la transicion.
- Upload principal para UI: `/api/uploads`.
- Kanban de disenos como fuente de verdad de cards: `/api/kanban/disenos`.

Con esta convencion, el flujo actual queda consistente para integracion y pruebas E2E.
