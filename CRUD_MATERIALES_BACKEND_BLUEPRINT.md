# CRUD Materiales — Ubicación, Rutas, Riesgos y Blueprint Backend

Fecha: 2026-03-17

Objetivo: documentar exactamente dónde está el CRUD de materiales en el frontend, qué rutas llama, qué errores/riesgos existen y cómo recrearlo en backend para que funcione de punta a punta.

---

## 1) Dónde está el CRUD en frontend

## Cliente API (fuente principal)

Archivo: `src/lib/axios/catalogosApi.ts`

Funciones materiales:

- `obtenerMateriales()`
- `crearMaterial(data)`
- `actualizarMaterial(id, data)`
- `eliminarMaterial(id)`

Rutas que intenta (fallback en orden):

1. `/api/catalogos/materiales`
2. `/api/materiales`
3. `/api/catalogo/materiales`

Métodos usados:

- `GET`
- `POST`
- `PATCH /:id`
- `DELETE /:id`

## Vista Admin donde se usa CRUD completo

Archivo: `src/app/admin/precios/page.tsx`

Uso directo:

- Carga lista: `obtenerMateriales()`
- Alta: `crearMaterial(...)`
- Edición: `actualizarMaterial(item._id, ...)`
- Eliminación: `eliminarMaterial(item._id)`

## Otros consumidores (lectura)

- `src/app/admin/page.tsx` (contador de materiales)
- `src/app/dashboard/cotizador/page.tsx` (catálogo para cotización)

---

## 2) Contrato de payload que el frontend envía

## Crear material (POST)

```json
{
  "nombre": "Canto PVC Blanco",
  "descripcion": "Borde para melamina",
  "unidadMedida": "m",
  "categoria": "Madera",
  "seccion": "vistas",
  "proveedor": "Proveedor A",
  "idCotizador": "canto_pvc_blanco",
  "precioUnitario": 12.5,
  "precioPorMetro": null,
  "disponible": true
}
```

## Actualizar material (PATCH /:id)

```json
{
  "nombre": "Canto PVC Blanco",
  "unidadMedida": "m",
  "categoria": "Madera",
  "precioUnitario": 13.0,
  "precioPorMetro": null,
  "descripcion": "Actualizado",
  "seccion": "vistas",
  "proveedor": "Proveedor A",
  "idCotizador": "canto_pvc_blanco",
  "disponible": true
}
```

## Validación UI aplicada

- `nombre` requerido.
- Al menos uno entre `precioUnitario` o `precioPorMetro`.
- Para material: `unidadMedida` y `categoria` se envían siempre.

---

## 3) Formato de respuesta esperado por frontend

## Éxito

```json
{ "success": true, "data": ... }
```

## Error

```json
{
  "success": false,
  "message": "Payload inválido",
  "errors": [
    { "field": "unidadMedida", "message": "Unidad inválida" }
  ]
}
```

Notas:

- El frontend soporta que el backend devuelva errores detallados en `errors[]`.
- Para listados, frontend tolera array directo o contenedores (`materiales`, `items`, `results`, etc.), pero lo ideal es devolver array directo en `data`.

---

## 4) Hallazgos de errores/riesgos actuales

1. **Riesgo de inconsistencia por fallback de rutas**
   - Si hay múltiples endpoints activos con distinta lógica (`/api/catalogos/materiales` vs `/api/materiales`), el frontend puede escribir en uno y leer desde otro según respuestas 404.
   - Recomendación: dejar **una ruta canónica** y mantener aliases solo temporalmente.

2. **Fallback solo para 404**
   - Si la primera ruta responde `405`, `500` o `403`, no intenta la siguiente.
   - Impacto: puede fallar aunque otra ruta alterna sí funcione.

3. **Sin control de concurrencia**
   - `PATCH` sobrescribe sin `version`/`etag`; dos admins pueden pisarse cambios.

4. **Superficie de seguridad en cliente**
   - Token en `localStorage` (vulnerable ante XSS).
   - `withCredentials: true` + Bearer requiere CORS/CSRF bien configurado en backend.

5. **Posible desalineación en listados de otros módulos**
   - `admin/page` y `dashboard/cotizador` asumen `data` de listado sin normalización robusta equivalente.
   - Recomendado: estandarizar respuesta backend para evitar variaciones.

---

## 5) Blueprint para recrear backend funcional (MVC)

## Rutas (canónicas)

```http
GET    /api/catalogos/materiales
POST   /api/catalogos/materiales
PATCH  /api/catalogos/materiales/:id
DELETE /api/catalogos/materiales/:id
```

## Controlador sugerido

- `getMateriales(req, res)`
- `createMaterial(req, res)`
- `updateMaterial(req, res)`
- `deleteMaterial(req, res)`

## Servicio sugerido

- `listMateriales(filters)`
- `createMaterial(payload, userId)`
- `updateMaterial(id, payload, userId)`
- `removeMaterial(id)`

## Validación recomendada

- `nombre`: requerido, trim, único (case-insensitive recomendado).
- `unidadMedida`: enum exacto.
- `categoria`: enum exacto.
- `precioUnitario >= 0` o `precioPorMetro >= 0`; exigir al menos uno.
- `seccion`: enum del modelo.
- `idCotizador`: opcional, único/sparse.

## Reglas de respuesta

- 200/201 éxito con envelope.
- 400 validación con `errors[]` por campo.
- 404 cuando `:id` no existe.
- 409 en duplicados (`nombre`, `idCotizador`).
- 500 errores inesperados.

---

## 6) Ejemplo mínimo de implementación backend (pseudo)

```js
// POST /api/catalogos/materiales
async function createMaterial(req, res) {
  const payload = req.body;

  const errors = validatePayload(payload);
  if (errors.length) {
    return res.status(400).json({ success: false, message: 'Payload inválido', errors });
  }

  const exists = await MaterialesModel.findOne({ nombre: payload.nombre.trim() });
  if (exists) {
    return res.status(409).json({ success: false, message: 'Material ya existe', data: exists });
  }

  const created = await MaterialesModel.create(payload);
  return res.status(201).json({ success: true, data: created });
}
```

---

## 7) Checklist de “funciona ya”

- [ ] Existen 4 rutas canónicas de materiales.
- [ ] Todas usan `Authorization: Bearer <token>`.
- [ ] CORS permite origen frontend y headers requeridos.
- [ ] Envelope consistente (`success`, `data`/`message`).
- [ ] Validación devuelve `errors[]` con `field` y `message`.
- [ ] `POST` y `PATCH` aceptan `precioUnitario` y/o `precioPorMetro`.
- [ ] `GET` devuelve lista visible en `/admin/precios`.

---

## 8) Recomendación final

Para estabilidad y menor complejidad operativa:

1. Mantener solo `/api/catalogos/materiales` como canónica.
2. Dejar aliases (`/api/materiales`, `/api/catalogo/materiales`) por transición corta.
3. Estandarizar envelope y payload para evitar lógica especial en frontend.
