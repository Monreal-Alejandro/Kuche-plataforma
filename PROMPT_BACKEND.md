# 🤖 Prompt para Generar Backend - taskApi

Copia y pega este prompt en tu LLM favorito (ChatGPT, Claude, etc.) para generar el código del backend.

---

## PROMPT PARA LLM:

```
Necesito que me generes el backend completo para una API de tareas (tareasApi) en Node.js + Express + MongoDB (Mongoose) + TypeScript.

### CONTEXTO DEL PROYECTO:
- Sistema de gestión de cocinas inteligentes
- Frontend en Next.js ya está completo y espera estos endpoints
- Ya existe autenticación con JWT (middleware ya implementado)
- Patrón de respuesta usado en el proyecto: { success: boolean, message: string, data: any }

### MODELO DE DATOS (MongoDB/Mongoose):

```typescript
// Tarea Model
interface ITarea {
  titulo: string;                      // required
  etapa: "citas" | "disenos" | "cotizacion" | "contrato";  // required
  estado: "pendiente" | "completada";  // default: "pendiente"
  asignadoA: ObjectId;                 // ref: 'Usuario', required
  proyecto: ObjectId;                  // ref: 'Proyecto', required
  notas?: string;                      // optional
  archivos?: Array<{
    id: string;
    nombre: string;
    tipo: "pdf" | "render" | "otro";
    url: string;
    createdAt: Date;
  }>;
  creadoPor?: ObjectId;                // ref: 'Usuario'
  createdAt: Date;
  updatedAt: Date;
}
```

### ENDPOINTS REQUERIDOS:

1. **GET /api/tareas** 
   - Obtener todas las tareas con filtros opcionales (query params: etapa, estado, asignadoA, proyecto)
   - Poblar: asignadoA (nombre), proyecto (nombre)
   - Respuesta: array de tareas con campos adicionales `asignadoANombre` y `nombreProyecto`

2. **GET /api/tareas/:id**
   - Obtener tarea por ID
   - Poblar: asignadoA (nombre), proyecto (nombre)
   - Error 404 si no existe

3. **POST /api/tareas**
   - Crear nueva tarea
   - Body: { titulo, etapa, estado?, asignadoA, proyecto, notas? }
   - Validar que etapa y estado sean valores válidos
   - Respuesta 201 con tarea creada

4. **PUT /api/tareas/:id**
   - Actualizar tarea completa
   - Body: { titulo?, etapa?, estado?, asignadoA?, notas? }
   - Solo el propietario o admin puede actualizar
   - Respuesta 200 con tarea actualizada

5. **PATCH /api/tareas/:id/etapa**
   - Cambiar solo la etapa (para drag & drop)
   - Body: { etapa: string }
   - Validar etapa válida
   - Respuesta 200 con tarea actualizada

6. **PATCH /api/tareas/:id/estado**
   - Cambiar solo el estado
   - Body: { estado: "pendiente" | "completada" }
   - Respuesta 200 con tarea actualizada

7. **POST /api/tareas/:id/archivos**
   - Agregar archivos a la tarea
   - Body: { archivos: [{nombre, tipo, url}] }
   - Respuesta 200 con tarea actualizada

8. **DELETE /api/tareas/:id**
   - Eliminar tarea
   - Solo admin puede eliminar
   - Respuesta 200 con mensaje de éxito

### MIDDLEWARE DE AUTENTICACIÓN:
Asume que ya existe un middleware `authenticate` que agrega `req.user` con:
```typescript
req.user = {
  _id: string,
  nombre: string,
  rol: "admin" | "arquitecto" | "empleado" | "cliente"
}
```

### VALIDACIONES NECESARIAS:
- Etapa solo puede ser: "citas", "disenos", "cotizacion", "contrato"
- Estado solo puede ser: "pendiente", "completada"
- IDs deben ser ObjectId válidos
- Usuario asignado debe existir
- Proyecto debe existir

### PERMISOS:
- Admin: CRUD completo
- Arquitecto: CRUD completo
- Empleado: Solo puede ver y editar tareas asignadas a él
- Cliente: No puede acceder a tareas

### FORMATO DE RESPUESTA:
Todas las respuestas deben seguir este formato:
```typescript
// Success
{
  success: true,
  message: "Descripción de la operación",
  data: { ... }
}

// Error
{
  success: false,
  message: "Descripción del error"
}
```

### REQUERIMIENTOS TÉCNICOS:
- Node.js + Express + TypeScript
- Mongoose para MongoDB
- express-validator para validaciones
- Manejo de errores con try/catch
- Códigos HTTP apropiados (200, 201, 400, 401, 404, 500)
- Logging básico con console.log
- Comentarios en código para entender la lógica

### ESTRUCTURA DESEADA:
```
src/
├── models/
│   └── Tarea.ts               # Mongoose model
├── controllers/
│   └── tareasController.ts    # Lógica de negocio
├── routes/
│   └── tareasRoutes.ts        # Definición de rutas
├── middleware/
│   ├── auth.ts               # Ya existe (no generar)
│   └── validations.ts        # Validaciones específicas (opcional)
└── types/
    └── tarea.types.ts        # Tipos TypeScript
```

Por favor genera:
1. El modelo Mongoose completo (Tarea.ts)
2. El controlador con todos los 8 endpoints (tareasController.ts)
3. Las rutas configuradas (tareasRoutes.ts)
4. Tipos TypeScript necesarios (tarea.types.ts)

Incluye:
- Manejo de errores robusto
- Validaciones en cada endpoint
- Poblado (populate) de referencias para devolver nombres
- Comentarios explicativos
- Logging básico
- Código listo para producción
```

---

## PROMPT ALTERNATIVO (MÁS SIMPLE):

```
Genera un CRUD completo de tareas (tareasApi) para Node.js + Express + MongoDB + TypeScript.

Modelo Tarea:
- titulo: string (required)
- etapa: enum ["citas", "disenos", "cotizacion", "contrato"]
- estado: enum ["pendiente", "completada"]
- asignadoA: ref Usuario (required)
- proyecto: ref Proyecto (required)
- notas: string (optional)
- archivos: array de {id, nombre, tipo, url}

Endpoints:
1. GET /api/tareas - Listar con filtros (query params)
2. GET /api/tareas/:id - Obtener una
3. POST /api/tareas - Crear
4. PUT /api/tareas/:id - Actualizar
5. PATCH /api/tareas/:id/etapa - Cambiar solo etapa
6. PATCH /api/tareas/:id/estado - Cambiar solo estado
7. POST /api/tareas/:id/archivos - Agregar archivos
8. DELETE /api/tareas/:id - Eliminar

Formato respuesta: { success: boolean, message: string, data: any }
Auth: JWT middleware ya existe (req.user)
Permisos: Admin=todo, Empleado=solo sus tareas

Incluye validaciones, manejo de errores, populate de referencias, y comentarios.
```

---

## 📋 CHECKLIST POST-GENERACIÓN:

Después de que el LLM genere el código, verifica:

- [ ] Modelo tiene todos los campos necesarios
- [ ] Validaciones de enum están presentes
- [ ] Populate de asignadoA y proyecto funciona
- [ ] Campos `asignadoANombre` y `nombreProyecto` se agregan en respuesta
- [ ] Manejo de errores en todos los endpoints
- [ ] Códigos HTTP correctos (200, 201, 400, 404, 500)
- [ ] Middleware de autenticación se aplica a todas las rutas
- [ ] Permisos por rol implementados
- [ ] Validaciones de ObjectId con Mongoose
- [ ] Try/catch en todos los controladores
- [ ] Respuestas siguen el patrón { success, message, data }

---

## 🧪 TESTING:

Una vez implementado, prueba con estos datos:

```bash
# 1. Crear tarea
POST http://localhost:5000/api/tareas
Authorization: Bearer {tu-token}
Content-Type: application/json

{
  "titulo": "Revisar medidas cliente Vega",
  "etapa": "citas",
  "estado": "pendiente",
  "asignadoA": "65f3b2c8e4b0a1234567890a",
  "proyecto": "65f3b2c8e4b0a1234567890b",
  "notas": "Cliente prefiere medidas exactas"
}

# 2. Listar tareas
GET http://localhost:5000/api/tareas
Authorization: Bearer {tu-token}

# 3. Cambiar etapa (drag & drop)
PATCH http://localhost:5000/api/tareas/507f1f77bcf86cd799439011/etapa
Authorization: Bearer {tu-token}
Content-Type: application/json

{
  "etapa": "disenos"
}

# 4. Completar tarea
PATCH http://localhost:5000/api/tareas/507f1f77bcf86cd799439011/estado
Authorization: Bearer {tu-token}
Content-Type: application/json

{
  "estado": "completada"
}
```

---

## 🔗 INTEGRACIÓN CON FRONTEND:

El frontend ya tiene el código preparado en:
- `src/lib/axios/tareasApi.ts` (crear este archivo con el código del spec)
- `src/app/dashboard/empleado/page.tsx` (ya preparado, solo descomentar imports)

Ver archivo completo: `BACKEND_API_SPECS.md`

---

## ⚡ QUICK START:

1. Copia el PROMPT PARA LLM
2. Pégalo en ChatGPT/Claude
3. Copia el código generado
4. Colócalo en tu proyecto backend
5. Instala dependencias: `npm install express mongoose express-validator`
6. Configura tu MongoDB connection string
7. Importa las rutas en tu `app.ts` o `server.ts`:
   ```typescript
   import tareasRoutes from './routes/tareasRoutes';
   app.use('/api/tareas', authenticate, tareasRoutes);
   ```
8. Prueba los endpoints con Postman/Thunder Client
9. El frontend automáticamente se conectará ✅

---

**Última actualización:** Marzo 9, 2026
**Para más detalles:** Ver `BACKEND_API_SPECS.md`
