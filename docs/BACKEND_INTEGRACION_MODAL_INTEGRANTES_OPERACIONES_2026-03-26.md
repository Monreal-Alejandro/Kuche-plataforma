# Backend Integracion Modal Integrantes (Operaciones)

Fecha: 2026-03-26
Frontend impactado:
- `src/app/admin/operaciones/page.tsx`
- `src/lib/axios/usuariosApi.ts`

## 1. Objetivo

En el modal de `Integrantes` del modulo `admin/operaciones` ahora se puede:
- Ver integrantes actuales.
- Crear un nuevo integrante desde UI.

El frontend ya quedo conectado para crear usuario via `POST /api/usuarios` y refrescar listado.

## 2. Contrato de API requerido

### Endpoint

- `POST /api/usuarios`

### Body esperado (JSON)

```json
{
  "nombre": "Juan Perez",
  "correo": "juan@empresa.com",
  "rol": "empleado",
  "password": "opcional"
}
```

Notas:
- `password` es opcional en frontend. Si backend lo requiere como obligatorio, devolver error claro.
- `rol` soportado por frontend: `admin | arquitecto | empleado`.

### Respuesta esperada (exito)

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "nombre": "Juan Perez",
    "correo": "juan@empresa.com",
    "rol": "empleado",
    "activo": true,
    "createdAt": "2026-03-26T...",
    "updatedAt": "2026-03-26T..."
  },
  "message": "Usuario creado correctamente"
}
```

### Respuesta esperada (error)

```json
{
  "success": false,
  "message": "Descripcion del error"
}
```

Errores sugeridos:
- 400: faltan campos o formato invalido.
- 409: correo ya existe.
- 401/403: no autorizado.

## 3. Endpoints de lectura usados por el modal

Para recargar la lista despues de crear:
- `GET /api/usuarios`
- `GET /api/usuarios/empleados` (fallback)

Formato esperado por item:

```json
{
  "_id": "...",
  "nombre": "...",
  "correo": "...",
  "rol": "empleado",
  "activo": true
}
```

## 4. Flujo frontend ya implementado

1. Usuario abre `Integrantes`.
2. Captura `nombre`, `correo`, `rol`, `password opcional`.
3. Front envia `POST /api/usuarios`.
4. Si `success=true`, limpia formulario y vuelve a cargar lista de integrantes.
5. Si falla, muestra mensaje en modal (`teamError`).

## 5. Validaciones frontend ya activas

- Nombre requerido.
- Correo requerido.
- Correo con formato basico valido.

## 6. Recomendaciones backend para engranar al 100%

- Devolver `message` consistente en todos los errores para mostrar feedback claro.
- En conflicto de correo, responder `409` con `success=false` y mensaje explicito.
- Mantener `activo=true` por default al crear integrante operativo.
- Si password es requerido, especificar mensaje exacto (`password es obligatorio`) para UX clara.

## 7. Prueba manual recomendada

1. Abrir `admin/operaciones`.
2. Click en `Integrantes`.
3. Crear integrante nuevo.
4. Verificar que aparece en la lista inmediatamente.
5. Verificar que aparece tambien en modal de `Asignar pendiente` como responsable seleccionable.
