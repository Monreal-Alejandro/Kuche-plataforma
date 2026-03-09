# 📡 Especificaciones de API - Backend Integration

**Proyecto:** Küche Plataforma  
**Fecha:** Marzo 2026  
**Para:** Equipo de Backend  
**De:** Frontend Team

---

## 🎯 Objetivo

Este documento describe las APIs necesarias para completar la integración del frontend con el backend. El frontend está **completamente listo** y solo necesita que estos endpoints estén disponibles para funcionar.

---

## 📋 Estado Actual

### ✅ APIs Ya Implementadas (funcionando):
- `authApi` - Autenticación completa
- `catalogosApi` - Catálogos de materiales/herrajes
- `cotizacionesApi` - Sistema de cotizaciones
- `levantamientosApi` - Levantamientos rápidos
- `usuariosApi` - Gestión de usuarios
- `citasApi` - Sistema de citas

### ⏳ APIs Pendientes (necesarias):
- `tareasApi` - **CRÍTICO** - Sistema de tareas Kanban
- `proyectosApi` - Sistema de proyectos (timeline cliente)
- `archivosApi` - Upload y gestión de archivos

---

## 🔥 PRIORIDAD: tareasApi

Esta API es **CRÍTICA** para el dashboard de empleados que ya está completamente implementado en el frontend.

### Base URL
```
http://your-backend-url/api/tareas
```

### Autenticación
Todas las rutas requieren token JWT en el header:
```
Authorization: Bearer {token}
```

---

### 📊 Estructura de Datos

#### Tipo: Tarea (Backend Model)

```typescript
interface Tarea {
  _id: string;                        // MongoDB ObjectId
  titulo: string;                      // Título de la tarea
  etapa: "citas" | "disenos" | "cotizacion" | "contrato";  // Etapa del Kanban
  estado: "pendiente" | "completada";  // Estado de la tarea
  asignadoA: string;                   // ID del usuario asignado (ref: Usuario)
  proyecto: string;                    // ID del proyecto (ref: Proyecto)
  nombreProyecto?: string;             // Nombre del proyecto (para evitar populate)
  notas?: string;                      // Notas adicionales
  archivos?: ArchivoTarea[];           // Archivos adjuntos
  createdAt: Date;                     // Fecha de creación
  updatedAt: Date;                     // Última actualización
  creadoPor?: string;                  // ID del usuario que creó la tarea
}

interface ArchivoTarea {
  id: string;                          // Identificador único del archivo
  nombre: string;                      // Nombre del archivo
  tipo: "pdf" | "render" | "otro";    // Tipo de archivo
  url?: string;                        // URL del archivo en S3/storage
  createdAt?: Date;                    // Fecha de subida
}
```

#### Mapeo Frontend ↔️ Backend

El frontend usa `KanbanTask` que mapea directamente:

```typescript
// Frontend: KanbanTask
{
  id: string;           // → _id (backend)
  title: string;        // → titulo
  stage: TaskStage;     // → etapa
  status: TaskStatus;   // → estado
  assignedTo: string;   // → asignadoA (nombre del usuario, no ID)
  project: string;      // → nombreProyecto
  notes?: string;       // → notas
  files?: TaskFile[];   // → archivos
}
```

**IMPORTANTE:** El frontend espera `assignedTo` como **nombre del usuario** (ej: "Valeria"), no el ID. El backend debe poblar/formatear esto.

---

### 📡 Endpoints Requeridos

#### 1. Obtener todas las tareas

```http
GET /api/tareas
```

**Query Parameters:**
```typescript
{
  etapa?: "citas" | "disenos" | "cotizacion" | "contrato";  // Filtrar por etapa
  estado?: "pendiente" | "completada";                       // Filtrar por estado
  asignadoA?: string;                                        // Filtrar por usuario (ID)
  proyecto?: string;                                         // Filtrar por proyecto (ID)
}
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Tareas obtenidas exitosamente",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "titulo": "Revisar medidas cliente Vega",
      "etapa": "citas",
      "estado": "pendiente",
      "asignadoA": "65f3b2c8e4b0a1234567890a",
      "asignadoANombre": "Valeria",  // ← IMPORTANTE: incluir nombre
      "proyecto": "65f3b2c8e4b0a1234567890b",
      "nombreProyecto": "Residencial Vega",  // ← IMPORTANTE: incluir nombre
      "notas": "Cliente prefiere medidas exactas",
      "archivos": [],
      "createdAt": "2026-03-01T10:00:00.000Z",
      "updatedAt": "2026-03-09T10:00:00.000Z"
    }
  ]
}
```

**Response 401:**
```json
{
  "success": false,
  "message": "Token inválido o expirado"
}
```

---

#### 2. Obtener tarea por ID

```http
GET /api/tareas/:id
```

**Response 200:**
```json
{
  "success": true,
  "message": "Tarea obtenida exitosamente",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "titulo": "Revisar medidas cliente Vega",
    "etapa": "citas",
    "estado": "pendiente",
    "asignadoA": "65f3b2c8e4b0a1234567890a",
    "asignadoANombre": "Valeria",
    "proyecto": "65f3b2c8e4b0a1234567890b",
    "nombreProyecto": "Residencial Vega",
    "notas": "Cliente prefiere medidas exactas",
    "archivos": [],
    "createdAt": "2026-03-01T10:00:00.000Z",
    "updatedAt": "2026-03-09T10:00:00.000Z"
  }
}
```

**Response 404:**
```json
{
  "success": false,
  "message": "Tarea no encontrada"
}
```

---

#### 3. Crear tarea

```http
POST /api/tareas
```

**Request Body:**
```json
{
  "titulo": "Nueva tarea de diseño",
  "etapa": "disenos",
  "estado": "pendiente",
  "asignadoA": "65f3b2c8e4b0a1234567890a",  // ID del usuario
  "proyecto": "65f3b2c8e4b0a1234567890b",   // ID del proyecto
  "notas": "Notas opcionales"
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Tarea creada exitosamente",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "titulo": "Nueva tarea de diseño",
    "etapa": "disenos",
    "estado": "pendiente",
    "asignadoA": "65f3b2c8e4b0a1234567890a",
    "asignadoANombre": "Valeria",
    "proyecto": "65f3b2c8e4b0a1234567890b",
    "nombreProyecto": "Proyecto X",
    "notas": "Notas opcionales",
    "archivos": [],
    "createdAt": "2026-03-09T10:00:00.000Z",
    "updatedAt": "2026-03-09T10:00:00.000Z"
  }
}
```

---

#### 4. Actualizar tarea

```http
PUT /api/tareas/:id
```

**Request Body:** (todos los campos son opcionales)
```json
{
  "titulo": "Título actualizado",
  "etapa": "cotizacion",
  "estado": "completada",
  "asignadoA": "65f3b2c8e4b0a1234567890c",
  "notas": "Notas actualizadas"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Tarea actualizada exitosamente",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "titulo": "Título actualizado",
    "etapa": "cotizacion",
    "estado": "completada",
    "asignadoA": "65f3b2c8e4b0a1234567890c",
    "asignadoANombre": "Luis",
    "proyecto": "65f3b2c8e4b0a1234567890b",
    "nombreProyecto": "Residencial Vega",
    "notas": "Notas actualizadas",
    "archivos": [],
    "updatedAt": "2026-03-09T10:30:00.000Z"
  }
}
```

---

#### 5. Cambiar etapa (Drag & Drop en Kanban)

```http
PATCH /api/tareas/:id/etapa
```

**Request Body:**
```json
{
  "etapa": "disenos"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Etapa actualizada exitosamente",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "titulo": "Revisar medidas cliente Vega",
    "etapa": "disenos",  // ← Actualizado
    "estado": "pendiente",
    "asignadoA": "65f3b2c8e4b0a1234567890a",
    "asignadoANombre": "Valeria",
    "proyecto": "65f3b2c8e4b0a1234567890b",
    "nombreProyecto": "Residencial Vega",
    "updatedAt": "2026-03-09T10:35:00.000Z"
  }
}
```

---

#### 6. Cambiar estado (Completar tarea)

```http
PATCH /api/tareas/:id/estado
```

**Request Body:**
```json
{
  "estado": "completada"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Estado actualizado exitosamente",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "titulo": "Revisar medidas cliente Vega",
    "etapa": "citas",
    "estado": "completada",  // ← Actualizado
    "asignadoA": "65f3b2c8e4b0a1234567890a",
    "asignadoANombre": "Valeria",
    "proyecto": "65f3b2c8e4b0a1234567890b",
    "nombreProyecto": "Residencial Vega",
    "updatedAt": "2026-03-09T10:40:00.000Z"
  }
}
```

---

#### 7. Agregar archivos a tarea

```http
POST /api/tareas/:id/archivos
```

**Request Body:**
```json
{
  "archivos": [
    {
      "nombre": "Render_final.jpg",
      "tipo": "render",
      "url": "https://s3.amazonaws.com/bucket/archivos/render_final.jpg"
    }
  ]
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Archivos agregados exitosamente",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "titulo": "Revisar medidas cliente Vega",
    "archivos": [
      {
        "id": "65f3c1d8e4b0a1234567890c",
        "nombre": "Render_final.jpg",
        "tipo": "render",
        "url": "https://s3.amazonaws.com/bucket/archivos/render_final.jpg",
        "createdAt": "2026-03-09T10:45:00.000Z"
      }
    ],
    "updatedAt": "2026-03-09T10:45:00.000Z"
  }
}
```

---

#### 8. Eliminar tarea

```http
DELETE /api/tareas/:id
```

**Response 200:**
```json
{
  "success": true,
  "message": "Tarea eliminada exitosamente",
  "data": null
}
```

---

## 📦 Implementación en Frontend

Una vez que estos endpoints estén disponibles, el frontend ya tiene preparado todo para conectarse. Solo se necesita:

### 1. Crear el archivo `tareasApi.ts`

```typescript
// src/lib/axios/tareasApi.ts

import axiosInstance, { ApiResponse } from './axiosConfig';

export interface ArchivoTarea {
  id: string;
  nombre: string;
  tipo: "pdf" | "render" | "otro";
  url?: string;
  createdAt?: Date;
}

export interface Tarea {
  _id: string;
  titulo: string;
  etapa: "citas" | "disenos" | "cotizacion" | "contrato";
  estado: "pendiente" | "completada";
  asignadoA: string;
  asignadoANombre: string;  // Nombre del usuario asignado
  proyecto: string;
  nombreProyecto: string;    // Nombre del proyecto
  notas?: string;
  archivos?: ArchivoTarea[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CrearTareaData {
  titulo: string;
  etapa: "citas" | "disenos" | "cotizacion" | "contrato";
  estado?: "pendiente" | "completada";
  asignadoA: string;  // ID del usuario
  proyecto: string;   // ID del proyecto
  notas?: string;
}

export interface ActualizarTareaData {
  titulo?: string;
  etapa?: "citas" | "disenos" | "cotizacion" | "contrato";
  estado?: "pendiente" | "completada";
  asignadoA?: string;
  notas?: string;
}

export interface FiltrosTareas {
  etapa?: string;
  estado?: string;
  asignadoA?: string;
  proyecto?: string;
}

/**
 * Obtener todas las tareas (con filtros opcionales)
 */
export const obtenerTareas = async (
  filtros?: FiltrosTareas
): Promise<ApiResponse<Tarea[]>> => {
  const response = await axiosInstance.get<ApiResponse<Tarea[]>>('/api/tareas', {
    params: filtros,
  });
  return response.data;
};

/**
 * Obtener tarea por ID
 */
export const obtenerTarea = async (id: string): Promise<ApiResponse<Tarea>> => {
  const response = await axiosInstance.get<ApiResponse<Tarea>>(`/api/tareas/${id}`);
  return response.data;
};

/**
 * Crear nueva tarea
 */
export const crearTarea = async (
  data: CrearTareaData
): Promise<ApiResponse<Tarea>> => {
  const response = await axiosInstance.post<ApiResponse<Tarea>>('/api/tareas', data);
  return response.data;
};

/**
 * Actualizar tarea completa
 */
export const actualizarTarea = async (
  id: string,
  data: ActualizarTareaData
): Promise<ApiResponse<Tarea>> => {
  const response = await axiosInstance.put<ApiResponse<Tarea>>(`/api/tareas/${id}`, data);
  return response.data;
};

/**
 * Cambiar etapa de tarea (para drag & drop en Kanban)
 */
export const cambiarEtapa = async (
  id: string,
  etapa: "citas" | "disenos" | "cotizacion" | "contrato"
): Promise<ApiResponse<Tarea>> => {
  const response = await axiosInstance.patch<ApiResponse<Tarea>>(
    `/api/tareas/${id}/etapa`,
    { etapa }
  );
  return response.data;
};

/**
 * Cambiar estado de tarea (pendiente/completada)
 */
export const cambiarEstado = async (
  id: string,
  estado: "pendiente" | "completada"
): Promise<ApiResponse<Tarea>> => {
  const response = await axiosInstance.patch<ApiResponse<Tarea>>(
    `/api/tareas/${id}/estado`,
    { estado }
  );
  return response.data;
};

/**
 * Agregar archivos a una tarea
 */
export const agregarArchivos = async (
  id: string,
  archivos: Array<{ nombre: string; tipo: string; url: string }>
): Promise<ApiResponse<Tarea>> => {
  const response = await axiosInstance.post<ApiResponse<Tarea>>(
    `/api/tareas/${id}/archivos`,
    { archivos }
  );
  return response.data;
};

/**
 * Eliminar tarea
 */
export const eliminarTarea = async (id: string): Promise<ApiResponse<null>> => {
  const response = await axiosInstance.delete<ApiResponse<null>>(`/api/tareas/${id}`);
  return response.data;
};
```

### 2. Actualizar `src/lib/axios/index.ts`

```typescript
// Agregar esta línea:
export * as tareasApi from './tareasApi';
export * from './tareasApi';
```

### 3. Integrar en el componente empleado

El componente ya está preparado, solo descomentar las líneas marcadas con TODO.

---

## 🎨 proyectosApi (Prioridad Media)

Esta API es necesaria para el timeline público que los clientes pueden ver.

### Base URL
```
http://your-backend-url/api/proyectos
```

### Estructura de Datos

```typescript
interface Proyecto {
  _id: string;
  nombre: string;                     // Nombre del proyecto
  cliente: string;                    // ID del cliente (ref: Usuario)
  nombreCliente: string;              // Nombre del cliente
  tipo: "Cocina" | "Closet" | "vestidor" | "Mueble para el baño";
  estado: "cotizacion" | "aprobado" | "en_produccion" | "instalando" | "completado";
  
  // Timeline público
  timelineActual: string;             // Paso actual visible al cliente
  pasosPosibles: string[];            // Lista de pasos del timeline
  
  // Archivos públicos (visibles al cliente)
  archivosPublicos: ArchivoPublico[];
  
  // Información de pagos
  presupuestoTotal: number;
  anticipo: number;
  segundoPago: number;
  liquidacion: number;
  
  // Referencias
  cotizacion?: string;                // ID de cotización (ref: Cotizacion)
  levantamiento?: string;             // ID de levantamiento (ref: Levantamiento)
  empleadoAsignado?: string;          // ID del empleado (ref: Usuario)
  
  createdAt: Date;
  updatedAt: Date;
}

interface ArchivoPublico {
  id: string;
  nombre: string;
  tipo: "jpg" | "pdf" | "png";
  url: string;
  createdAt: Date;
}
```

### Endpoints Principales

```http
GET    /api/proyectos                    # Listar proyectos
GET    /api/proyectos/:id                # Obtener proyecto
POST   /api/proyectos                    # Crear proyecto
PUT    /api/proyectos/:id                # Actualizar proyecto
PATCH  /api/proyectos/:id/timeline       # Actualizar timeline público
POST   /api/proyectos/:id/archivos       # Agregar archivos públicos
DELETE /api/proyectos/:id/archivos/:fileId  # Eliminar archivo público
```

---

## 📎 archivosApi (Prioridad Media)

API para upload de archivos a S3 o storage.

### Base URL
```
http://your-backend-url/api/archivos
```

### Endpoints

```http
POST /api/archivos/upload
```

**Request:** `multipart/form-data`
```
file: File (binary)
tipo: "render" | "pdf" | "contrato" | "otro"
relacionadoA: "tarea" | "proyecto" | "cotizacion"
relacionadoId: string
```

**Response 200:**
```json
{
  "success": true,
  "message": "Archivo subido exitosamente",
  "data": {
    "id": "65f3c1d8e4b0a1234567890c",
    "nombre": "Render_final.jpg",
    "tipo": "render",
    "url": "https://s3.amazonaws.com/bucket/archivos/render_final.jpg",
    "tamano": 2048576,
    "createdAt": "2026-03-09T10:45:00.000Z"
  }
}
```

---

## 🔐 Seguridad y Permisos

### Roles de Usuario

```typescript
type Rol = "admin" | "arquitecto" | "empleado" | "cliente";
```

### Permisos por Endpoint

| Endpoint | admin | arquitecto | empleado | cliente |
|----------|-------|------------|----------|---------|
| GET /api/tareas | ✅ Todas | ✅ Todas | ✅ Solo propias | ❌ |
| POST /api/tareas | ✅ | ✅ | ✅ | ❌ |
| PUT /api/tareas/:id | ✅ | ✅ | ✅ Solo propias | ❌ |
| DELETE /api/tareas/:id | ✅ | ✅ | ❌ | ❌ |
| GET /api/proyectos | ✅ | ✅ | ✅ | ✅ Solo propios |
| PUT /api/proyectos/:id | ✅ | ✅ | ✅ Asignados | ❌ |

---

## 🧪 Testing

### Datos de Prueba Recomendados

```javascript
// Usuarios de prueba
const usuarios = [
  { _id: "user1", nombre: "Valeria", rol: "arquitecto" },
  { _id: "user2", nombre: "Luis", rol: "empleado" },
  { _id: "user3", nombre: "Carlos", rol: "empleado" },
];

// Proyectos de prueba
const proyectos = [
  { _id: "proj1", nombre: "Residencial Vega", tipo: "Cocina" },
  { _id: "proj2", nombre: "Solaris", tipo: "Cocina" },
  { _id: "proj3", nombre: "Estudio A", tipo: "Closet" },
];

// Tareas de prueba
const tareas = [
  {
    titulo: "Revisar medidas cliente Vega",
    etapa: "citas",
    estado: "pendiente",
    asignadoA: "user1",
    proyecto: "proj1"
  },
  {
    titulo: "Diseño cocina Solaris",
    etapa: "disenos",
    estado: "pendiente",
    asignadoA: "user1",
    proyecto: "proj2"
  }
];
```

---

## 📞 Contacto y Soporte

**Frontend Team:**
- Archivo principal: `src/app/dashboard/empleado/page.tsx`
- Config: `src/lib/axios/`
- Tipos: `src/lib/kanban.ts`

**Documentación:**
- [CODIGO_LIMPIO.md](./CODIGO_LIMPIO.md) - Estado del código frontend
- [src/lib/axios/README.md](./src/lib/axios/README.md) - Guía de APIs existentes

---

## ✅ Checklist de Implementación

### Para Backend:

- [ ] Crear modelo `Tarea` en MongoDB con todos los campos
- [ ] Implementar los 8 endpoints de tareasApi
- [ ] Poblar `asignadoANombre` y `nombreProyecto` en respuestas
- [ ] Configurar CORS para permitir peticiones del frontend
- [ ] Implementar validaciones (etapa válida, estado válido, etc.)
- [ ] Crear modelo `Proyecto` con timeline público
- [ ] Implementar endpoints de proyectosApi
- [ ] Configurar upload de archivos (S3/Cloudinary)
- [ ] Implementar permisos por rol
- [ ] Documentar endpoints en Postman/Swagger

### Para Frontend:

- [ ] Crear archivo `src/lib/axios/tareasApi.ts`
- [ ] Exportar en `src/lib/axios/index.ts`
- [ ] Descomentar imports en empleado/page.tsx
- [ ] Reemplazar localStorage por llamadas a tareasApi
- [ ] Implementar manejo de errores
- [ ] Agregar loading states
- [ ] Testing de integración

---

## 🚀 Ejemplo de Flujo Completo

### Escenario: Usuario arrastra tarea en el Kanban

**1. Frontend detecta drag & drop:**
```typescript
const handleDrop = async (taskId: string, newStage: TaskStage) => {
  try {
    // Llamada al backend
    const response = await tareasApi.cambiarEtapa(taskId, newStage);
    
    if (response.success) {
      // Actualizar estado local
      setKanbanTasks(prev => 
        prev.map(task => 
          task.id === taskId 
            ? { ...task, stage: newStage }
            : task
        )
      );
    }
  } catch (error) {
    console.error('Error al mover tarea:', error);
    // Revertir cambio en UI
  }
};
```

**2. Backend recibe petición:**
```http
PATCH /api/tareas/507f1f77bcf86cd799439011/etapa
Authorization: Bearer {token}

{
  "etapa": "disenos"
}
```

**3. Backend actualiza MongoDB:**
```javascript
const tarea = await Tarea.findByIdAndUpdate(
  req.params.id,
  { etapa: req.body.etapa },
  { new: true }
).populate('asignadoA', 'nombre')
 .populate('proyecto', 'nombre');

res.json({
  success: true,
  message: 'Etapa actualizada exitosamente',
  data: {
    _id: tarea._id,
    titulo: tarea.titulo,
    etapa: tarea.etapa,  // ← Actualizado a "disenos"
    asignadoANombre: tarea.asignadoA.nombre,
    nombreProyecto: tarea.proyecto.nombre,
    // ... resto de campos
  }
});
```

**4. Frontend recibe respuesta y actualiza UI** ✅

---

## 📝 Notas Importantes

1. **Nombres vs IDs:** El frontend necesita tanto IDs (para operaciones) como nombres (para mostrar en UI). Por favor poblar ambos campos.

2. **Formato de Respuesta:** Seguir el patrón `{ success, message, data }` usado en todas las APIs existentes.

3. **Manejo de Errores:** Enviar códigos HTTP apropiados (404, 401, 500) y mensajes descriptivos.

4. **Fechas:** Enviar fechas en formato ISO 8601 (`2026-03-09T10:00:00.000Z`).

5. **Validaciones:** El backend debe validar:
   - Etapas válidas: solo "citas", "disenos", "cotizacion", "contrato"
   - Estados válidos: solo "pendiente", "completada"
   - IDs válidos (MongoDB ObjectId)
   - Usuario asignado existe
   - Proyecto existe

---

## 🎉 Resultado Esperado

Una vez implementados estos endpoints, el frontend funcionará completamente:

- ✅ Tablero Kanban con drag & drop persistente
- ✅ Filtrado por usuario (mis tareas / todas)
- ✅ Actualización en tiempo real entre pestañas
- ✅ Upload de archivos funcionando
- ✅ Timeline público visible al cliente
- ✅ Sistema completamente integrado

---

**¿Dudas o preguntas?**
Revisar el código frontend en `src/app/dashboard/empleado/page.tsx` - está completamente documentado y listo para usar estos endpoints.

**Última actualización:** Marzo 9, 2026
