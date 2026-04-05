/**
 * Comprobantes y adjuntos grandes no deben ir en localStorage (cuota ~5MB).
 * Reutiliza el mismo IndexedDB que los PDFs formales (`saveFormalPdf` / `getFormalPdf`).
 */

import { getFormalPdf, saveFormalPdf } from "@/lib/formal-pdf-storage";

export const INDEXEDDB_REF_PREFIX = "indexeddb:";

/** Referencia guardada en JSON en lugar del data URL completo. */
export function isIndexedDbRef(s: string): boolean {
  return typeof s === "string" && s.startsWith(INDEXEDDB_REF_PREFIX);
}

export function stripIndexedDbPrefix(ref: string): string {
  return ref.startsWith(INDEXEDDB_REF_PREFIX) ? ref.slice(INDEXEDDB_REF_PREFIX.length) : ref;
}

/** Data URLs mayores que esto se externalizan a IndexedDB (ajustable). */
const DATA_URL_OFFLOAD_MIN_LENGTH = 40 * 1024;

/**
 * Si es data URL grande, guarda en IndexedDB y devuelve `indexeddb:clave`.
 * Si ya es `indexeddb:...`, la devuelve igual. Si es corta, sin cambios.
 */
export async function persistDataUrlIfLarge(dataUrl: string, storageKey: string): Promise<string> {
  if (!dataUrl || typeof dataUrl !== "string") return dataUrl;
  if (isIndexedDbRef(dataUrl)) return dataUrl;
  if (!dataUrl.startsWith("data:")) return dataUrl;
  if (dataUrl.length <= DATA_URL_OFFLOAD_MIN_LENGTH) return dataUrl;
  await saveFormalPdf(storageKey, dataUrl);
  return `${INDEXEDDB_REF_PREFIX}${storageKey}`;
}

/** Resuelve `indexeddb:clave` o devuelve el string tal cual (p. ej. data URL pequeña). */
export async function resolveSeguimientoMediaRef(src: string): Promise<string | null> {
  if (!src?.trim()) return null;
  if (!isIndexedDbRef(src)) return src;
  const key = stripIndexedDbPrefix(src);
  return (await getFormalPdf(key)) ?? null;
}

/** `data:application/pdf;base64,...` — no se puede mostrar en `<img>`. */
export function isPdfDataUrl(s: string): boolean {
  if (typeof s !== "string" || !s.startsWith("data:")) return false;
  const comma = s.indexOf(",");
  const meta = comma >= 0 ? s.slice(5, comma) : s.slice(5);
  return (
    meta.startsWith("application/pdf") ||
    meta.startsWith("application/x-pdf") ||
    meta === "application/pdf"
  );
}

export const SEGUIMIENTO_MEDIA_UNAVAILABLE_MSG =
  "No se pudo cargar el archivo. Si lo subiste en otro equipo o navegador, vuelve a adjuntarlo desde «Editar estatus público» en el mismo dispositivo donde consultas el seguimiento.";

/**
 * Resuelve referencias `indexeddb:` para UI. Si falta el blob en IndexedDB, devuelve missing (no usar el string crudo).
 */
export async function resolveSeguimientoMediaRefForUi(
  src: string,
): Promise<{ url: string } | { missing: true }> {
  if (!src?.trim()) return { missing: true };
  const resolved = await resolveSeguimientoMediaRef(src);
  if (isIndexedDbRef(src) && resolved === null) return { missing: true };
  const url = resolved ?? src;
  if (isIndexedDbRef(url)) return { missing: true };
  return { url };
}

/**
 * Antes de `JSON.stringify` + localStorage: externaliza data URLs grandes en pagos y archivos.
 */
export async function persistSeguimientoRecordForLocalStorage(
  record: Record<string, unknown>,
  codigo: string,
): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = { ...record };
  const safeCodigo = codigo.replace(/[^a-zA-Z0-9_-]/g, "_");

  const pagos = out.pagos;
  if (pagos && typeof pagos === "object") {
    const p = pagos as Record<string, Record<string, unknown>>;
    const keys = ["anticipo", "segundoPago", "liquidacion"] as const;
    const nextPagos: Record<string, Record<string, unknown>> = { ...p };
    for (const k of keys) {
      const row = { ...(p[k] ?? {}) };
      const ri = row.receiptImage;
      if (typeof ri === "string" && ri.startsWith("data:")) {
        const sk = `seg-rec-${safeCodigo}-${k}-${Date.now()}`;
        row.receiptImage = await persistDataUrlIfLarge(ri, sk);
      }
      nextPagos[k] = row;
    }
    out.pagos = nextPagos;
  }

  const archivos = out.archivos;
  if (Array.isArray(archivos)) {
    out.archivos = await Promise.all(
      archivos.map(async (item: unknown) => {
        if (!item || typeof item !== "object") return item;
        const a = item as Record<string, unknown>;
        const src = a.src;
        if (typeof src !== "string" || !src.startsWith("data:") || src.length <= DATA_URL_OFFLOAD_MIN_LENGTH) {
          return a;
        }
        const id = String(a.id ?? "doc");
        const sk = `seg-arch-${safeCodigo}-${id}-${Date.now()}`;
        if (a.type === "pdf") {
          await saveFormalPdf(sk, src);
          return { ...a, indexedPdfKey: sk, src: "" };
        }
        const ref = await persistDataUrlIfLarge(src, sk);
        return { ...a, src: ref };
      }),
    );
  }

  for (const imgKey of ["cotizacionPreliminarImage", "cotizacionFormalImage"] as const) {
    const v = out[imgKey];
    if (typeof v === "string" && v.startsWith("data:") && v.length > DATA_URL_OFFLOAD_MIN_LENGTH) {
      const sk = `seg-img-${safeCodigo}-${imgKey}-${Date.now()}`;
      out[imgKey] = await persistDataUrlIfLarge(v, sk);
    }
  }

  return out;
}
