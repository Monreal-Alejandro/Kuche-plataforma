import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import type { CotizacionFormalData, PreliminarData } from "@/lib/kanban";
import type { LevantamientoDetalle, MedidasCampos, WallMeasureFieldDef } from "@/lib/levantamiento-catalog";
import {
  APPLIANCE_ITEMS,
  applianceAppearsInPdf,
  applianceOtroAppearsInPdf,
  getWallMeasureFieldDefs,
  isWallSlotKey,
  LIGHTING_ITEMS,
  lightingAppearsInPdf,
  lightingOtroAppearsInPdf,
  medidasCamposTieneValor,
  normalizeLevantamientoDetalle,
  wallSlotKey,
  WALL_ITEMS,
  wallMeasureLetter,
  wallMeasuresTieneValor,
} from "@/lib/levantamiento-catalog";
import { getFormalPdf } from "@/lib/formal-pdf-storage";

/** Tiempo antes de revocar el object URL (la pestaña nueva debe terminar de cargar). */
const PDF_OBJECT_URL_TAB_MS = 120_000;

const BRAND_RED: [number, number, number] = [139, 28, 28]; // #8B1C1C
const TEXT_DARK: [number, number, number] = [51, 51, 51]; // #333333
const TEXT_MID: [number, number, number] = [102, 102, 102]; // #666666
const LINE_SOFT: [number, number, number] = [225, 225, 225];

type PtBox = { x: number; y: number; w: number; h: number };

function safeText(v: unknown, fallback = "N/A"): string {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s : fallback;
}

function fmtMedidas(m: MedidasCampos | undefined): string {
  if (!m) return "N/A";
  const a = safeText(m.ancho, "-");
  const al = safeText(m.alto, "-");
  const f = safeText(m.fondo, "-");
  return `${a} x ${al} x ${f} m`;
}

function drawHLine(doc: jsPDF, x1: number, x2: number, y: number) {
  doc.setDrawColor(...LINE_SOFT);
  doc.setLineWidth(0.6);
  doc.line(x1, y, x2, y);
}

function setText(doc: jsPDF, rgb: [number, number, number], size: number, style: "normal" | "bold" = "normal") {
  doc.setTextColor(...rgb);
  doc.setFont("helvetica", style);
  doc.setFontSize(size);
}

function blockTitle(doc: jsPDF, text: string, x: number, y: number) {
  setText(doc, TEXT_DARK, 11, "bold");
  doc.text(text, x, y);
}

function labelValue(doc: jsPDF, label: string, value: string, x: number, y: number, w: number) {
  setText(doc, TEXT_MID, 8, "normal");
  doc.text(label.toUpperCase(), x, y);
  setText(doc, TEXT_DARK, 10, "normal");
  doc.text(value, x, y + 14, { maxWidth: w });
}

function addHeader(doc: jsPDF, title: string, subtitle?: string) {
  const pageW = doc.internal.pageSize.getWidth();
  const marginX = 48;
  doc.setFillColor(...BRAND_RED);
  doc.rect(0, 0, pageW, 74, "F");
  setText(doc, [255, 255, 255], 20, "bold");
  doc.text(title, marginX, 44);
  if (subtitle) {
    setText(doc, [255, 255, 255], 10, "normal");
    doc.text(subtitle, marginX, 62);
  }
}

function sectionHeading(doc: jsPDF, text: string, x: number, y: number) {
  setText(doc, BRAND_RED, 12, "bold");
  doc.text(text, x, y);
  drawHLine(doc, x, doc.internal.pageSize.getWidth() - x, y + 8);
}

function ensureSpace(doc: jsPDF, y: number, needed: number, onNewPage: () => void): number {
  const pageH = doc.internal.pageSize.getHeight();
  const bottom = 52;
  if (y + needed <= pageH - bottom) return y;
  doc.addPage();
  onNewPage();
  return 96; // below header
}

function wallRowsForTable(wallId: string, measures: Record<string, string>): Array<[string, string, string]> {
  const defs = getWallMeasureFieldDefs(wallId);
  return defs.map((d, i) => [wallMeasureLetter(i), d.label, safeText(measures[d.key], "-")]);
}

function commentsLabelForKey(key: string): string {
  switch (key) {
    case "a":
      return "Notas de Accesos y Datos";
    case "b":
      return "Notas de Muros";
    case "c":
      return "Notas de Electrodomesticos";
    case "d":
      return "Notas de Materiales / Acabados";
    case "e":
      return "Notas de Iluminacion";
    default:
      return "Notas";
  }
}

function addCoverAndSummary(doc: jsPDF, data: PreliminarData, lev?: LevantamientoDetalle) {
  addHeader(doc, "Levantamiento Detallado y Estimacion Preliminar", "KUCHE - Documento no vinculante");

  const marginX = 48;
  const pageW = doc.internal.pageSize.getWidth();
  const y0 = 96;

  // 2 columnas de datos del proyecto
  blockTitle(doc, "Datos del proyecto", marginX, y0);
  const colGap = 24;
  const colW = (pageW - marginX * 2 - colGap) / 2;
  const leftX = marginX;
  const rightX = marginX + colW + colGap;

  const typeProyecto = safeText(data.projectType);
  const conIsla = lev?.conIsla === "si" ? "Con isla" : lev?.conIsla === "no" ? "Sin isla" : "Sin definir";

  labelValue(doc, "Cliente", safeText(data.client, "Sin definir"), leftX, y0 + 18, colW);
  labelValue(doc, "Ubicacion", safeText(data.location, "Sin definir"), leftX, y0 + 54, colW);
  labelValue(doc, "Fecha", safeText(data.date, "Sin definir"), rightX, y0 + 18, colW);
  labelValue(doc, "Tipo de proyecto", `${typeProyecto} (${conIsla})`, rightX, y0 + 54, colW);

  drawHLine(doc, marginX, pageW - marginX, y0 + 92);

  // Materiales seleccionados
  const yMat = y0 + 112;
  blockTitle(doc, "Materiales seleccionados", marginX, yMat);
  const matBox: PtBox = { x: marginX, y: yMat + 12, w: pageW - marginX * 2, h: 78 };
  doc.setFillColor(248, 248, 248);
  doc.rect(matBox.x, matBox.y, matBox.w, matBox.h, "F");
  labelValue(doc, "Cubierta", safeText(data.cubierta, "Sin definir"), matBox.x + 14, matBox.y + 18, (matBox.w - 28) / 3);
  labelValue(doc, "Frente", safeText(data.frente, "Sin definir"), matBox.x + 14 + (matBox.w / 3), matBox.y + 18, (matBox.w - 28) / 3);
  labelValue(doc, "Herrajes", safeText(data.herraje, "Sin definir"), matBox.x + 14 + (matBox.w * 2) / 3, matBox.y + 18, (matBox.w - 28) / 3);

  // Precio
  const yPrice = yMat + 112;
  blockTitle(doc, "Estimacion", marginX, yPrice);
  doc.setFillColor(...BRAND_RED);
  doc.rect(marginX, yPrice + 12, pageW - marginX * 2, 64, "F");
  setText(doc, [255, 255, 255], 10, "normal");
  doc.text("Rango estimado de inversion", marginX + 14, yPrice + 34);
  setText(doc, [255, 255, 255], 22, "bold");
  doc.text(safeText(data.rangeLabel, "Sin definir"), marginX + 14, yPrice + 60);

  // Nota
  setText(doc, TEXT_MID, 9, "normal");
  doc.text(
    "Este documento es una estimacion preliminar. El costo final puede variar segun medidas exactas, condiciones de sitio y definicion final de acabados.",
    marginX,
    yPrice + 96,
    { maxWidth: pageW - marginX * 2 },
  );
}

function addFichaTecnica(doc: jsPDF, data: PreliminarData, lev?: LevantamientoDetalle) {
  const marginX = 48;
  const pageW = doc.internal.pageSize.getWidth();

  doc.addPage();
  addHeader(doc, "Ficha tecnica", "Especificaciones para arquitectura e instalacion");

  let y = 108;

  // Medidas generales (si existen en wallOtro u otros, mostramos algo util)
  sectionHeading(doc, "Medidas generales", marginX, y);
  y += 24;

  const general = lev?.wallOtro;
  setText(doc, TEXT_DARK, 10, "normal");
  doc.text(
    `Referencia (si aplica): ${general?.descripcion?.trim() ? general.descripcion.trim() : "Sin definir"}`,
    marginX,
    y,
    { maxWidth: pageW - marginX * 2 },
  );
  y += 18;
  setText(doc, TEXT_MID, 9, "normal");
  doc.text(`Medidas (Otro muro): ${general ? fmtMedidas(general) : "N/A"}`, marginX, y);
  y += 20;

  // Muros
  y = ensureSpace(doc, y, 40, () => addHeader(doc, "Ficha tecnica", "Especificaciones para arquitectura e instalacion"));
  sectionHeading(doc, "Muros", marginX, y);
  y += 18;

  if (!lev) {
    setText(doc, TEXT_MID, 10, "normal");
    doc.text("Sin levantamiento detallado capturado.", marginX, y);
    return;
  }

  const slotWallKeys = Object.keys(lev.wallMeasures)
    .filter(isWallSlotKey)
    .sort((a, b) => Number(a.slice(5)) - Number(b.slice(5)));

  const wallsWithValuesCatalog = WALL_ITEMS.filter((w) => {
    const m = lev.wallMeasures[w.id];
    return m && wallMeasuresTieneValor(m);
  });

  const useSlotLayout = slotWallKeys.length > 0 || lev.wallSlotCount > 0;

  const slotRowsForPdf: Array<{ title: string; typeId: string; measures: Record<string, string>; label: string }> =
    [];
  if (useSlotLayout) {
    const n = Math.max(
      lev.wallSlotCount,
      slotWallKeys.length ? Math.max(...slotWallKeys.map((k) => Number(k.slice(5)))) + 1 : 0,
    );
    for (let i = 0; i < n; i++) {
      const key = wallSlotKey(i);
      const measures = lev.wallMeasures[key];
      if (!measures || !wallMeasuresTieneValor(measures)) continue;
      const typeId = (measures["__typeId"] ?? "").trim();
      if (!typeId) continue;
      const cat = WALL_ITEMS.find((w) => w.id === typeId);
      slotRowsForPdf.push({
        title: `Pared ${i + 1}`,
        typeId,
        measures,
        label: cat?.label ?? typeId,
      });
    }
  }

  if (
    (useSlotLayout ? slotRowsForPdf.length : wallsWithValuesCatalog.length) === 0 &&
    !(lev.wallOtro.descripcion.trim() || medidasCamposTieneValor(lev.wallOtro))
  ) {
    setText(doc, TEXT_MID, 10, "normal");
    doc.text("No se registraron medidas de muros.", marginX, y);
    y += 18;
  } else {
    const rows = useSlotLayout
      ? slotRowsForPdf.map((r) => ({ kind: "slot" as const, ...r }))
      : wallsWithValuesCatalog.map((w) => ({
          kind: "cat" as const,
          title: w.label,
          typeId: w.id,
          measures: lev.wallMeasures[w.id] ?? {},
          label: w.label,
        }));

    for (const row of rows) {
      y = ensureSpace(doc, y, 120, () => addHeader(doc, "Ficha tecnica", "Especificaciones para arquitectura e instalacion"));
      setText(doc, TEXT_DARK, 11, "bold");
      doc.text(row.kind === "slot" ? `${row.title} - ${row.label}` : row.label, marginX, y);
      setText(doc, TEXT_MID, 9, "normal");
      doc.text(`ID: ${row.typeId}`, marginX + 280, y);
      y += 10;

      const measures = row.measures;
      autoTable(doc, {
        startY: y + 8,
        margin: { left: marginX, right: marginX },
        theme: "plain",
        head: [["Ref.", "Medida", "Valor (m)"]],
        body: wallRowsForTable(row.typeId, measures),
        styles: { font: "helvetica", fontSize: 9, textColor: TEXT_DARK, cellPadding: { top: 6, right: 6, bottom: 6, left: 0 } },
        headStyles: { fontStyle: "bold", textColor: TEXT_MID },
        columnStyles: {
          0: { cellWidth: 40, textColor: BRAND_RED, fontStyle: "bold" },
          1: { cellWidth: 320 },
          2: { halign: "right" as const },
        },
        didDrawCell: (d) => {
          if (d.section === "body") {
            doc.setDrawColor(...LINE_SOFT);
            doc.setLineWidth(0.6);
            doc.line(d.cell.x, d.cell.y + d.cell.height, d.cell.x + d.cell.width + (d.row.cells[2]?.width ?? 0) + 360, d.cell.y + d.cell.height);
          }
        },
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;
    }

    if (lev.wallOtro.descripcion.trim() || medidasCamposTieneValor(lev.wallOtro)) {
      y = ensureSpace(doc, y, 70, () => addHeader(doc, "Ficha tecnica", "Especificaciones para arquitectura e instalacion"));
      setText(doc, TEXT_DARK, 11, "bold");
      doc.text("Otro muro / situacion especial", marginX, y);
      y += 14;
      setText(doc, TEXT_MID, 9, "normal");
      doc.text(`Descripcion: ${safeText(lev.wallOtro.descripcion, "(sin descripcion)")}`, marginX, y, {
        maxWidth: pageW - marginX * 2,
      });
      y += 14;
      setText(doc, TEXT_MID, 9, "normal");
      doc.text(`Medidas: ${fmtMedidas(lev.wallOtro)}`, marginX, y);
      y += 18;
    }
  }

  // Electrodomesticos e Iluminacion
  y = ensureSpace(doc, y, 60, () => addHeader(doc, "Ficha tecnica", "Especificaciones para arquitectura e instalacion"));
  sectionHeading(doc, "Electrodomesticos e iluminacion", marginX, y);
  y += 18;

  const appliances = APPLIANCE_ITEMS.filter((a) => applianceAppearsInPdf(lev, a.id));
  const lights = LIGHTING_ITEMS.filter((l) => lightingAppearsInPdf(lev, l.id));

  const rows: Array<[string, string, string, string]> = [];
  for (const a of appliances) {
    const m = lev.applianceMeasures[a.id];
    rows.push([`Electro - ${a.label}`, safeText(m?.ancho, "-"), safeText(m?.alto, "-"), safeText(m?.fondo, "-")]);
  }
  if (applianceOtroAppearsInPdf(lev)) {
    rows.push([`Electro - Otro: ${safeText(lev.applianceOtro.descripcion, "(sin descripcion)")}`, safeText(lev.applianceOtro.ancho, "-"), safeText(lev.applianceOtro.alto, "-"), safeText(lev.applianceOtro.fondo, "-")]);
  }
  for (const l of lights) {
    const m = lev.lightingMeasures[l.id];
    rows.push([`Luz - ${l.label}`, safeText(m?.ancho, "-"), safeText(m?.alto, "-"), safeText(m?.fondo, "-")]);
  }
  if (lightingOtroAppearsInPdf(lev)) {
    rows.push([`Luz - Otro: ${safeText(lev.lightingOtro.descripcion, "(sin descripcion)")}`, safeText(lev.lightingOtro.ancho, "-"), safeText(lev.lightingOtro.alto, "-"), safeText(lev.lightingOtro.fondo, "-")]);
  }

  if (rows.length === 0) {
    setText(doc, TEXT_MID, 10, "normal");
    doc.text("No se registraron electrodomesticos ni iluminacion.", marginX, y);
    return;
  }

  autoTable(doc, {
    startY: y + 10,
    margin: { left: marginX, right: marginX },
    theme: "plain",
    head: [["Elemento", "Ancho", "Alto", "Fondo"]],
    body: rows,
    styles: { font: "helvetica", fontSize: 9, textColor: TEXT_DARK, cellPadding: { top: 6, right: 6, bottom: 6, left: 0 } },
    headStyles: { fontStyle: "bold", textColor: TEXT_MID },
    columnStyles: {
      0: { cellWidth: 330 },
      1: { halign: "right" as const, cellWidth: 70 },
      2: { halign: "right" as const, cellWidth: 70 },
      3: { halign: "right" as const, cellWidth: 70 },
    },
    didDrawCell: (d) => {
      if (d.section === "body") {
        doc.setDrawColor(...LINE_SOFT);
        doc.setLineWidth(0.6);
        doc.line(d.table.settings.margin.left, d.cell.y + d.cell.height, pageW - d.table.settings.margin.right, d.cell.y + d.cell.height);
      }
    },
  });
}

function addObservaciones(doc: jsPDF, lev?: LevantamientoDetalle) {
  const marginX = 48;
  const pageW = doc.internal.pageSize.getWidth();

  doc.addPage();
  addHeader(doc, "Observaciones de sitio", "Notas capturadas en el levantamiento");

  let y = 110;
  if (!lev) {
    setText(doc, TEXT_MID, 10, "normal");
    doc.text("Sin observaciones capturadas.", marginX, y);
    return;
  }

  const entries = (Object.entries(lev.sectionComments ?? {}) as Array<[string, string]>)
    .map(([k, v]) => [k, (v ?? "").trim()] as const)
    .filter(([, v]) => Boolean(v));

  if (entries.length === 0) {
    setText(doc, TEXT_MID, 10, "normal");
    doc.text("Sin observaciones capturadas.", marginX, y);
    return;
  }

  for (const [k, v] of entries) {
    y = ensureSpace(doc, y, 120, () => addHeader(doc, "Observaciones de sitio", "Notas capturadas en el levantamiento"));
    sectionHeading(doc, commentsLabelForKey(k), marginX, y);
    y += 22;
    setText(doc, TEXT_DARK, 10, "normal");
    doc.text(v, marginX, y, { maxWidth: pageW - marginX * 2 });
    y += 20 + Math.min(80, Math.ceil((v.length / 90) * 12));
  }
}

function buildPreliminarJsPdf(data: PreliminarData): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const lev = data.levantamiento ? normalizeLevantamientoDetalle(data.levantamiento) : undefined;
  addCoverAndSummary(doc, data, lev);
  addFichaTecnica(doc, data, lev);
  addObservaciones(doc, lev);
  return doc;
}

/** Genera el PDF preliminar (como Uint8Array) a partir de los datos guardados. */
export function buildPreliminarPdf(data: PreliminarData): Uint8Array {
  const doc = buildPreliminarJsPdf(data);
  const ab = doc.output("arraybuffer");
  return new Uint8Array(ab);
}

function openStoredPdfInNewTab(stored: string): void {
  void (async () => {
    if (!stored) return;
    try {
      if (stored.startsWith("data:")) {
        const res = await fetch(stored);
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        const win = window.open(objectUrl, "_blank");
        if (!win) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        setTimeout(() => URL.revokeObjectURL(objectUrl), PDF_OBJECT_URL_TAB_MS);
        return;
      }
      window.open(stored, "_blank", "noopener,noreferrer");
    } catch {
      try {
        window.open(stored, "_blank");
      } catch {
        /* ignore */
      }
    }
  })();
}

/** Abre el PDF en una nueva pestaña. */
export function openPreliminarPdfInNewTab(data: PreliminarData): void {
  const bytes = buildPreliminarPdf(data);
  const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (!win) {
    URL.revokeObjectURL(url);
    return;
  }
  setTimeout(() => URL.revokeObjectURL(url), PDF_OBJECT_URL_TAB_MS);
}

/** Descarga el PDF con nombre sugerido. */
export function downloadPreliminarPdf(data: PreliminarData, filename?: string): void {
  const bytes = buildPreliminarPdf(data);
  const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename ?? `levantamiento-detallado-${(data.client || "cliente").replace(/\s+/g, "-")}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

/** Data URL del PDF preliminar (para guardar en IndexedDB y enlazar al seguimiento). */
export async function buildPreliminarPdfDataUrl(data: PreliminarData): Promise<string> {
  const doc = buildPreliminarJsPdf(data);
  return doc.output("datauristring");
}

/** Abre un PDF guardado en IndexedDB por clave (formal, taller o levantamiento-seguimiento). */
export function openPdfFromIndexedKey(key: string): void {
  getFormalPdf(key).then((url) => {
    if (url) openStoredPdfInNewTab(url);
  });
}

/** Abre el PDF formal en una nueva pestaña. Busca en IndexedDB por formalPdfKey, o usa pdfDataUrl si existe; si no, genera el PDF preliminar como fallback. */
export function openFormalPdfInNewTab(data: CotizacionFormalData): void {
  if (data.pdfDataUrl) {
    openStoredPdfInNewTab(data.pdfDataUrl);
    return;
  }
  if (data.formalPdfKey) {
    getFormalPdf(data.formalPdfKey).then((url) => {
      if (url) openStoredPdfInNewTab(url);
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
    if (url) openStoredPdfInNewTab(url);
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
