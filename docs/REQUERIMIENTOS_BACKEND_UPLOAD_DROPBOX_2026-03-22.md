# Requerimientos Backend para Upload (Dropbox)

Fecha: 2026-03-22
Autor: GitHub Copilot (GPT-5.3-Codex)
Estado: Frontend actualizado, pendiente validar backend

## 1) Que se ajusto en frontend

Se cambió el flujo de "Subir diseño" para que ya no mande `url` vacía a `/api/tareas/:id/archivos`.

Ahora el frontend hace dos pasos:

1. Sube el binario a endpoint de upload (Dropbox en backend).
2. Usa la URL devuelta para llamar `POST /api/tareas/:id/archivos`.

Archivos frontend:

- `src/lib/axios/uploadsApi.ts` (nuevo)
- `src/app/dashboard/empleado/page.tsx`
- `src/lib/axios/tareasApi.ts` (logs de 400 mejorados)

## 2) Endpoint de upload esperado por frontend

El frontend usa por default:

- `POST /api/uploads`

Puedes cambiarlo con variable de entorno:

- `NEXT_PUBLIC_FILE_UPLOAD_ENDPOINT=/ruta/que-tu-backend-use`

Ejemplos:

- `/api/uploads`
- `/api/files/upload`
- `/api/dropbox/upload`

## 3) Formato de request (upload)

`multipart/form-data`

Campo esperado:

- `file`: archivo binario

## 4) Formatos de respuesta aceptados (cualquiera de estos)

Opcion A:

```json
{
  "success": true,
  "url": "https://..."
}
```

Opcion B:

```json
{
  "success": true,
  "data": {
    "url": "https://..."
  }
}
```

Opcion C:

```json
{
  "success": true,
  "data": {
    "archivoUrl": "https://..."
  }
}
```

Opcion D:

```json
{
  "fileUrl": "https://..."
}
```

Importante:

- Debe regresar una URL final publica/accesible.

## 5) Registro en tarea (ya existente)

Endpoint que ya usa frontend:

- `POST /api/tareas/:id/archivos`

Body enviado ahora:

```json
{
  "archivos": [
    {
      "nombre": "render-cocina.jpg",
      "tipo": "render",
      "url": "https://..."
    }
  ]
}
```

## 6) Error detectado y causa

Error actual reportado:

- `Invalid input: expected string, received undefined` en `archivos[0].url`

Causa:

- Backend valida `url` obligatorio string.
- Frontend antes enviaba URL vacía u omitida.

Estado actual:

- Frontend ya sube primero y envia URL real si endpoint upload responde correctamente.

## 7) Checklist backend para que funcione

1. Endpoint upload existe y acepta `multipart/form-data` con `file`.
2. Endpoint upload responde una URL en alguno de los formatos soportados.
3. CORS permite origen frontend (`http://localhost:3000` en local).
4. `POST /api/tareas/:id/archivos` acepta `url` string valido.
5. URL devuelta por Dropbox es utilizable para vista previa (imagen/pdf).

## 8) Configuracion frontend necesaria

En `.env.local` del frontend (si endpoint no es `/api/uploads`):

```env
NEXT_PUBLIC_FILE_UPLOAD_ENDPOINT=/api/dropbox/upload
```

Luego reiniciar frontend.

## 9) Prueba E2E sugerida

1. Login empleado.
2. Abrir tarea de diseño.
3. Subir JPG/PDF.
4. Verificar en consola payload con URL:
   - `[EmpleadoDashboard] agregarArchivos payload`
5. Verificar que `POST /api/tareas/:id/archivos` responda 200.
6. Validar que archivo se vea en `admin/disenos`.
