# Requisitos Backend — Admin y flujo operativo real

Frontend objetivo: `/admin`

Base URL actual en frontend:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Objetivo

El frontend admin ya quedó preparado para trabajar **sin datos simulados** en estas áreas:

- Dashboard admin `/admin`
- Agenda `/admin/agenda`
- Operaciones `/admin/operaciones`
- Diseños `/admin/disenos`
- Precios y catálogo `/admin/precios`
- Clientes en proceso `/admin/clientes-en-proceso`
- Clientes confirmados `/admin/clientes-confirmados`
- Clientes descartados `/admin/clientes-descartados`

La única persistencia local que quedó en admin es **preferencia visual del sidebar**. No afecta negocio.

---

## Requisitos transversales

### Autenticación
Todos los endpoints privados deben aceptar:

```http
Authorization: Bearer <jwt>
Content-Type: application/json
```

### CORS
Permitir al menos:

- `http://localhost:3000`
- métodos `GET, POST, PATCH, PUT, DELETE`
- headers `Authorization, Content-Type`

### Envelope de respuesta
Éxito:

```json
{ "success": true, "data": {} }
```

Error:

```json
{ "success": false, "message": "Descripción del error" }
```

### Buenas prácticas esperadas del backend

- Validar rol/permiso por endpoint
- Sanitizar strings
- Validar enums antes de persistir
- Registrar `updatedAt`
- No devolver información sensible innecesaria
- Si un recurso no existe, responder 404 real
- Si el usuario no tiene permiso, responder 403
- Si el token no es válido, responder 401

---

# Requests que el frontend hace o necesita, uno por uno

## 1) Obtener todas las citas

```http
GET /api/citas/getAllCitas
```

### Uso frontend
- Dashboard admin: agenda del día, KPI de citas sin asignar
- Agenda admin: tablero de citas

### Respuesta esperada

```json
{
  "success": true,
  "data": [
    {
      "_id": "cita_001",
      "fechaAgendada": "2026-03-16T10:00:00.000Z",
      "fechaInicio": "2026-03-16T10:15:00.000Z",
      "fechaTermino": null,
      "nombreCliente": "Juan Pérez",
      "correoCliente": "juan@example.com",
      "telefonoCliente": "5551234567",
      "ubicacion": "Col. Roma Norte",
      "diseno": null,
      "informacionAdicional": "",
      "estado": "programada",
      "ingenieroAsignado": {
        "_id": "usr_001",
        "nombre": "Carlos López",
        "correo": "carlos@kuche.com",
        "telefono": "5559988776",
        "rol": "arquitecto"
      },
      "especificacionesInicio": {
        "medidas": "",
        "estilo": "",
        "especificaciones": "",
        "materialesPreferidos": []
      },
      "createdAt": "2026-03-01T00:00:00.000Z",
      "updatedAt": "2026-03-01T00:00:00.000Z"
    }
  ]
}
```

### Reglas
- `fechaAgendada` debe venir en ISO 8601
- `ingenieroAsignado` puede ser objeto, string o `null`
- `estado` permitido: `programada`, `en_proceso`, `completada`, `cancelada`

---

## 2) Asignar ingeniero a cita

```http
PUT /api/citas/:id/asignarIngeniero
```

### Body

```json
{
  "ingenieroId": "usr_001"
}
```

### Uso frontend
- Modal de detalle de cita en `/admin/agenda`

### Respuesta esperada

```json
{
  "success": true,
  "data": {
    "message": "Ingeniero asignado correctamente",
    "cita": {
      "_id": "cita_001",
      "estado": "programada",
      "ingenieroAsignado": {
        "_id": "usr_001",
        "nombre": "Carlos López",
        "correo": "carlos@kuche.com",
        "rol": "arquitecto"
      }
    }
  }
}
```

---

## 3) Actualizar estado de cita

```http
PUT /api/citas/updateEstado/:id
```

### Body

```json
{
  "estado": "en_proceso",
  "fechaTermino": null
}
```

### Uso frontend
- Drag and drop de citas en `/admin/agenda`
- Cambio manual de estado en modal de cita

---

## 4) Listar empleados activos

```http
GET /api/usuarios/empleados
```

### Uso frontend
- Asignación de ingenieros en agenda
- Asignación de responsables en operaciones
- Filtro por empleado en tablero de operaciones

### Respuesta esperada

```json
{
  "success": true,
  "data": [
    {
      "_id": "usr_001",
      "nombre": "Carlos López",
      "correo": "carlos@kuche.com",
      "rol": "arquitecto",
      "activo": true,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

---

## 5) Obtener columna kanban: citas

```http
GET /api/kanban/citas
```

## 6) Obtener columna kanban: diseños

```http
GET /api/kanban/disenos
```

## 7) Obtener columna kanban: cotización

```http
GET /api/kanban/cotizacion
```

## 8) Obtener columna kanban: seguimiento

```http
GET /api/kanban/contrato
```

### Uso frontend de las 4 columnas
- Dashboard admin: métricas y alertas
- Operaciones: tablero completo
- Diseños: revisión y aprobación
- Clientes en proceso / confirmados / descartados
- Dashboard empleado

### Respuesta esperada de cada endpoint

```json
{
  "success": true,
  "data": [
    {
      "_id": "tar_001",
      "titulo": "Levantamiento García",
      "etapa": "citas",
      "estado": "pendiente",
      "asignadoA": ["usr_001"],
      "asignadoANombre": ["Carlos López"],
      "proyecto": "proy_001",
      "nombreProyecto": "Cocina García",
      "notas": "Cliente disponible por las mañanas",
      "prioridad": "alta",
      "fechaLimite": "2026-03-18",
      "ubicacion": "Durango, Dgo.",
      "mapsUrl": "https://maps.google.com/...",
      "followUpEnteredAt": 1773558000000,
      "followUpStatus": "pendiente",
      "citaStarted": false,
      "citaFinished": false,
      "designApprovedByAdmin": false,
      "designApprovedByClient": false,
      "codigoProyecto": "K-1773558000000",
      "preliminarData": null,
      "cotizacionFormalData": null,
      "preliminarCotizaciones": [],
      "cotizacionesFormales": [],
      "archivos": [
        {
          "id": "file_001",
          "nombre": "render-cocina.jpg",
          "tipo": "render",
          "url": "https://cdn.midominio.com/render-cocina.jpg",
          "createdAt": "2026-03-15T00:00:00.000Z"
        }
      ],
      "createdAt": "2026-03-10T00:00:00.000Z",
      "updatedAt": "2026-03-15T00:00:00.000Z"
    }
  ]
}
```

### Observaciones de compatibilidad
- `asignadoA` puede ser `string` o `string[]`, pero el frontend ya soporta ambos; se prefiere `string[]`
- `asignadoANombre` puede ser `string` o `string[]`, pero el frontend ya soporta ambos; se prefiere `string[]`
- `archivos[].url` es importante para ver renders/PDFs en admin diseños
- `followUpStatus` determina confirmados/descartados/en proceso
- `designApprovedByAdmin` determina el estado de aprobación interna del diseño

---

## 9) Fallback si no existe `/api/kanban/*`

Si todavía no existe la capa `/api/kanban/*`, el frontend puede seguir operando con:

```http
GET /api/tareas?etapa=citas
GET /api/tareas?etapa=disenos
GET /api/tareas?etapa=cotizacion
GET /api/tareas?etapa=contrato
```

La respuesta debe tener **exactamente la misma estructura de `Tarea`**.

---

## 10) Crear tarea operativa

```http
POST /api/tareas
```

### Body esperado

```json
{
  "titulo": "Cocina García",
  "etapa": "citas",
  "estado": "pendiente",
  "asignadoA": ["usr_001"],
  "proyecto": "Cocina García",
  "nombreProyecto": "Cocina García",
  "prioridad": "media",
  "fechaLimite": "2026-03-18",
  "ubicacion": "Durango, Dgo.",
  "mapsUrl": "https://maps.google.com/...",
  "codigoProyecto": "K-1773558000000"
}
```

### Uso frontend
- Botón “Asignar pendiente” en `/admin/operaciones`

### Reglas
- Validar que `etapa` sea uno de: `citas`, `disenos`, `cotizacion`, `contrato`
- Validar `prioridad`: `alta`, `media`, `baja`
- `codigoProyecto` debe ser único si se persiste así

---

## 11) Actualizar tarea operativa

```http
PATCH /api/tareas/:id
```

> También puede ser `PUT /api/tareas/:id` si el backend ya lo maneja así. El frontend está usando `PATCH` para catálogo y `PUT`/`PATCH` mixto en otras áreas; puede adaptarse si hace falta, pero idealmente mantener `PATCH` para actualizaciones parciales.

### Body posible

```json
{
  "titulo": "Cocina García",
  "nombreProyecto": "Cocina García",
  "asignadoA": ["usr_002"],
  "notas": "Solicitar nueva versión del render",
  "prioridad": "alta",
  "fechaLimite": "2026-03-25",
  "ubicacion": "Monterrey, NL",
  "mapsUrl": "https://maps.google.com/...",
  "followUpEnteredAt": 1773558000000,
  "followUpStatus": "pendiente",
  "designApprovedByAdmin": false,
  "designApprovedByClient": false,
  "codigoProyecto": "K-1773558000000",
  "preliminarData": null,
  "cotizacionFormalData": null,
  "preliminarCotizaciones": [],
  "cotizacionesFormales": []
}
```

### Uso frontend
- Guardar cambios en modal de tarea de `/admin/operaciones`
- Aprobar diseño en `/admin/disenos`
- Solicitar cambios en `/admin/disenos`
- Confirmar / descartar / reactivar seguimiento

---

## 12) Cambiar etapa de tarea

```http
PATCH /api/tareas/:id/etapa
```

### Body

```json
{
  "etapa": "cotizacion"
}
```

### Uso frontend
- Drag and drop en `/admin/operaciones`
- Cambio manual de etapa desde modal

---

## 13) Cambiar estado de tarea

```http
PATCH /api/tareas/:id/estado
```

### Body

```json
{
  "estado": "completada"
}
```

### Uso frontend
- Cambio manual de estado desde modal de tarea

---

## 14) Eliminar tarea

```http
DELETE /api/tareas/:id
```

### Uso frontend
- Botón eliminar en modal de `/admin/operaciones`

---

## 15) Agregar archivos a tarea

```http
POST /api/tareas/:id/archivos
```

### Body

```json
{
  "archivos": [
    {
      "nombre": "render-cocina.jpg",
      "tipo": "render",
      "url": "https://cdn.midominio.com/render-cocina.jpg"
    }
  ]
}
```

### Uso frontend
- Vista empleado / diseños

### Importante
El frontend espera `url` accesible para poder previsualizar imágenes y PDFs.

---

## 16) Obtener materiales

```http
GET /api/catalogos/materiales
```

### Uso frontend
- Dashboard admin: contador total
- Admin precios: catálogo editable
- Cotizador Pro

### Respuesta

```json
{
  "success": true,
  "data": [
    {
      "_id": "mat_001",
      "id": "mat_001",
      "nombre": "Melamina blanca",
      "precioMetroLineal": 850,
      "descripcion": "Tablero base",
      "activo": true
    }
  ]
}
```

---

## 17) Crear material

```http
POST /api/catalogos/materiales
```

### Body

```json
{
  "id": "mat_001",
  "nombre": "Melamina blanca",
  "precioMetroLineal": 850,
  "descripcion": "Tablero base",
  "activo": true
}
```

---

## 18) Actualizar material

```http
PATCH /api/catalogos/materiales/:id
```

---

## 19) Eliminar material

```http
DELETE /api/catalogos/materiales/:id
```

---

## 20) Obtener herrajes

```http
GET /api/catalogos/herrajes
```

### Respuesta

```json
{
  "success": true,
  "data": [
    {
      "_id": "her_001",
      "id": "her_001",
      "nombre": "Bisagra cierre lento",
      "precioUnitario": 120,
      "descripcion": "Bisagra premium",
      "categoria": "bisagras",
      "activo": true
    }
  ]
}
```

---

## 21) Crear herraje

```http
POST /api/catalogos/herrajes
```

---

## 22) Actualizar herraje

```http
PATCH /api/catalogos/herrajes/:id
```

---

## 23) Eliminar herraje

```http
DELETE /api/catalogos/herrajes/:id
```

---

# Contrato de datos completo para `Tarea`

```ts
interface Tarea {
  _id: string;
  titulo: string;
  etapa: "citas" | "disenos" | "cotizacion" | "contrato";
  estado: "pendiente" | "completada";
  asignadoA: string | string[];
  asignadoANombre: string | string[];
  proyecto: string;
  nombreProyecto: string;
  notas?: string;
  prioridad?: "alta" | "media" | "baja";
  fechaLimite?: string;
  ubicacion?: string;
  mapsUrl?: string;
  followUpEnteredAt?: number;
  followUpStatus?: "pendiente" | "confirmado" | "descartado";
  citaStarted?: boolean;
  citaFinished?: boolean;
  designApprovedByAdmin?: boolean;
  designApprovedByClient?: boolean;
  preliminarData?: {
    client: string;
    projectType: string;
    location: string;
    date: string;
    rangeLabel: string;
    cubierta: string;
    frente: string;
    herraje: string;
  };
  cotizacionFormalData?: {
    client: string;
    projectType: string;
    location: string;
    date: string;
    rangeLabel: string;
    cubierta: string;
    frente: string;
    herraje: string;
    formalPdfKey?: string;
    pdfDataUrl?: string;
  };
  preliminarCotizaciones?: Array<{
    client: string;
    projectType: string;
    location: string;
    date: string;
    rangeLabel: string;
    cubierta: string;
    frente: string;
    herraje: string;
  }>;
  cotizacionesFormales?: Array<{
    client: string;
    projectType: string;
    location: string;
    date: string;
    rangeLabel: string;
    cubierta: string;
    frente: string;
    herraje: string;
    formalPdfKey?: string;
    pdfDataUrl?: string;
  }>;
  codigoProyecto?: string;
  archivos?: Array<{
    id: string;
    nombre: string;
    tipo: "pdf" | "render" | "otro";
    url?: string;
    createdAt?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}
```

---

# Relación funcional esperada entre entidades

## Citas
- Una `Cita` pertenece al flujo operativo real
- Puede o no tener `ingenieroAsignado`
- Su asignación se gestiona con `/api/citas/:id/asignarIngeniero`

## Tareas operativas
- Una `Tarea` representa una tarjeta del tablero
- Puede tener uno o varios responsables (`asignadoA`)
- Debe poder moverse entre etapas
- Debe soportar metadata de seguimiento, aprobación y cotizaciones

## Diseños
- Se representan como `Tarea` con `etapa = "disenos"`
- La aprobación admin depende de `designApprovedByAdmin`
- Si hay feedback, hoy el frontend lo guarda en `notas`

## Seguimiento comercial
- Se representa como `Tarea` con `etapa = "contrato"`
- `followUpStatus = "pendiente" | "confirmado" | "descartado"`
- Eso alimenta las vistas de clientes en proceso / confirmados / descartados

## Catálogo
- Materiales y herrajes ya no se leen desde localStorage
- Todo se gestiona por API

---

# Checklist mínimo para que el frontend responda bien

- [ ] Backend escuchando en `http://localhost:3001`
- [ ] JWT válido devuelto por login
- [ ] CORS habilitado para `http://localhost:3000`
- [ ] `/api/citas/getAllCitas` responde 200
- [ ] `/api/usuarios/empleados` responde 200
- [ ] `/api/kanban/citas` responde 200
- [ ] `/api/kanban/disenos` responde 200
- [ ] `/api/kanban/cotizacion` responde 200
- [ ] `/api/kanban/contrato` responde 200
- [ ] `/api/catalogos/materiales` responde 200
- [ ] `/api/catalogos/herrajes` responde 200
- [ ] `/api/tareas` permite crear, actualizar, mover, eliminar
- [ ] `archivos[].url` sirve contenido real para previews

---

# Pruebas rápidas con curl

```bash
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/citas/getAllCitas
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/usuarios/empleados
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/kanban/citas
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/kanban/disenos
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/kanban/cotizacion
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/kanban/contrato
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/catalogos/materiales
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/catalogos/herrajes
```

Si quieres validar escritura:

```bash
curl -X POST http://localhost:3001/api/tareas \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo":"Cocina García",
    "etapa":"citas",
    "estado":"pendiente",
    "asignadoA":["usr_001"],
    "proyecto":"Cocina García",
    "nombreProyecto":"Cocina García",
    "prioridad":"media"
  }'
```
