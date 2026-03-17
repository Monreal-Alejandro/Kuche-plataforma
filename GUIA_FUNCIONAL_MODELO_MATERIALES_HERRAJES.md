# Guía Funcional — Modelo Materiales/Herrajes

Fecha: 2026-03-17

Esta guía está basada en el modelo que compartiste (Mongoose `MaterialesModel`) y en la implementación actual del frontend.

---

## 1) Qué ya quedó implementado en frontend

### Formulario completo en admin precios

Pantalla: `/admin/precios`

Campos incluidos y enviados:

- `nombre` (requerido)
- `descripcion` (opcional)
- `unidadMedida` (requerido en material)
- `categoria` (requerido en material)
- `seccion` (opcional)
- `proveedor` (opcional)
- `idCotizador` (opcional)
- `precioUnitario` (opcional si hay `precioPorMetro`)
- `precioPorMetro` (opcional si hay `precioUnitario`)
- `disponible` (boolean)

### Reglas especiales aplicadas

- Para herrajes se envía por defecto:
  - `categoria: "Herrajes"`
  - `unidadMedida: "unidad"`
- Validación en frontend: exige al menos uno entre `precioUnitario` o `precioPorMetro`.
- Si backend devuelve `errors[]`, se muestra detalle por campo en UI.

### Archivos ajustados

- `src/lib/axios/catalogosApi.ts`
- `src/app/admin/precios/page.tsx`

---

## 2) Contrato backend que debe estar activo

## Rutas recomendadas (canónicas)

- `GET /api/catalogos/materiales`
- `POST /api/catalogos/materiales`
- `PATCH /api/catalogos/materiales/:id`
- `DELETE /api/catalogos/materiales/:id`

- `GET /api/catalogos/herrajes`
- `POST /api/catalogos/herrajes`
- `PATCH /api/catalogos/herrajes/:id`
- `DELETE /api/catalogos/herrajes/:id`

## Compatibilidad de rutas (frontend ya la soporta)

Si no existen las canónicas, frontend intenta:

- Materiales: `/api/materiales`, `/api/catalogo/materiales`
- Herrajes: `/api/herrajes`, `/api/catalogo/herrajes`

## Headers requeridos

- `Authorization: Bearer <token>`
- `Content-Type: application/json`

## Envelope

Éxito:

```json
{ "success": true, "data": ... }
```

Error:

```json
{ "success": false, "message": "...", "errors": [{ "field": "...", "message": "..." }] }
```

---

## 3) Payloads listos para usar

## Crear material

```json
{
  "nombre": "Canto PVC Blanco",
  "descripcion": "Borde para melamina",
  "unidadMedida": "m",
  "precioUnitario": 12.5,
  "precioPorMetro": null,
  "idCotizador": "canto_pvc_blanco",
  "categoria": "Madera",
  "seccion": "vistas",
  "proveedor": "Proveedor A",
  "disponible": true
}
```

## Crear herraje

```json
{
  "nombre": "Bisagra 110°",
  "descripcion": "Bisagra metálica",
  "precioUnitario": 3.5,
  "idCotizador": "bisagra_110",
  "categoria": "Herrajes",
  "unidadMedida": "unidad",
  "proveedor": "Proveedor B",
  "disponible": true
}
```

## Actualizar material/herraje

```json
{
  "nombre": "Bisagra 110°",
  "precioUnitario": 4.2,
  "precioPorMetro": null,
  "unidadMedida": "unidad",
  "categoria": "Herrajes",
  "disponible": true
}
```

---

## 4) Checklist para que funcione ya

1. Confirmar que backend expone al menos una ruta por recurso (materiales y herrajes).
2. Confirmar que backend devuelve envelope con `success`.
3. Confirmar que backend acepta:
   - `disponible` (no `activo`) según tu modelo.
   - `idCotizador` opcional único/sparse.
4. Confirmar enums exactos (case-sensitive):
   - `unidadMedida`: `m²`, `m³`, `m`, `unidad`, `caja`, `paquete`
   - `categoria`: catálogo completo del modelo.
5. Confirmar que `PATCH` permite actualización parcial.
6. Si hay 409 por `nombre` duplicado, devolver `message` claro y opcionalmente recurso existente en `data`.

---

## 5) Si aún falla (qué revisar exactamente)

Si sigue fallando, captura y comparte de una sola operación:

- Método (`POST/PATCH/...`)
- URL exacta
- Body exacto enviado
- Status code
- Body de respuesta

Con eso se detecta en minutos si el fallo restante es:

- Ruta backend faltante,
- Middleware de auth,
- Validación de enum,
- Transformación de payload en controlador.

---

## 6) Resultado esperado en UI

- Crear materiales: funcional
- Crear herrajes: funcional
- Editar precios (unitario o por metro): funcional
- Guardar cambios de unidad/categoría/sección/proveedor/idCotizador: funcional
- Eliminar: funcional
- Errores de validación: visibles y legibles
