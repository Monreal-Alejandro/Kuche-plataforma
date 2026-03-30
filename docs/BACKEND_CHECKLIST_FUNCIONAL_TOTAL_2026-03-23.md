# Backend Checklist Funcional Total (Front-Back)

Fecha: 2026-03-23
Autor: GitHub Copilot (GPT-5.3-Codex)
Estado: Requerido para cerrar integracion operativa

## 1) Objetivo

Este documento lista, de forma puntual, lo que backend debe dejar listo para que el frontend funcione sin errores en:

- Subida de archivos (disenos/contratos)
- Registro de archivos en tareas
- Flujo citas -> disenos -> cotizacion -> contrato
- Asignaciones y sincronizacion de datos en tablero

## 2) Bloqueo actual detectado (critico)

Error reportado en frontend:

- `404 Not Found` al subir archivo en empleado
- Ocurre en `subirArchivoYObtenerUrl` antes de `POST /api/tareas/:id/archivos`

Diagnostico confirmado:

- Frontend intenta por default: `POST /api/uploads`
- Backend actual en `http://localhost:3001` responde 404 para:
  - `/api/uploads`
  - `/api/dropbox/upload`
  - `/api/files/upload`

Impacto:

- No se obtiene URL publica del archivo
- Backend de tareas rechaza `archivos[].url` (o llega vacio/undefined)
- No se puede completar la carga de disenos

## 3) Requerimientos obligatorios de backend

## 3.1 Endpoint de upload (Dropbox)

Backend debe exponer un endpoint de upload que acepte:

- Metodo: `POST`
- Content-Type: `multipart/form-data`
- Campo de archivo: `file`

Ruta:

- Puede ser cualquiera, pero debe ser informada al frontend para configurar:
  - `NEXT_PUBLIC_FILE_UPLOAD_ENDPOINT=/ruta-real`

Ejemplos validos:

- `/api/uploads`
- `/api/dropbox/upload`
- `/api/files/upload`

## 3.2 Respuesta de upload (obligatorio devolver URL)

La respuesta debe incluir URL utilizable del archivo en alguno de estos formatos:

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

Notas:

- La URL debe ser accesible para vista previa/descarga (imagen/pdf)
- Si backend devuelve otra estructura, frontend requerira ajuste adicional

## 3.3 Registro de archivos en tarea

Endpoint existente (debe mantenerse funcional):

- `POST /api/tareas/:id/archivos`

Body que envia frontend:

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

Requisitos:

- Validar `url` como string no vacio
- Responder error claro si falta `url`
- Persistir `archivos` en la tarea vinculada

## 3.4 CORS y seguridad

Backend debe permitir origen frontend (local y produccion):

- Local: `http://localhost:3000`
- Produccion: dominio final del front

Debe permitir:

- `POST` con `multipart/form-data`
- Credenciales/cookies si aplica
- Headers requeridos de auth

## 3.5 Contrato de respuestas uniforme (recomendado fuerte)

Estandar sugerido para evitar ambiguedades en frontend:

```json
{
  "success": true,
  "data": {},
  "message": "Operacion exitosa"
}
```

Aplicar especialmente en:

- Upload
- Tareas
- Kanban
- Citas

## 4) Requerimientos de sincronizacion de negocio

## 4.1 Cita sincronizada en tarea

Al actualizar cita/estado/asignacion, backend debe reflejar cambios en la tarea asociada por:

- `sourceType = "cita"`
- `sourceId = <citaId>`

Campos minimos a sincronizar:

- `cita.nombreCliente`
- `cita.ubicacion`
- `cita.informacionAdicional`
- `asignadoA` / `asignadoANombre`
- estado operativo derivado

## 4.2 Multi-asignacion en tareas

Backend debe aceptar `asignadoA` como arreglo de IDs (uno o mas) en create/update.

## 4.3 Agenda de visita en disenos

Backend debe aceptar y persistir en tarea:

- `visitScheduledAt` (ISO string)

## 5) Variables y configuracion de frontend que dependen de backend

Cuando backend confirme la ruta real de upload, frontend debe tener en `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_FILE_UPLOAD_ENDPOINT=/ruta-real-upload
```

Importante:

- Reiniciar frontend despues de cambiar `.env.local`

## 6) Pruebas de aceptacion (backend + frontend)

## Prueba A: Upload binario

1. `POST` al endpoint real con `multipart/form-data` (`file`)
2. Verificar status 200/201
3. Verificar que response incluye URL

## Prueba B: Registro en tarea

1. Tomar URL de prueba A
2. Ejecutar `POST /api/tareas/:id/archivos`
3. Verificar persistencia en `archivos[]`

## Prueba C: Flujo empleado E2E

1. Login empleado
2. Abrir tarea de diseno
3. Subir archivo desde modal
4. Validar:
   - No 404 en upload
   - No 400 por `archivos[0].url`
   - Archivo visible en panel admin/disenos

## 7) Definition of Done (DoD)

Se considera cerrado cuando:

1. Upload responde sin 404 y retorna URL valida
2. `POST /api/tareas/:id/archivos` guarda sin error de validacion
3. Empleado puede subir disenos de forma consistente
4. Admin visualiza los archivos cargados
5. No hay errores de contrato entre front y back en consola para este flujo

## 8) Contacto de integracion (lo que backend debe compartir)

Backend debe regresar al equipo frontend:

1. Ruta final exacta de upload
2. Ejemplo real de request/response de upload
3. Requisitos de auth del endpoint (Bearer/cookie)
4. Confirmacion de CORS para localhost y produccion
5. Confirmacion de persistencia correcta en `tareas.archivos`
