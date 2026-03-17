# Guía Payload — Materiales / Herrajes (Frontend ↔ Backend)

Fecha: 2026-03-17

Esta guía documenta cómo quedó implementado el frontend para cumplir con la especificación de payload de materiales/herrajes y qué debe responder backend.

---

## 1) Estado final implementado

Frontend admin (`/admin/precios`) ya envía payloads compatibles con la especificación:

- `nombre` (requerido)
- `unidadMedida` (requerido para material; en herraje se envía por default)
- `categoria` (requerido para material; en herraje se envía por default)
- `precioUnitario` (requerido)
- `descripcion` (opcional)
- `seccion` (opcional)
- `proveedor` (opcional)
- `activo` (opcional)

Compatibilidad adicional enviada por frontend:

- `precioMetroLineal` también se manda en materiales para compatibilidad con backends legacy.

---

## 2) Reglas de negocio aplicadas en frontend

## Materiales

- Requiere en formulario: `nombre`, `precio`, `unidadMedida`, `categoria`.
- `unidadMedida` se selecciona de la lista permitida.
- `categoria` se selecciona de la lista permitida.

## Herrajes

- Frontend manda explícitamente por convenio:
  - `categoria: "Herrajes"`
  - `unidadMedida: "unidad"`
- Esto evita depender de defaults implícitos y reduce errores de validación.

---

## 3) Listas válidas (case-sensitive)

## unidadMedida

- `m²`
- `m³`
- `m`
- `unidad`
- `caja`
- `paquete`

## categoria

- `Madera`
- `Metal`
- `Piedra`
- `Granito`
- `Mármol`
- `Acero Inoxidable`
- `Pintura`
- `Herrajes`
- `Iluminación`
- `Adhesivos`
- `Otro`

---

## 4) Endpoints utilizados por frontend

El frontend usa fallback automático para soportar variantes de rutas backend.

## Materiales

Orden de intento:

1. `/api/catalogos/materiales`
2. `/api/materiales`
3. `/api/catalogo/materiales`

Métodos: `GET`, `POST`, `PATCH`, `DELETE`

## Herrajes

Orden de intento:

1. `/api/catalogos/herrajes`
2. `/api/herrajes`
3. `/api/catalogo/herrajes`

Métodos: `GET`, `POST`, `PATCH`, `DELETE`

---

## 5) Ejemplos de payload que hoy envía frontend

## Crear material

```json
{
  "nombre": "Canto PVC Blanco",
  "unidadMedida": "m",
  "categoria": "Madera",
  "precioUnitario": 12.5,
  "precioMetroLineal": 12.5,
  "descripcion": "Borde para melamina",
  "seccion": "Acabados",
  "proveedor": "Proveedor A",
  "activo": true
}
```

## Crear herraje

```json
{
  "nombre": "Bisagra 110°",
  "unidadMedida": "unidad",
  "categoria": "Herrajes",
  "precioUnitario": 3.5,
  "descripcion": "Bisagra metálica para puertas",
  "seccion": "Herrajes",
  "proveedor": "Proveedor A",
  "activo": true
}
```

## Actualizar material/herraje (PATCH)

```json
{
  "nombre": "Bisagra 110°",
  "unidadMedida": "unidad",
  "categoria": "Herrajes",
  "precioUnitario": 4.1,
  "descripcion": "Nueva versión",
  "proveedor": "Proveedor B"
}
```

---

## 6) Respuestas esperadas del backend

## Éxito

```json
{ "success": true, "data": { } }
```

## Validación (400)

```json
{
  "success": false,
  "message": "Payload inválido",
  "errors": [
    { "field": "unidadMedida", "message": "Unidad inválida..." },
    { "field": "categoria", "message": "Categoria inválida..." }
  ]
}
```

## Duplicado (409)

```json
{
  "success": false,
  "message": "Nombre ya existe",
  "data": { }
}
```

---

## 7) Manejo de errores en frontend

- Si backend devuelve envelope con `success: false`, frontend muestra `message` y concatena `errors[]` (si existe) en un mensaje legible.
- Si hay 404 en ruta primaria de catálogo, frontend prueba automáticamente rutas fallback.
- Para 401/403 se mantiene el flujo global de autenticación/permisos por interceptor Axios.

---

## 8) Archivos actualizados para este ajuste

- `src/lib/axios/catalogosApi.ts`
  - Nuevos enums/tipos (`unidadMedida`, `categoria`)
  - Payloads extendidos
  - Fallback de rutas
  - Mejor manejo de envelope de error en 400/409

- `src/app/admin/precios/page.tsx`
  - Formulario actualizado con `unidadMedida`, `categoria`, `seccion`, `proveedor`
  - Payload create/update alineado con backend
  - Render tolerante a `precioUnitario | precioPorMetro | precioMetroLineal`

---

## 9) Requisitos backend para evitar bloqueos

1. Aceptar al menos una ruta canónica por recurso:
   - Materiales: `/api/catalogos/materiales`
   - Herrajes: `/api/catalogos/herrajes`

2. Mantener envelope consistente:
   - `success`, `message`, `data`, `errors` (cuando aplique)

3. Validar case-sensitive exactamente contra listas acordadas.

4. Para `POST/PATCH`, aceptar `precioUnitario` y tolerar `precioMetroLineal` como compatibilidad temporal.

---

## 10) Resultado esperado en UI

- Ya se puede crear material sin errores de validación por `unidadMedida/categoria` faltantes.
- Ya se puede crear herraje aunque backend tenga variación de ruta.
- Ya se puede actualizar precio y campos asociados con payload válido.
- Errores de validación se muestran de forma útil para corrección rápida.
