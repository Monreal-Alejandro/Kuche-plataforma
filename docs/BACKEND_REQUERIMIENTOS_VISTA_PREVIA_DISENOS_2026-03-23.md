# Requerimientos Backend para Vista Previa de Diseños

Fecha: 2026-03-23
Autor: GitHub Copilot (GPT-5.3-Codex)
Estado: Pendiente de implementación/validación backend

## 1) Objetivo

Garantizar que la pantalla `admin/disenos` pueda mostrar vista previa correcta por archivo (imagen o PDF) y selector por cada archivo cargado.

## 2) Qué necesita frontend para que funcione la vista previa

La página consume tareas y archivos desde endpoints de kanban/tareas. Para que el preview funcione, cada archivo debe incluir URL utilizable en navegador.

Campos mínimos por archivo:

```json
{
  "id": "string",
  "nombre": "string",
  "tipo": "render | pdf | otro",
  "url": "https://..."
}
```

Mapeo esperado frontend:

- `nombre` -> `file.name`
- `tipo` -> `file.type`
- `url` -> `file.src` (clave para vista previa)

Si `url` no existe o no es pública, el sistema solo podrá mostrar nombre/ícono sin preview real.

## 3) Endpoints que deben responder consistente

## 3.1 Listado de diseños en kanban

Endpoint(s):

- `GET /api/kanban/disenos`
- o `GET /api/tareas?etapa=disenos`

Requisito:

- Incluir `archivos` completos en cada tarea.

## 3.2 Agregar archivos a tarea

Endpoint:

- `POST /api/tareas/:id/archivos`

Body recibido:

```json
{
  "archivos": [
    {
      "nombre": "Render_Final.jpg",
      "tipo": "render",
      "url": "https://..."
    }
  ]
}
```

Requisito:

- Persistir `url` tal cual para que luego pueda renderizarse en preview.

## 3.3 Upload binario (si aplica Dropbox)

Endpoint de upload debe devolver URL final consumible por navegador.

Formato aceptado actualmente por frontend:

```json
{ "url": "https://..." }
```

o

```json
{ "data": { "url": "https://..." } }
```

o

```json
{ "data": { "archivoUrl": "https://..." } }
```

o

```json
{ "fileUrl": "https://..." }
```

## 4) Requisitos técnicos de URL para preview

La URL guardada en `archivos[].url` debe cumplir:

1. Ser accesible desde el navegador del usuario final.
2. Permitir `GET` sin bloquear CORS para `iframe`/`img`.
3. Entregar `Content-Type` correcto:
   - imagen: `image/jpeg`, `image/png`, etc.
   - pdf: `application/pdf`
4. No expirar en segundos (ideal: URL estable o de expiración suficientemente larga).
5. No requerir headers privados que el navegador no pueda enviar en `<img>`/`<iframe>`.

## 5) Contrato recomendado de tarea de diseño

Ejemplo de respuesta de una tarjeta en diseños:

```json
{
  "_id": "task_123",
  "etapa": "disenos",
  "estado": "pendiente",
  "nombreProyecto": "Cocina Integral - Cliente Demo",
  "asignadoA": ["user_1"],
  "asignadoANombre": ["Valeria"],
  "designApprovedByAdmin": false,
  "visitScheduledAt": null,
  "archivos": [
    {
      "id": "file_1",
      "nombre": "Render_1.jpg",
      "tipo": "render",
      "url": "https://cdn.tudominio.com/renders/render_1.jpg"
    },
    {
      "id": "file_2",
      "nombre": "Plano.pdf",
      "tipo": "pdf",
      "url": "https://cdn.tudominio.com/planos/plano.pdf"
    }
  ],
  "createdAt": "2026-03-23T16:20:00.000Z",
  "updatedAt": "2026-03-23T16:25:00.000Z"
}
```

## 6) Criterios de aceptación (DoD)

1. En `admin/disenos`, cada archivo listado puede seleccionarse para preview.
2. Imágenes se visualizan en componente `<img>`.
3. PDFs se visualizan en `<iframe>`.
4. No hay 404 al abrir URL de archivo.
5. No hay errores de CORS o `X-Frame-Options` que bloqueen PDF en iframe.
6. Al recargar la página, previews siguen disponibles.

## 7) Errores backend a evitar

- Guardar archivos sin `url`.
- Devolver URL privada/interna no accesible por el frontend.
- Enviar `tipo` inconsistente (ej. `imagen` cuando el frontend espera `render`).
- Devolver rutas relativas sin base pública.

## 8) Checklist de implementación backend

- [ ] Endpoint de upload existente y estable.
- [ ] Upload devuelve URL pública válida.
- [ ] `POST /api/tareas/:id/archivos` persiste `url`.
- [ ] `GET kanban/tareas` devuelve `archivos[].url`.
- [ ] CORS permite consumo desde frontend.
- [ ] PDF embebible en iframe (sin bloqueo de frame policy).
