# Guía de Integración (Frontend) — Booking (Producción)

Última actualización: Marzo 12, 2026

**Objetivo:** listar todo lo que el frontend debe garantizar para que la integración con el backend de Booking funcione correctamente en producción.

**Endpoints principales**
- POST `/api/citas/agregarCita` — Crear cita (pública)
  - Payload esperado (JSON):
    {
      "fechaAgendada": "2026-03-15T14:30:00.000Z",
      "nombreCliente": "Juan Pérez",
      "correoCliente": "juan@example.com",
      "telefonoCliente": "+52 1234567890",
      "ubicacion": "Durango Capital",
      "informacionAdicional": "Horario solicitado: 14:00"
    }
  - Headers obligatorios:
    - `Content-Type: application/json`
    - `captcha-token`: token reCAPTCHA (puede enviarse también como `x-captcha-token`)
  - Respuesta éxito (formato estándar):
    {
      "success": true,
      "data": { /* objeto cita */ },
      "message": "Cita creada exitosamente"
    }
  - Respuesta error ejemplo:
    {
      "success": false,
      "message": "Razón del error",
      "citasOcupadas": ["10:00"]
    }

- GET `/api/citas/disponibilidad?fecha=YYYY-MM-DD` — Consultar horarios ocupados
  - Query: `fecha` en formato `YYYY-MM-DD` (p. ej. `2026-03-15`)
  - Respuesta (éxito):
    {
      "success": true,
      "fecha": "2026-03-15",
      "horariosOcupados": ["10:00", "11:00", "14:00"]
    }

**Reglas de validación importantes (backend)**
- Fecha mínima: la cita debe solicitarse con al menos 1 hora de anticipación (backend valida esto).
- Días permitidos: Solo lunes a viernes (fin de semana rechazado).
- Horario permitido: entre 09:00 y 18:00 (hora de México).
- Buffer entre citas: 1 hora antes y 1 hora después; si hay conflicto, backend devuelve error con `citasOcupadas`.

**Formato de fecha/hora que debe enviar el frontend**
- Enviar `fechaAgendada` como ISO 8601 UTC (p. ej. `2026-03-15T14:00:00.000Z`) o como timestamp numérico; el backend acepta ambos.
- Para mostrar horarios en UI usar formato `HH:MM` (24h) conforme devuelve `/disponibilidad`.

**Cabeceras y CORS**
- En producción, enviar `captcha-token` en headers: `captcha-token: <token>`.
- Asegurarse de enviar `Content-Type: application/json` en POST.
- El backend habilita CORS para orígenes configurados; en local se permiten `http://localhost:5173` y `http://localhost:3000`. Pedir agregar dominios de producción al backend si difieren.

**Manejo de respuestas — recomendaciones**
- Primera opción: comprobar `response.success === true` → usar `response.data`.
- Fallback robusto: si no existe `success`, tratar la respuesta completa como posible objeto cita (por compatibilidad con respuestas antiguas).
- Mostrar al usuario mensajes del backend (`response.message`) en modales de éxito/error.

**Validaciones en frontend (recomendadas antes de llamar al backend)**
- Nombre: obligatorio, no vacío.
- Teléfono: obligatorio; formato libre pero enviar cadena limpia.
- Email: obligatorio y validación básica (`@` y dominio).
- Ubicación: obligatorio; si `location === 'otro'` enviar `ubicacion` con `otherLocation`.
- Fecha: no permitir seleccionar fechas pasadas ni fines de semana en el picker.
- Hora: deshabilitar horarios que vengan en `horariosOcupados` y bloquear la hora siguiente (buffer visual de 1 hora).
- reCAPTCHA: ejecutar y obtener token antes de enviar la solicitud.

**UX / comportamientos esperados**
- Mostrar modal de confirmación antes de llamar a `agregarCita` con resumen (fecha, hora, ubicación).
- En caso de éxito: modal de éxito que se cierra automáticamente tras 3s; limpiar el formulario.
- En caso de error: modal con `response.message` y, si existe, listar `citasOcupadas` para que el usuario elija otro horario.
- Mientras se hace la petición, mostrar indicador de carga y deshabilitar botones repetidos.

**Ejemplo de fetch (JS) — mínimo requerido**

```javascript
const payload = {
  fechaAgendada: '2026-03-15T14:00:00.000Z',
  nombreCliente: 'Juan Pérez',
  correoCliente: 'juan@example.com',
  telefonoCliente: '+52 1234567890',
  ubicacion: 'Durango Capital',
  informacionAdicional: 'Horario solicitado: 14:00'
};

const captchaToken = await getRecaptchaToken(); // implementado en frontend

const res = await fetch('/api/citas/agregarCita', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'captcha-token': captchaToken
  },
  body: JSON.stringify(payload)
});

const body = await res.json();
if (body.success === true) {
  // usar body.data
} else {
  // mostrar body.message
}
```

**Checklist de producción (para frontend antes del deploy)**
- [ ] Enviar `captcha-token` en headers en todas las llamadas públicas de creación de cita.
- [ ] Validar localmente fecha/hora/inputs según especificado.
- [ ] Manejar `success` y fallback a objeto directo.
- [ ] Agregar dominios de producción al CORS del backend.
- [ ] Tests e2e: crear citas, validar bloqueo de horarios, manejo de errores.

---

Si quieres, puedo:
- Añadir ejemplos de UI (flujos de error/éxito) o código TypeScript para el frontend.
- Crear un pequeño script de pruebas (`scripts/test_citas.js`) que haga solicitudes de ejemplo.

Archivo creado por integración backend — mantener actualizado cuando cambien reglas de horario/antigüedad/buffer.
