# API Client - Estructura de Axios

Esta carpeta contiene toda la configuración de Axios y los endpoints de la API organizados por módulos.

## 📁 Estructura

```
lib/axios/
├── axiosConfig.ts          # Configuración base de Axios con interceptores
├── authApi.ts              # API de autenticación (login, register, logout)
├── levantamientosApi.ts    # API de levantamientos rápidos
├── cotizacionesApi.ts      # API de cotizaciones detalladas
├── catalogosApi.ts         # API de catálogos (materiales, herrajes, etc.)
├── usuariosApi.ts          # API de usuarios/empleados
├── citasApi.ts             # API de citas de levantamiento
├── index.ts                # Exportaciones centralizadas
└── README.md               # Esta documentación
```

## 🚀 Uso Básico

### Importar APIs

```typescript
// Importar todo desde el index
import { authApi, levantamientosApi, cotizacionesApi } from '@/lib/axios';

// Importar tipos también
import type { Levantamiento, CotizacionCreate } from '@/lib/axios';
```

### Ejemplos de Uso

#### Autenticación

```typescript
import { authApi } from '@/lib/axios';

// Login
const handleLogin = async () => {
  try {
    const response = await authApi.login({
      email: 'usuario@example.com',
      password: 'password123'
    });
    
    if (response.success) {
      console.log('Usuario:', response.data.user);
      // Token se guarda automáticamente
    }
  } catch (error) {
    console.error('Error en login:', error);
  }
};

// Logout
const handleLogout = async () => {
  await authApi.logout();
  // Token se elimina automáticamente
};

// Verificar autenticación
const isLoggedIn = authApi.isAuthenticated();
```

#### Levantamientos

```typescript
import { levantamientosApi } from '@/lib/axios';

// Crear levantamiento
const crearLevantamiento = async () => {
  const response = await levantamientosApi.crearLevantamiento({
    cliente: {
      nombre: 'Juan Pérez',
      direccion: 'Calle 123, Ciudad',
      telefono: '5551234567'
    },
    metrosLineales: 6,
    tipoCubierta: 'Granito Básico',
    escenarioSeleccionado: 'tendencia',
    requiereIsla: true,
    alacenasAltas: false
  });
  
  if (response.success) {
    console.log('Levantamiento creado:', response.data);
  }
};

// Listar con filtros
const listarLevantamientos = async () => {
  const response = await levantamientosApi.listarLevantamientos({
    estado: 'pendiente',
    page: 1,
    limit: 10
  });
  
  if (response.success) {
    console.log('Levantamientos:', response.data);
    console.log('Paginación:', response.pagination);
  }
};

// Cambiar estado
const cambiarEstado = async (id: string) => {
  const response = await levantamientosApi.cambiarEstadoLevantamiento(id, {
    estado: 'en_revision',
    notas: 'Asignado para revisión'
  });
};
```

#### Cotizaciones

```typescript
import { cotizacionesApi } from '@/lib/axios';

// Crear cotización
const crearCotizacion = async () => {
  const response = await cotizacionesApi.crearCotizacion({
    cliente: 'María García',
    tipoProyecto: 'Cocina',
    ubicacion: 'CDMX',
    fechaInstalacion: '2026-03-15',
    medidas: {
      largo: 4.2,
      alto: 2.4,
      fondo: 0.6,
      metrosLineales: 6
    },
    materialBase: 'melamina',
    colorTextura: 'Blanco Nieve',
    grosorTablero: '16',
    herrajes: [
      {
        nombre: 'Correderas cierre suave',
        precioUnitario: 500,
        enabled: true,
        cantidad: 6
      }
    ],
    manoDeObra: 12000,
    flete: 2500
  });
  
  if (response.success) {
    console.log('Cotización creada:', response.data);
    console.log('Precio final:', response.data.precioFinal);
  }
};

// Guardar borrador
const guardarBorrador = async (data) => {
  const response = await cotizacionesApi.guardarBorrador(data);
};
```

#### Catálogos

```typescript
import { catalogosApi } from '@/lib/axios';

// Obtener materiales
const cargarMateriales = async () => {
  const response = await catalogosApi.obtenerMateriales();
  if (response.success) {
    console.log('Materiales:', response.data);
  }
};

// Obtener herrajes
const cargarHerrajes = async () => {
  const response = await catalogosApi.obtenerHerrajes();
  if (response.success) {
    console.log('Herrajes:', response.data);
  }
};
```

#### Usuarios/Empleados

```typescript
import { usuariosApi } from '@/lib/axios';

// Listar empleados para asignación
const cargarEmpleados = async () => {
  const response = await usuariosApi.listarEmpleados();
  if (response.success) {
    console.log('Empleados:', response.data);
  }
};
```

#### Citas

```typescript
import { citasApi } from '@/lib/axios';

// Crear cita (ruta pública, no requiere autenticación)
const agendarCita = async () => {
  const response = await citasApi.crearCita({
    fechaAgendada: new Date('2026-03-15T10:00:00'),
    nombreCliente: 'Carlos López',
    correoCliente: 'carlos@example.com',
    telefonoCliente: '5551234567',
    ubicacion: 'Av. Principal 123, CDMX',
    informacionAdicional: 'Cocina completa'
  });
  
  if (response.success) {
    console.log('Cita creada:', response.data);
  }
};

// Obtener todas las citas (Admin)
const listarCitas = async () => {
  const response = await citasApi.obtenerTodasLasCitas();
  if (response.success) {
    console.log('Citas:', response.data);
  }
};

// Asignar ingeniero a cita (Solo admin)
const asignarIngeniero = async (citaId: string, ingenieroId: string) => {
  const response = await citasApi.asignarIngeniero(citaId, { ingenieroId });
  if (response.success) {
    console.log('Ingeniero asignado:', response.data);
  }
};

// Iniciar cita (cambia estado a en_proceso)
const iniciarCita = async (citaId: string) => {
  const response = await citasApi.iniciarCita(citaId, {
    medidas: '4m x 2m',
    estilo: 'Moderno',
    materialesPreferidos: ['Granito', 'Madera']
  });
  if (response.success) {
    console.log('Cita iniciada:', response.data);
  }
};

// Finalizar cita (crea orden de trabajo)
const finalizarCita = async (citaId: string) => {
  const response = await citasApi.finalizarCita(citaId, {
    ingenieroId: '123456',
    fechaEstimadaFinalizacion: new Date('2026-04-15'),
    notasInternas: 'Proyecto de cocina moderna'
  });
  if (response.success) {
    console.log('Cita finalizada:', response.data);
    console.log('Orden de trabajo:', response.data.ordenTrabajo);
  }
};

// Obtener citas del ingeniero autenticado
const misCitas = async () => {
  const response = await citasApi.obtenerCitasIngeniero();
  if (response.success) {
    console.log('Mis citas:', response.data.citas);
    console.log('Total:', response.data.total);
  }
};
```

## 🔧 Configuración

### Variables de Entorno

Crear archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Para producción:
```env
NEXT_PUBLIC_API_URL=https://api.kuche.com
```

### Interceptores

El archivo `axiosConfig.ts` incluye interceptores que:

1. **Request Interceptor:**
   - Agrega automáticamente el token JWT en el header `Authorization`
   - Lee el token del `localStorage`

2. **Response Interceptor:**
   - Maneja errores 401 (no autorizado) redirigiendo a `/login`
   - Maneja errores 403, 404, 500 con logs apropiados
   - Limpia el token si está expirado

## 📝 Formato de Respuestas

Todas las respuestas siguen el mismo formato:

### Éxito

```typescript
{
  success: true,
  data: {...},
  message?: "Mensaje opcional",
  pagination?: {  // Solo en listados
    total: 100,
    page: 1,
    pages: 10,
    limit: 10
  }
}
```

### Error

```typescript
{
  success: false,
  message: "Descripción del error",
  error?: "Detalle técnico"
}
```

## 🔒 Autenticación

### Token JWT

El token se guarda automáticamente en:
- `localStorage.setItem('authToken', token)`
- Se envía automáticamente en cada request
- Se elimina automáticamente en logout o 401

### Usuario

El usuario se guarda en:
- `localStorage.setItem('user', JSON.stringify(user))`

### Verificar autenticación

```typescript
import { authApi } from '@/lib/axios';

const isLoggedIn = authApi.isAuthenticated();
const user = authApi.getUserFromStorage();
```

## 🎯 Tipos TypeScript

Todos los tipos están exportados desde `index.ts`:

```typescript
import type {
  // Auth
  User,
  LoginCredentials,
  
  // Levantamientos
  Levantamiento,
  LevantamientoCreate,
  
  // Cotizaciones
  Cotizacion,
  CotizacionCreate,
  
  // Catálogos
  Material,
  Herraje,
  
  // Respuestas
  ApiResponse,
  ApiSuccessResponse,
  ApiErrorResponse
} from '@/lib/axios';
```

## ⚡ Manejo de Errores

```typescript
import { AxiosError } from 'axios';
import type { ApiErrorResponse } from '@/lib/axios';

try {
  const response = await levantamientosApi.crearLevantamiento(data);
  
  if (response.success) {
    // Éxito
    console.log(response.data);
  }
} catch (error) {
  if (error instanceof AxiosError) {
    const apiError = error.response?.data as ApiErrorResponse;
    console.error('Error:', apiError.message);
  }
}
```

## 🚦 Estados

### Levantamientos
- `pendiente` - Recién creado
- `en_revision` - Asignado a empleado
- `contactado` - Cliente contactado
- `cotizado` - Convertido a cotización
- `rechazado` - Rechazado por cliente
- `archivado` - Archivado

### Cotizaciones
- `borrador` - En edición
- `enviada` - Enviada a cliente
- `aprobada` - Aprobada por cliente
- `en_produccion` - En taller
- `lista_instalacion` - Lista para instalar
- `instalada` - Instalada
- `rechazada` - Rechazada
- `archivada` - Archivada

## 📚 Recursos Adicionales

- [Documentación de Axios](https://axios-http.com/)
- [Next.js Environment Variables](https://nextjs.org/docs/pages/building-your-application/configuring/environment-variables)
- Documento backend: `CAMBIOS_REALIZADOS.md`
- Prompt backend: `PROMPT_BACKEND_KUCHE.txt`

---

✅ **Estructura lista para conectar frontend con backend**
