# Prompt especializado para Backend — Flujo de Citas en Kanban

Fecha: 2026-03-13

Actúa como arquitecto backend senior en Node.js + Express + MongoDB (Mongoose).
Necesito que ajustes el backend para soportar el flujo real del frontend de agenda/kanban de citas.

## Objetivo funcional

1. Poder asignar un trabajador (ingeniero/arquitecto/admin) a una cita.
2. Poder iniciar una cita.
3. Poder finalizar una cita.
4. Reflejar esos cambios en la vista Kanban (`/api/kanban/citas`) y en el detalle de cita.

## Contrato de API obligatorio (mantener formato)

Todas las respuestas deben ser:

- Éxito: `{ success: true, data: ..., message?: string }`
- Error: `{ success: false, message: string, error?: string }`

## Endpoints que deben existir y funcionar

### 1) Asignar trabajador

- Método: `PUT`
- Ruta: `/api/citas/:id/asignarIngeniero`
- Body: `{ "ingenieroId": "<ObjectId>" }`

Debe validar:

- La cita existe.
- El usuario existe.
- El usuario tiene rol permitido para asignación.

**Roles permitidos para asignar en este proyecto (obligatorio):**

- `admin`
- `arquitecto`
- `ingeniero`

Respuesta esperada por frontend:

```json
{
  "success": true,
  "data": {
    "message": "Trabajador asignado correctamente",
    "cita": { "...": "citaActualizada" }
  }
}
```

### 2) Iniciar cita

- Método: `PUT`
- Ruta: `/api/citas/:id/iniciar`
- Body opcional con especificaciones iniciales:
  - `medidas`, `estilo`, `especificaciones`, `materialesPreferidos`

Reglas:

- Solo permitir iniciar si estado actual es `programada` (o equivalente de negocio).
- Setear `estado = en_proceso`.
- Setear `fechaInicio` si no existe.

Respuesta:

```json
{
  "success": true,
  "data": {
    "message": "Cita iniciada correctamente",
    "cita": { "...": "citaActualizada" }
  }
}
```

### 3) Finalizar cita

- Método: `PUT`
- Ruta: `/api/citas/:id/finalizar`
- Body opcional: `notasInternas`, `fechaEstimadaFinalizacion`, etc.

Reglas:

- Solo permitir finalizar si estado actual es `en_proceso`.
- Setear `estado = completada`.
- Setear `fechaTermino` (server time).
- Si negocio lo requiere, crear `ordenTrabajo` y devolverla.

Respuesta:

```json
{
  "success": true,
  "data": {
    "message": "Cita finalizada correctamente",
    "cita": { "...": "citaActualizada" },
    "ordenTrabajo": { "...": "opcional" }
  }
}
```

### 4) Compatibilidad actual del frontend (NO romper)

- Método: `PUT`
- Ruta: `/api/citas/updateEstado/:id`
- Body: `{ "estado": "programada|en_proceso|completada|cancelada", "fechaTermino?": "ISO" }`

Debe seguir funcionando para cambios rápidos desde frontend.

### 5) Fuente Kanban por columna

- Método: `GET`
- Ruta: `/api/kanban/citas`

Debe devolver `data[]` con esta estructura mínima:

- `_id`
- `titulo`
- `etapa`
- `estado`
- `asignadoA`
- `asignadoANombre`
- `proyecto`
- `nombreProyecto`
- `notas`
- `archivos`
- `raw`

Importante:

- `etapa` debe ser `citas`.
- `estado` debe ser consistente con la UI (idealmente normalizado a `pendiente|completada` para tarjeta, o documentar claramente el mapeo si usan estado de dominio).

## Reglas de transición de estado (obligatorias)

- `programada -> en_proceso` ✅
- `en_proceso -> completada` ✅
- Evitar saltos inválidos por defecto (ej. `programada -> completada`), salvo regla explícita de negocio.
- Si transición es inválida: responder `409` o `400` con mensaje claro.

## Seguridad y permisos

- JWT obligatorio en endpoints protegidos.
- Permisos sugeridos:
  - Asignar trabajador: `admin` y/o coordinador autorizado.
  - Iniciar/finalizar: trabajador asignado (`admin|arquitecto|ingeniero`) o `admin`.
- Validar ownership cuando aplique.

## Persistencia y consistencia

- Guardar correctamente `updatedAt`, `fechaInicio`, `fechaTermino`.
- Mantener historial de estado (`historialEstados`) para auditoría.
- Tras mutación, `GET /api/kanban/citas` debe reflejar el cambio inmediatamente.

## CORS y headers

Permitir al menos:

- `Authorization`
- `Accept`
- `Content-Type`

Responder JSON consistente en éxitos y errores.

## Entregables mínimos

1. Controladores/servicios actualizados con validaciones.
2. Rutas Express conectadas y documentadas.
3. Tests de integración mínimos:
   - asignar trabajador OK/ERROR
   - iniciar cita OK/ERROR
   - finalizar cita OK/ERROR
   - transición inválida
4. Colección Postman/Thunder con ejemplos.

## Criterio de aceptación final

Desde frontend debe poderse:

1. Asignar trabajador a la cita y ver el nombre actualizado.
2. Iniciar cita y ver estado/fechaInicio persistidos.
3. Finalizar cita y ver estado/fechaTermino persistidos.
4. Refrescar tablero y seguir viendo los cambios en `/api/kanban/citas`.

## Nota de negocio (importante)

Para el campo de asignación de trabajador en citas, los únicos roles válidos para ser asignados son:

- `admin`
- `arquitecto`
- `ingeniero`

Cualquier otro rol debe rechazarse con `400` + mensaje descriptivo.
