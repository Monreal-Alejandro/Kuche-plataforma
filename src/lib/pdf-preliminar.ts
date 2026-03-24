import type { CotizacionFormalData, PreliminarData } from "@/lib/kanban";
import type { LevantamientoDetalle, MedidasCampos } from "@/lib/levantamiento-catalog";
import {
  APPLIANCE_ITEMS,
  formatWallMeasuresForPdf,
  levantamientoDetalleScopeMultiplier,
  LIGHTING_ITEMS,
  medidasCamposTieneValor,
  normalizeLevantamientoDetalle,
  WALL_ITEMS,
  wallMeasuresTieneValor,
} from "@/lib/levantamiento-catalog";
import { getFormalPdf } from "@/lib/formal-pdf-storage";

const escapePdfText = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

const sanitizePdfText = (value: string) =>
  escapePdfText(value.normalize("NFD").replace(/\p{Diacritic}/gu, ""));

function formatoMedidas(m: MedidasCampos): string {
  const a = (m.ancho ?? "").trim() || "-";
  const al = (m.alto ?? "").trim() || "-";
  const f = (m.fondo ?? "").trim() || "-";
  return `${a} x ${al} x ${f} m`;
}

function wrapLineas(texto: string, maxChars: number): string[] {
  const limpio = texto.replace(/\s+/g, " ").trim();
  if (!limpio) return [];
  const palabras = limpio.split(" ");
  const lineas: string[] = [];
  let actual = "";
  for (const p of palabras) {
    const siguiente = actual ? `${actual} ${p}` : p;
    if (siguiente.length > maxChars && actual) {
      lineas.push(actual);
      actual = p;
    } else {
      actual = siguiente;
    }
  }
  if (actual) lineas.push(actual);
  return lineas;
}

function levantamientoTieneContenido(lev: LevantamientoDetalle): boolean {
  const com = lev.sectionComments;
  if (com.a?.trim() || com.b?.trim() || com.c?.trim() || com.d?.trim() || com.e?.trim()) return true;
  if (lev.wallOtro.descripcion.trim() || medidasCamposTieneValor(lev.wallOtro)) return true;
  if (lev.applianceOtro.descripcion.trim() || medidasCamposTieneValor(lev.applianceOtro)) return true;
  if (lev.lightingOtro.descripcion.trim() || medidasCamposTieneValor(lev.lightingOtro)) return true;
  for (const m of Object.values(lev.wallMeasures)) {
    if (wallMeasuresTieneValor(m)) return true;
  }
  for (const m of Object.values(lev.applianceMeasures)) {
    if (medidasCamposTieneValor(m)) return true;
  }
  for (const m of Object.values(lev.lightingMeasures)) {
    if (medidasCamposTieneValor(m)) return true;
  }
  return false;
}

/** Varias páginas de anexo sin cortar bloques al llegar al borde inferior. */
function buildLevantamientoPdfPageStreams(lev: LevantamientoDetalle): string[] {
  const drawText = (x: number, y: number, size: number, color: string, text: string) =>
    `BT\n/F1 ${size} Tf\n${color} rg\n${x} ${y} Td\n(${sanitizePdfText(text)}) Tj\nET`;

  const BOTTOM = 52;
  const TOP = 750;
  const pages: string[] = [];
  let lineas: string[] = [];
  let y = TOP;

  const flushPage = () => {
    if (lineas.length > 0) {
      pages.push(lineas.join("\n"));
      lineas = [];
    }
    y = TOP;
  };

  const ensureSpace = (neededFromBaseline: number) => {
    if (y < BOTTOM + neededFromBaseline) flushPage();
  };

  const pushTitulo = (t: string) => {
    ensureSpace(28);
    lineas.push(drawText(48, y, 12, "0.15 0.15 0.15", t));
    y -= 16;
  };

  const pushParrafo = (texto: string, size = 9) => {
    for (const ln of wrapLineas(texto, 92)) {
      ensureSpace(14);
      lineas.push(drawText(48, y, size, "0.35 0.35 0.35", ln));
      y -= 11;
    }
  };

  pushTitulo("Levantamiento detallado (anexo)");
  pushParrafo(
    "Comentarios por seccion (A–E), medidas de paredes por tipo, electrodomesticos e iluminacion registrados en la plataforma. Unidades en metros.",
  );
  y -= 6;

  const com = lev.sectionComments;
  const bloques: [string, string | undefined][] = [
    ["Seccion A · Contexto del sitio", com.a],
    ["Seccion B · Paredes (notas)", com.b],
    ["Seccion C · Electrodomesticos (notas)", com.c],
    ["Seccion D · Showroom / acabados (notas)", com.d],
    ["Seccion E · Iluminacion (notas)", com.e],
  ];
  for (const [titulo, txt] of bloques) {
    if (!txt?.trim()) continue;
    pushTitulo(`Comentarios — ${titulo}`);
    pushParrafo(txt.trim(), 9);
    y -= 6;
  }

  pushTitulo("Seccion B · Paredes (medidas por tipo)");
  for (const item of WALL_ITEMS) {
    const m = lev.wallMeasures[item.id];
    if (!m || !wallMeasuresTieneValor(m)) continue;
    const line = formatWallMeasuresForPdf(item.id, m);
    if (line) pushParrafo(`${item.label}: ${line}`, 9);
  }
  if (lev.wallOtro.descripcion.trim() || medidasCamposTieneValor(lev.wallOtro)) {
    pushParrafo(
      `Otro muro: ${lev.wallOtro.descripcion.trim() || "(sin descripcion)"} — ${formatoMedidas(lev.wallOtro)}`,
      9,
    );
  }

  y -= 6;
  pushTitulo("Seccion C · Electrodomesticos (medidas)");
  for (const item of APPLIANCE_ITEMS) {
    const m = lev.applianceMeasures[item.id];
    if (!m || !medidasCamposTieneValor(m)) continue;
    const pref = item.categoria ? `[${item.categoria}] ` : "";
    pushParrafo(`${pref}${item.label}: ${formatoMedidas(m)}`, 9);
  }
  if (lev.applianceOtro.descripcion.trim() || medidasCamposTieneValor(lev.applianceOtro)) {
    pushParrafo(
      `Otro electrodomestico: ${lev.applianceOtro.descripcion.trim() || "(sin descripcion)"} — ${formatoMedidas(lev.applianceOtro)}`,
      9,
    );
  }

  y -= 6;
  pushTitulo("Seccion E · Iluminacion (medidas)");
  for (const item of LIGHTING_ITEMS) {
    const m = lev.lightingMeasures[item.id];
    if (!m || !medidasCamposTieneValor(m)) continue;
    pushParrafo(`${item.label}: ${formatoMedidas(m)}`, 9);
  }
  if (lev.lightingOtro.descripcion.trim() || medidasCamposTieneValor(lev.lightingOtro)) {
    pushParrafo(
      `Otro luminario: ${lev.lightingOtro.descripcion.trim() || "(sin descripcion)"} — ${formatoMedidas(lev.lightingOtro)}`,
      9,
    );
  }

  flushPage();
  if (pages.length === 0) {
    pushTitulo("Levantamiento detallado (anexo)");
    pushParrafo("(Sin lineas adicionales exportables.)");
    flushPage();
  }
  const total = pages.length;
  return pages.map((stream, i) => {
    const footer = drawText(
      300,
      40,
      8,
      "0.5 0.5 0.5",
      `Anexo levantamiento · Pagina ${i + 1} de ${total}`,
    );
    return `${stream}\n${footer}`;
  });
}

function buildPdfFromStreams(pageContents: string[]): string {
  const n = pageContents.length;
  const fontId = 3;
  const pageObjectIds: number[] = [];
  const contentObjectIds: number[] = [];
  let nextId = 4;
  for (let i = 0; i < n; i++) {
    pageObjectIds.push(nextId++);
    contentObjectIds.push(nextId++);
  }

  const objects: string[] = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj",
    `2 0 obj\n<< /Type /Pages /Count ${n} /Kids [ ${pageObjectIds.map((id) => `${id} 0 R`).join(" ")} ] >>\nendobj`,
    `${fontId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj`,
  ];

  for (let i = 0; i < n; i++) {
    const pid = pageObjectIds[i];
    const cid = contentObjectIds[i];
    const content = pageContents[i];
    objects.push(
      `${pid} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${cid} 0 R /Resources << /Font << /F1 ${fontId} 0 R >> >> >>\nendobj`,
    );
    objects.push(
      `${cid} 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj`,
    );
  }

  return finalizePdf(objects);
}

function finalizePdf(objects: string[]): string {
  let offset = 0;
  const offsets = objects.map((obj) => {
    const current = offset;
    offset += obj.length + 2;
    return current;
  });

  const xrefEntries = offsets
    .map((entry) => entry.toString().padStart(10, "0") + " 00000 n ")
    .join("\n");

  const xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${xrefEntries}`;
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${
    offset + xref.length + 2
  }\n%%EOF`;
  return `%PDF-1.4\n${objects.join("\n\n")}\n${xref}\n${trailer}`;
}

/** Genera el PDF de cotización preliminar a partir de los datos guardados. */
export function buildPreliminarPdf(data: PreliminarData): string {
  const drawRect = (x: number, y: number, w: number, h: number, color: string) =>
    `q\n${color} rg\n${x} ${y} ${w} ${h} re\nf\nQ`;

  const drawText = (x: number, y: number, size: number, color: string, text: string) =>
    `BT\n/F1 ${size} Tf\n${color} rg\n${x} ${y} Td\n(${sanitizePdfText(text)}) Tj\nET`;

  const lev = data.levantamiento ? normalizeLevantamientoDetalle(data.levantamiento) : undefined;
  const scopeMult =
    lev && levantamientoTieneContenido(lev) ? levantamientoDetalleScopeMultiplier(lev) : 1;

  const coverLines: string[] = [
    drawRect(0, 732, 612, 60, "0.55 0.11 0.11"),
    drawText(48, 755, 18, "1 1 1", "Levantamiento Detallado"),
    drawText(48, 738, 10, "1 1 1", "Kuche | Estimacion no vinculante"),
    drawText(48, 700, 11, "0.15 0.15 0.15", "Resumen ejecutivo"),
    drawRect(40, 610, 532, 90, "0.96 0.96 0.96"),
    drawText(60, 670, 10, "0.45 0.45 0.45", "Rango estimado"),
    drawText(60, 642, 20, "0.55 0.11 0.11", data.rangeLabel),
    drawText(60, 618, 9, "0.35 0.35 0.35", "Sujeto a visita tecnica y definicion final."),
  ];
  if (scopeMult > 1.001) {
    const pct = Math.round((scopeMult - 1) * 100);
    coverLines.push(
      drawText(
        60,
        598,
        8,
        "0.42 0.42 0.42",
        `El rango refleja aprox. +${pct}% por volumen de informacion del levantamiento (heuristica; no son partidas).`,
      ),
    );
  }
  coverLines.push(
    drawText(48, 575, 11, "0.15 0.15 0.15", "Datos del proyecto"),
    drawText(48, 555, 10, "0.35 0.35 0.35", `Cliente: ${data.client || "Sin nombre"}`),
    drawText(48, 538, 10, "0.35 0.35 0.35", `Tipo: ${data.projectType}`),
    drawText(48, 521, 10, "0.35 0.35 0.35", `Ubicacion: ${data.location || "Por definir"}`),
    drawText(48, 504, 10, "0.35 0.35 0.35", `Tiempo de entrega (semanas aprox.): ${data.date || "Por definir"}`),
    drawText(330, 575, 11, "0.15 0.15 0.15", "Materiales seleccionados"),
    drawText(330, 555, 10, "0.35 0.35 0.35", `Cubierta: ${data.cubierta}`),
    drawText(330, 538, 10, "0.35 0.35 0.35", `Frente: ${data.frente}`),
    drawText(330, 521, 10, "0.35 0.35 0.35", `Herraje: ${data.herraje}`),
    drawRect(40, 470, 532, 1, "0.85 0.85 0.85"),
    drawText(
      48,
      445,
      9,
      "0.4 0.4 0.4",
      "Este documento es preliminar. Los costos finales pueden variar segun medidas,",
    ),
    drawText(
      48,
      432,
      9,
      "0.4 0.4 0.4",
      "materiales y complejidad del proyecto. Valido como guia inicial.",
    ),
  );

  const content = coverLines.join("\n");

  if (lev && levantamientoTieneContenido(lev)) {
    const annexPages = buildLevantamientoPdfPageStreams(lev);
    return buildPdfFromStreams([content, ...annexPages]);
  }
  return buildPdfFromStreams([content]);
}

/** Abre el PDF en una nueva pestaña. */
export function openPreliminarPdfInNewTab(data: PreliminarData): void {
  const pdf = buildPreliminarPdf(data);
  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  URL.revokeObjectURL(url);
}

/** Descarga el PDF con nombre sugerido. */
export function downloadPreliminarPdf(data: PreliminarData, filename?: string): void {
  const pdf = buildPreliminarPdf(data);
  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename ?? `levantamiento-detallado-${(data.client || "cliente").replace(/\s+/g, "-")}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

/** Data URL del PDF preliminar (para guardar en IndexedDB y enlazar al seguimiento). */
export function buildPreliminarPdfDataUrl(data: PreliminarData): Promise<string> {
  const pdf = buildPreliminarPdf(data);
  const blob = new Blob([pdf], { type: "application/pdf" });
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** Abre un PDF guardado en IndexedDB por clave (formal, taller o levantamiento-seguimiento). */
export function openPdfFromIndexedKey(key: string): void {
  getFormalPdf(key).then((url) => {
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  });
}

/** Abre el PDF formal en una nueva pestaña. Busca en IndexedDB por formalPdfKey, o usa pdfDataUrl si existe; si no, genera el PDF preliminar como fallback. */
export function openFormalPdfInNewTab(data: CotizacionFormalData): void {
  if (data.pdfDataUrl) {
    window.open(data.pdfDataUrl, "_blank", "noopener,noreferrer");
    return;
  }
  if (data.formalPdfKey) {
    getFormalPdf(data.formalPdfKey).then((url) => {
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      else openPreliminarPdfInNewTab(data);
    });
    return;
  }
  openPreliminarPdfInNewTab(data);
}

/** Descarga el PDF formal. Busca en IndexedDB por formalPdfKey, o usa pdfDataUrl si existe; si no, genera el PDF preliminar como fallback. */
export function downloadFormalPdf(data: CotizacionFormalData, filename?: string): void {
  if (data.pdfDataUrl) {
    const link = document.createElement("a");
    link.href = data.pdfDataUrl;
    link.download = filename ?? `cotizacion-formal-${(data.client || "cliente").replace(/\s+/g, "-")}.pdf`;
    link.click();
    return;
  }
  if (data.formalPdfKey) {
    getFormalPdf(data.formalPdfKey).then((url) => {
      if (url) {
        const link = document.createElement("a");
        link.href = url;
        link.download = filename ?? `cotizacion-formal-${(data.client || "cliente").replace(/\s+/g, "-")}.pdf`;
        link.click();
      } else {
        downloadPreliminarPdf(data, filename);
      }
    });
    return;
  }
  downloadPreliminarPdf(data, filename);
}

/** Abre la hoja de taller guardada con la cotización formal (IndexedDB por workshopPdfKey). */
export function openWorkshopPdfInNewTab(data: CotizacionFormalData): void {
  if (!data.workshopPdfKey) return;
  getFormalPdf(data.workshopPdfKey).then((url) => {
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  });
}

/** Descarga la hoja de taller (misma tienda IndexedDB que el PDF formal). */
export function downloadWorkshopPdf(data: CotizacionFormalData, filename?: string): void {
  if (!data.workshopPdfKey) return;
  getFormalPdf(data.workshopPdfKey).then((url) => {
    if (!url) return;
    const link = document.createElement("a");
    link.href = url;
    link.download =
      filename ??
      `hoja-taller-${(data.client || "cliente").replace(/\s+/g, "-").toLowerCase()}.pdf`;
    link.click();
  });
}
