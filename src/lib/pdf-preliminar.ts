import type { CotizacionFormalData, PreliminarData } from "@/lib/kanban";
import type { LevantamientoDetalle, MedidasCampos } from "@/lib/levantamiento-catalog";
import {
  APPLIANCE_ITEMS,
  LIGHTING_ITEMS,
  WALL_ITEMS,
} from "@/lib/levantamiento-catalog";
import { getFormalPdf } from "@/lib/formal-pdf-storage";

const escapePdfText = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

const sanitizePdfText = (value: string) =>
  escapePdfText(value.normalize("NFD").replace(/\p{Diacritic}/gu, ""));

function medidasTieneValor(m: MedidasCampos): boolean {
  return [m.ancho, m.alto, m.fondo].some((v) => (v ?? "").trim() !== "");
}

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
  if (lev.wallOtro.descripcion.trim() || medidasTieneValor(lev.wallOtro)) return true;
  if (lev.applianceOtro.descripcion.trim() || medidasTieneValor(lev.applianceOtro)) return true;
  if (lev.lightingOtro.descripcion.trim() || medidasTieneValor(lev.lightingOtro)) return true;
  for (const m of Object.values(lev.wallMeasures)) {
    if (medidasTieneValor(m)) return true;
  }
  for (const m of Object.values(lev.applianceMeasures)) {
    if (medidasTieneValor(m)) return true;
  }
  for (const m of Object.values(lev.lightingMeasures)) {
    if (medidasTieneValor(m)) return true;
  }
  return false;
}

function buildLevantamientoPdfStream(lev: LevantamientoDetalle): string {
  const drawText = (x: number, y: number, size: number, color: string, text: string) =>
    `BT\n/F1 ${size} Tf\n${color} rg\n${x} ${y} Td\n(${sanitizePdfText(text)}) Tj\nET`;

  const lineas: string[] = [];
  let y = 750;
  const pushTitulo = (t: string) => {
    lineas.push(drawText(48, y, 12, "0.15 0.15 0.15", t));
    y -= 16;
  };
  const pushParrafo = (texto: string, size = 9) => {
    for (const ln of wrapLineas(texto, 92)) {
      lineas.push(drawText(48, y, size, "0.35 0.35 0.35", ln));
      y -= 11;
      if (y < 72) return;
    }
  };

  pushTitulo("Detalle de levantamiento (secciones B, C, E)");
  y -= 4;

  const com = lev.sectionComments;
  const bloques: [string, string | undefined][] = [
    ["A (contexto)", com.a],
    ["B Paredes", com.b],
    ["C Electrodomesticos", com.c],
    ["D Showroom", com.d],
    ["E Iluminacion", com.e],
  ];
  for (const [titulo, txt] of bloques) {
    if (!txt?.trim()) continue;
    pushTitulo(`Comentarios ${titulo}`);
    pushParrafo(txt.trim(), 9);
    y -= 6;
    if (y < 120) break;
  }

  pushTitulo("Paredes (tipos)");
  for (const item of WALL_ITEMS) {
    const m = lev.wallMeasures[item.id];
    if (!m || !medidasTieneValor(m)) continue;
    pushParrafo(`${item.label}: ${formatoMedidas(m)}`, 9);
    if (y < 100) break;
  }
  if (lev.wallOtro.descripcion.trim() || medidasTieneValor(lev.wallOtro)) {
    pushParrafo(
      `Otro muro: ${lev.wallOtro.descripcion.trim() || "(sin descripcion)"} — ${formatoMedidas(lev.wallOtro)}`,
      9,
    );
  }

  y -= 6;
  pushTitulo("Electrodomesticos");
  for (const item of APPLIANCE_ITEMS) {
    const m = lev.applianceMeasures[item.id];
    if (!m || !medidasTieneValor(m)) continue;
    const pref = item.categoria ? `[${item.categoria}] ` : "";
    pushParrafo(`${pref}${item.label}: ${formatoMedidas(m)}`, 9);
    if (y < 100) break;
  }
  if (lev.applianceOtro.descripcion.trim() || medidasTieneValor(lev.applianceOtro)) {
    pushParrafo(
      `Otro electrodomestico: ${lev.applianceOtro.descripcion.trim() || "(sin descripcion)"} — ${formatoMedidas(lev.applianceOtro)}`,
      9,
    );
  }

  y -= 6;
  pushTitulo("Iluminacion");
  for (const item of LIGHTING_ITEMS) {
    const m = lev.lightingMeasures[item.id];
    if (!m || !medidasTieneValor(m)) continue;
    pushParrafo(`${item.label}: ${formatoMedidas(m)}`, 9);
    if (y < 80) break;
  }
  if (lev.lightingOtro.descripcion.trim() || medidasTieneValor(lev.lightingOtro)) {
    pushParrafo(
      `Otro luminario: ${lev.lightingOtro.descripcion.trim() || "(sin descripcion)"} — ${formatoMedidas(lev.lightingOtro)}`,
      9,
    );
  }

  return lineas.join("\n");
}

function buildPdfDocument(pageStreams: string[]): string {
  const fontObj = "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj";
  if (pageStreams.length === 1) {
    const content = pageStreams[0];
    const objects = [
      "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj",
      "2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj",
      "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj",
      `4 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj`,
      fontObj,
    ];
    return finalizePdf(objects);
  }

  const [s1, s2] = pageStreams;
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj",
    "2 0 obj\n<< /Type /Pages /Count 2 /Kids [3 0 R 6 0 R] >>\nendobj",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj",
    `4 0 obj\n<< /Length ${s1.length} >>\nstream\n${s1}\nendstream\nendobj`,
    fontObj,
    "6 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 7 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj",
    `7 0 obj\n<< /Length ${s2.length} >>\nstream\n${s2}\nendstream\nendobj`,
  ];
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

  const content = [
    drawRect(0, 732, 612, 60, "0.55 0.11 0.11"),
    drawText(48, 755, 18, "1 1 1", "Levantamiento Detallado"),
    drawText(48, 738, 10, "1 1 1", "Kuche | Estimacion no vinculante"),
    drawText(48, 700, 11, "0.15 0.15 0.15", "Resumen ejecutivo"),
    drawRect(40, 610, 532, 90, "0.96 0.96 0.96"),
    drawText(60, 670, 10, "0.45 0.45 0.45", "Rango estimado"),
    drawText(60, 642, 20, "0.55 0.11 0.11", data.rangeLabel),
    drawText(60, 618, 9, "0.35 0.35 0.35", "Sujeto a visita tecnica y definicion final."),
    drawText(48, 575, 11, "0.15 0.15 0.15", "Datos del proyecto"),
    drawText(48, 555, 10, "0.35 0.35 0.35", `Cliente: ${data.client || "Sin nombre"}`),
    drawText(48, 538, 10, "0.35 0.35 0.35", `Tipo: ${data.projectType}`),
    drawText(48, 521, 10, "0.35 0.35 0.35", `Ubicacion: ${data.location || "Por definir"}`),
    drawText(48, 504, 10, "0.35 0.35 0.35", `Fecha tentativa: ${data.date || "Por definir"}`),
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
  ].join("\n");

  const lev = data.levantamiento;
  if (lev && levantamientoTieneContenido(lev)) {
    const page2 = buildLevantamientoPdfStream(lev);
    return buildPdfDocument([content, page2]);
  }
  return buildPdfDocument([content]);
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
