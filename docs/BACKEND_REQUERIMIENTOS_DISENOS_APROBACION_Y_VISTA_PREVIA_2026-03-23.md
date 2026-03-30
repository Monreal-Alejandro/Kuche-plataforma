# Requerimientos Front-Back: Disenos (Aprobacion, Agenda de Visita y Vista Previa)

Fecha: 2026-03-23
Autor: GitHub Copilot (GPT-5.3-Codex)
Estado: Requerido para dejar flujo estable en produccion

## 1) Objetivo

Alinear frontend y backend para que el flujo completo en `admin/disenos` funcione correctamente:

1. Aprobar diseño.
2. Abrir modal para agendar visita.
3. Guardar `visitScheduledAt` en backend.
4. Visualizar archivos del diseño (imagen/pdf) con URL real.

## 2) Cambios aplicados en frontend

## 2.1 Mapeo de tarjetas cita promovidas a disenos

Archivo:

- `src/lib/admin-workflow.ts`

Ajuste clave:

- Antes, tarjetas con `sourceType: "cita"` se trataban siempre como `backendSource: "cita"`, incluso en etapa `disenos`.
- Eso provocaba que al guardar visita no se persistiera (caia en rama de cita y no actualizaba tarea).

Nuevo comportamiento:

- Si etapa es `citas`:
  - `backendSource = "cita"`
  - `sourceId = citaId`
- Si etapa es `disenos | cotizacion | contrato`:
  - `backendSource = "tarea"`
  - `sourceId = task._id`

Resultado:

- En `disenos`, updates (como `visitScheduledAt`) se envian por `actualizarTarjetaTarea` y se persisten correctamente.

## 2.2 Archivos en tarjetas de origen cita

Archivo:

- `src/lib/admin-workflow.ts`

Ajuste clave:

- Antes, en rama de cita se devolvia `files: []`.
- Ahora se mapean archivos desde `item.archivos` (o fallback `raw.archivos`) a:
  - `id`
  - `name`
  - `type`
  - `src` (URL)

Resultado:

- La pantalla `admin/disenos` ya puede mostrar URLs reales y vista previa de archivos almacenados en backend.

## 2.3 Vista de informacion completa y links clicables

Archivo:

- `src/app/admin/disenos/page.tsx`

Implementado:

- Seccion "Ver informacion completa" por tarjeta.
- Muestra listado de archivos con URL clicable por archivo.
- En modal de preview, muestra link del archivo seleccionado.

## 3) Requerimientos de backend (obligatorios)

## 3.1 Persistencia de agenda de visita

Endpoint usado por frontend:

- `PATCH /api/tareas/:id`

Backend debe aceptar y persistir en tarea:

```json
{
  "visitScheduledAt": "2026-03-31T19:00:00.000Z",
  "designApprovedByAdmin": true
}
```

Requisito:

- Si `visitScheduledAt` llega en payload, debe guardarse y devolverse en respuestas de kanban/tareas.

## 3.2 Respuesta de tarjetas en disenos con archivos

Endpoint(s):

- `GET /api/kanban/disenos`
- o equivalente que alimente el tablero admin

Requisito por archivo:

```json
{
  "id": "string",
  "nombre": "string",
  "tipo": "pdf | render | otro",
  "url": "https://..."
}
```

Importante:

- `url` debe ser publica/accesible para navegador (preview en `<img>` o `<iframe>`).
- Si `url` no llega, frontend solo podra mostrar metadata sin preview.

## 3.3 Consistencia para cita promovida a tarea

Cuando una cita se promueve a `disenos`:

- La entidad en kanban debe comportarse como tarea editable (`PATCH /api/tareas/:id`).
- Debe conservar trazabilidad:
  - `sourceType = "cita"`
  - `sourceId = citaId`

Pero los updates operativos de etapa no-citas deben aplicarse a la tarea (`_id` de tarea).

## 3.4 Campos recomendados en respuesta de tarea de diseno

```json
{
  "_id": "task_id",
  "etapa": "disenos",
  "estado": "pendiente",
  "designApprovedByAdmin": false,
  "visitScheduledAt": null,
  "asignadoA": ["user_id"],
  "asignadoANombre": ["Nombre"],
  "sourceType": "cita",
  "sourceId": "cita_id",
  "archivos": [
    {
      "id": "file_id",
      "nombre": "Documento.pdf",
      "tipo": "pdf",
      "url": "https://dl.dropboxusercontent.com/..."
    }
  ]
}
```

## 4) Pruebas de aceptacion (E2E)

## Caso A: Aprobar y agendar visita

1. Abrir `admin/disenos`.
2. Click `Aprobar`.
3. Seleccionar fecha/hora en modal.
4. Guardar visita.

Esperado:

- Request `PATCH /api/tareas/:id` exitoso.
- `visitScheduledAt` persistido.
- Badge en UI: `Visita: <fecha/hora>`.
- Tras refresh, sigue visible.

## Caso B: Visualizar archivo cargado

1. Confirmar que la tarea tiene `archivos[].url` en DB.
2. Abrir `admin/disenos`.
3. Ver `Ver informacion completa` -> URL clicable.
4. Abrir modal preview y seleccionar archivo.

Esperado:

- Se muestra link real del archivo.
- PDF/imagen abre correctamente.

## 5) Riesgos si backend no cumple

1. Si no persiste `visitScheduledAt`:
- Modal parece guardar, pero no hay cambio real en tarjeta.

2. Si no devuelve `archivos[].url`:
- `files` quedara vacio o sin `src` en frontend.
- No habra preview ni link util.

3. Si cita promovida sigue tratandose como cita para updates de disenos:
- Updates de tarea no aplican (mismo sintoma de "no hace nada").

## 6) Checklist final para backend

- [ ] `PATCH /api/tareas/:id` acepta y guarda `visitScheduledAt`.
- [ ] `GET /api/kanban/disenos` incluye `archivos` con `url`.
- [ ] URL de archivo es accesible en navegador.
- [ ] Cita promovida en etapa `disenos` es actualizable como tarea.
- [ ] Respuestas mantienen `sourceType/sourceId` para trazabilidad.

## 7) Nota de integracion

Este documento complementa:

- `docs/BACKEND_CHECKLIST_FUNCIONAL_TOTAL_2026-03-23.md`
- `docs/BACKEND_REQUERIMIENTOS_VISTA_PREVIA_DISENOS_2026-03-23.md`

En esta version se concentra especificamente en el bug de aprobacion+agenda y en la disponibilidad de links para preview en `admin/disenos`.
