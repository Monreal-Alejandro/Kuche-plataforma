# Instrucciones UI — Mostrar datos de Booking

Última actualización: Marzo 12, 2026

Propósito: proporcionar indicaciones precisas para que el frontend muestre correctamente los datos que entrega el backend de Booking y maneje los flujos de disponibilidad y creación de citas.

**Endpoints clave**
- GET `/api/citas/disponibilidad?fecha=YYYY-MM-DD` — devuelve `{ success, fecha, horariosOcupados }`.
- POST `/api/citas/agregarCita` — acepta payload JSON y header `captcha-token`; devuelve `{ success, data, message }`.

**Mapeo de datos (backend → UI)**
- `fecha` (GET disponibilidad): string `YYYY-MM-DD` → usar para rellenar el calendario.
- `horariosOcupados`: string[] `['09:00','14:00']` → deshabilitar esos botones/slots.
- `data` (POST success): objeto `Cita` → mostrar confirmación con `data.fechaAgendada`, `data.nombreCliente`, `data.ubicacion`, `data.informacionAdicional`.
- `message`: string → mostrar en modal de error o éxito.

**Formato de visualización**
- Mostrar fechas en local del usuario pero validar/convertir siempre a ISO UTC al enviar (`fechaAgendada: 2026-03-15T14:00:00.000Z`).
- Los horarios en la UI deben mostrarse como `HH:MM` (24h). Usar el mismo formato que devuelve `horariosOcupados`.

**Flujo de disponibilidad (recomendado)**
1. Usuario abre picker de fecha → llamar `GET /disponibilidad?fecha=YYYY-MM-DD` al cambiar mes/día.
2. Recibir `horariosOcupados` → generar lista completa de slots (09:00–18:00) y marcar deshabilitados.
3. Aplicar buffer visual de 1 hora: además de `horariosOcupados`, deshabilitar la hora siguiente a cada hora ocupada si aplica (frontend puede mostrar tooltip: "Buffer 1h").
4. No permitir selección de fines de semana; no permitir fechas pasadas.

**Flujo de envío de formulario**
- Validaciones previas (frontend): nombre, teléfono, email, ubicación, fecha y hora seleccionadas, reCAPTCHA token presente.
- Antes de POST: mostrar modal de confirmación con resumen (fecha, hora, ubicación). Confirmación obliga a enviar.
- Headers en POST:
  - `Content-Type: application/json`
  - `captcha-token: <token>`
- Manejar respuesta:
  - `success: true` → mostrar modal de éxito (auto-cierre 3s), limpiar formulario.
  - `success: false` → mostrar modal de error con `message` y, si existe, `citasOcupadas` para guiar nueva selección.
  - Fallback: si la respuesta no tiene `success`, intentar leer objeto directo Cita y tratar como éxito.

**Manejo de errores y estados**
- Mientras se realiza la llamada mostrar spinner y deshabilitar botón de confirmar.
- Para errores 400/409 mostrar `response.message` (si existe) y detalles adicionales (`citasOcupadas`).
- Para 500 mostrar mensaje genérico: "Error del servidor, inténtalo más tarde".

**reCAPTCHA**
- Ejecutar reCAPTCHA (v2/v3) en el frontend antes de POST y enviar el token en header `captcha-token`.
- Si el token no existe, bloquear el envío y mostrar "Por favor valida que no eres un robot".

**Consideraciones de zona horaria**
- El backend espera/valida horas en zona de México (America/Mexico_City). El frontend debe:
  - Convertir la fecha y hora seleccionada a ISO con el offset correcto antes de enviar (p. ej. `2026-03-15T14:00:00-06:00` o convertir a UTC `Z`).
  - Mostrar al usuario la hora en su zona local pero indicar que la hora es en hora de México si el usuario está en otra zona.

**Componentes UI sugeridos y props**
- `BookingCalendar`
  - Props: `currentMonth: Date`, `onDateChange(date)`, `disabledDates: string[]`.
  - Debe solicitar disponibilidad al backend al cambiar fecha/mes.
- `TimeSlotsGrid`
  - Props: `availableSlots: string[]`, `occupiedSlots: string[]`, `onSelectTime(time)`.
  - Mostrar tooltips para slots deshabilitados explicando la razón.
- `BookingForm`
  - Props: `selectedDate`, `selectedTime`, `onSubmit(payload)`.
  - Debe ejecutar reCAPTCHA y pasar `captcha-token` a `onSubmit`.
- `ConfirmModal`, `SuccessModal`, `ErrorModal` con mensajes provenientes de `response.message`.

**Ejemplo mínimo de llamada (fetch)**

```javascript
// obtener disponibilidad
const res = await fetch(`/api/citas/disponibilidad?fecha=${fechaYYYYMMDD}`);
const body = await res.json();
// crear cita
await fetch('/api/citas/agregarCita', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'captcha-token': captchaToken
  },
  body: JSON.stringify(payload)
});
```

**Checklist para QA / Release**
- [ ] Validación reCAPTCHA funcionando y token enviado.
- [ ] Calendario bloquea fines de semana y fechas pasadas.
- [ ] Horarios ocupados se reflejan correctamente y buffer 1h aplicado visualmente.
- [ ] Modal de confirmación antes del POST.
- [ ] Manejo correcto de `success`, `message` y `citasOcupadas`.
- [ ] Dominios de producción añadidos en CORS del backend.

---

Archivo adicional útil (implementado en backend):
- Guía general: [src/docs/FRONTEND_PRODUCTION_GUIDE_BOOKING.md](src/docs/FRONTEND_PRODUCTION_GUIDE_BOOKING.md)

Si quieres, genero ejemplos TypeScript/React de los componentes mencionados o una Postman collection para el equipo de frontend.