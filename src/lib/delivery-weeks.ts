/**
 * Texto para PDF y datos guardados en `PreliminarData.date` / cotización formal.
 * Vacío si no hay ningún número de semanas válido (> 0).
 */
export function formatDeliveryWeeksLabel(minStr: string, maxStr: string): string {
  const min = Number.parseInt(minStr.trim(), 10);
  const max = Number.parseInt(maxStr.trim(), 10);
  const minOk = Number.isFinite(min) && min > 0;
  const maxOk = Number.isFinite(max) && max > 0;
  if (minOk && maxOk) {
    if (min === max) {
      return `${min} semanas aprox.`;
    }
    const lo = Math.min(min, max);
    const hi = Math.max(min, max);
    return `${lo} a ${hi} semanas aprox.`;
  }
  if (minOk) {
    return `${min} semanas aprox.`;
  }
  if (maxOk) {
    return `${max} semanas aprox.`;
  }
  return "";
}
