# Backend Faltantes para Confirmar/Inactivo (Diagnostico Front)

Fecha: 2026-03-26

## Problema observado
En el tablero de operaciones, al pulsar `Confirmar cliente` o `Marcar inactivo`, el frontend ejecuta la accion pero el estado puede volver sin cambios tras `refresh`.

Esto indica un posible no-op del backend en `PATCH /api/tareas/:id` para los campos de seguimiento.

## Evidencia del flujo actual
1. Front envia `PATCH /api/tareas/:id` con payload minimo:
```json
{
  "followUpStatus": "confirmado|inactivo",
  "estado": "completada",
  "followUpEnteredAt": 1710000000000
}
```
2. Front vuelve a pedir tablero (`refresh`) y valida el mismo `task.id`.
3. Si el backend no persiste `followUpStatus`, el front muestra mensaje:
- `El backend no guardo 'confirmado'...`
- `El backend no guardo 'inactivo'...`

## Requerimientos minimos backend

### 1) Endpoint PATCH /api/tareas/:id debe persistir
Campos requeridos:
- `followUpStatus`: `pendiente | confirmado | inactivo`
- `estado`: `pendiente | completada`
- `followUpEnteredAt`: `number` (opcional)

### 2) Endpoint GET /api/tareas y endpoints kanban deben devolver
En cada tarjeta de `etapa=contrato`:
- `followUpStatus`
- `followUpEnteredAt`

Si falta cualquiera de esos campos, el frontend no puede reflejar bien el cambio.

### 3) Compatibilidad backward
Si llega `followUpStatus=descartado`, convertir a `inactivo` y devolver `inactivo`.

### 4) Regla de negocio esperada
- Confirmar cliente:
  - `followUpStatus = confirmado`
  - `estado = completada`
- Marcar inactivo:
  - `followUpStatus = inactivo`
  - `estado = completada`
- Reactivar:
  - `followUpStatus = pendiente`
  - `estado = pendiente`
  - `followUpEnteredAt = Date.now()`

## Pruebas backend sugeridas (manual)

### Caso A: Confirmar cliente
```http
PATCH /api/tareas/:id
Content-Type: application/json

{
  "followUpStatus": "confirmado",
  "estado": "completada"
}
```
Validar con:
```http
GET /api/tareas/:id
```
Esperado:
```json
{
  "followUpStatus": "confirmado",
  "estado": "completada"
}
```

### Caso B: Marcar inactivo
```http
PATCH /api/tareas/:id
Content-Type: application/json

{
  "followUpStatus": "inactivo",
  "estado": "completada"
}
```
Validar con:
```http
GET /api/tareas/:id
```
Esperado:
```json
{
  "followUpStatus": "inactivo",
  "estado": "completada"
}
```

### Caso C: Compatibilidad descartado
```http
PATCH /api/tareas/:id
Content-Type: application/json

{
  "followUpStatus": "descartado"
}
```
Esperado al leer:
```json
{
  "followUpStatus": "inactivo"
}
```

## Nota tecnica importante
Si el controlador backend usa whitelist de campos para update, verificar que incluya explicitamente:
- `followUpStatus`
- `followUpEnteredAt`
- `estado`

Si no estan en la whitelist, el endpoint puede responder success sin cambiar nada.
