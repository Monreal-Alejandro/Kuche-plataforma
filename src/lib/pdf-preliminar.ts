import type { PreliminarData } from "@/lib/kanban";

const escapePdfText = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

const sanitizePdfText = (value: string) =>
  escapePdfText(value.normalize("NFD").replace(/\p{Diacritic}/gu, ""));

/** Genera el PDF de cotización preliminar a partir de los datos guardados. */
export function buildPreliminarPdf(data: PreliminarData): string {
  const drawRect = (x: number, y: number, w: number, h: number, color: string) =>
    `q\n${color} rg\n${x} ${y} ${w} ${h} re\nf\nQ`;

  const drawText = (x: number, y: number, size: number, color: string, text: string) =>
    `BT\n/F1 ${size} Tf\n${color} rg\n${x} ${y} Td\n(${sanitizePdfText(text)}) Tj\nET`;

  const content = [
    drawRect(0, 732, 612, 60, "0.55 0.11 0.11"),
    drawText(48, 755, 18, "1 1 1", "Cotizacion Preliminar"),
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

  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj",
    "2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj",
    `4 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj`,
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj",
  ];

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
  link.download = filename ?? `cotizacion-preliminar-${(data.client || "cliente").replace(/\s+/g, "-")}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
