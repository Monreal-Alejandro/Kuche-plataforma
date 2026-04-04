import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { RowInput } from "jspdf-autotable";

import { getLogoFitSizeForPdf } from "@/lib/pdf-preliminar";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);

export type WorkshopPdfLineInput = {
  label: string;
  category: string;
  unit: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
};

export type WorkshopPdfBuildInput = {
  client: string;
  projectType: string;
  location: string;
  deliveryWeeksLabel: string;
  precioTotalSinIva: number;
  montoIva: number;
  totalNeto: number;
  lines: WorkshopPdfLineInput[];
};

const BRAND_RED: [number, number, number] = [139, 28, 28];
const HEADER_DARK_RIGHT: [number, number, number] = [20, 25, 35];
const TABLE_HEAD_GRAY: [number, number, number] = [85, 85, 85];
const LINE_TABLE: [number, number, number] = [220, 220, 220];
const TEXT_DARK: [number, number, number] = [51, 51, 51];
const TEXT_MID: [number, number, number] = [102, 102, 102];
const ZEBRA_FILL: [number, number, number] = [248, 248, 248];

const MARGIN_X = 42;
const HEADER_BAND_H = 108;

/**
 * Cabecera institucional: bloque rojo marca (~60 %) + bloque oscuro datos de control (~40 %).
 * Dibuja fondos primero; el texto va encima (no queda tapado).
 */
function drawWorkshopInstitutionalHeader(
  doc: jsPDF,
  pageWidth: number,
  input: WorkshopPdfBuildInput,
  logoDataUrl: string | null,
  logoFit: { w: number; h: number } | undefined,
  y0: number,
): number {
  const innerW = pageWidth - MARGIN_X * 2;
  const wRed = innerW * 0.6;
  const wDark = innerW - wRed;
  const xRed = MARGIN_X;
  const xDark = MARGIN_X + wRed;

  doc.setFillColor(...BRAND_RED);
  doc.rect(xRed, y0, wRed, HEADER_BAND_H, "F");

  doc.setFillColor(...HEADER_DARK_RIGHT);
  doc.rect(xDark, y0, wDark, HEADER_BAND_H, "F");

  const pad = 14;
  const whiteBoxW = 100;
  const whiteBoxH = 64;
  const rx = 5;
  const bx = xRed + pad;
  const by = y0 + pad;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(bx, by, whiteBoxW, whiteBoxH, rx, rx, "F");

  if (logoDataUrl) {
    try {
      const fmt = logoDataUrl.includes("image/png") ? "PNG" : "JPEG";
      const maxLw = whiteBoxW - 12;
      const maxLh = whiteBoxH - 12;
      let lw = logoFit?.w ?? 80;
      let lh = logoFit?.h ?? 24;
      const scale = Math.min(maxLw / lw, maxLh / lh, 1);
      lw *= scale;
      lh *= scale;
      doc.addImage(logoDataUrl, fmt, bx + (whiteBoxW - lw) / 2, by + (whiteBoxH - lh) / 2, lw, lh);
    } catch {
      /* sin logo */
    }
  }

  const textColX = bx + whiteBoxW + 16;
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("KÜCHE", textColX, y0 + 38);
  doc.setFontSize(11);
  doc.text("HOJA DE TALLER", textColX, y0 + 56);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("Documento técnico de fabricación", textColX, y0 + 72);
  doc.setTextColor(...TEXT_DARK);

  const padInner = 16;
  const labelX = xDark + padInner;
  const valueRight = xDark + wDark - padInner;
  const dateStr = new Date().toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("FECHA", labelX, y0 + 34);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(dateStr, valueRight, y0 + 34, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("TIPO DE PROYECTO", labelX, y0 + 56);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const tipoLines = doc.splitTextToSize(input.projectType || "—", wDark - padInner * 2 - 2);
  let ty = y0 + 66;
  for (const line of tipoLines) {
    doc.text(line, valueRight, ty, { align: "right" });
    ty += 11;
  }
  doc.setTextColor(...TEXT_DARK);

  return y0 + HEADER_BAND_H;
}

/**
 * Genera el PDF de «Hoja de taller» (alineado a la estética institucional de cotización formal).
 */
export async function buildWorkshopPdfDataUrl(
  input: WorkshopPdfBuildInput,
  logoDataUrl: string | null,
): Promise<string> {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const logoFit = await getLogoFitSizeForPdf(logoDataUrl);

  const yHeaderEnd = drawWorkshopInstitutionalHeader(doc, pageWidth, input, logoDataUrl, logoFit, 36);

  let y = yHeaderEnd + 18;
  const innerW = pageWidth - MARGIN_X * 2;
  const gap = 28;
  const colW = (innerW - gap) / 2;
  const leftX = MARGIN_X;
  const rightX = MARGIN_X + colW + gap;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...TEXT_MID);
  doc.text("CLIENTE", leftX, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...TEXT_DARK);
  const clientLines = doc.splitTextToSize(input.client || "—", colW);
  let yL = y + 10;
  for (const line of clientLines) {
    doc.text(line, leftX, yL);
    yL += 12;
  }
  yL += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...TEXT_MID);
  doc.text("DIRECCIÓN", leftX, yL);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...TEXT_DARK);
  const dirLines = doc.splitTextToSize(input.location || "—", colW);
  yL += 10;
  for (const line of dirLines) {
    doc.text(line, leftX, yL);
    yL += 12;
  }

  let yR = y;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...TEXT_MID);
  doc.text("ENTREGA (SEMANAS)", rightX, yR);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...TEXT_DARK);
  doc.text(input.deliveryWeeksLabel || "—", rightX + colW, yR + 10, { align: "right" });
  yR += 28;

  const lineH = 13;
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_MID);
  doc.text("Total", rightX + colW - 72, yR, { align: "right" });
  doc.setTextColor(...TEXT_DARK);
  doc.setFontSize(10);
  doc.text(formatCurrency(input.precioTotalSinIva), rightX + colW, yR, { align: "right" });
  yR += lineH;
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_MID);
  doc.text("IVA (16%)", rightX + colW - 72, yR, { align: "right" });
  doc.setTextColor(...TEXT_DARK);
  doc.setFontSize(10);
  doc.text(formatCurrency(input.montoIva), rightX + colW, yR, { align: "right" });
  yR += lineH + 2;
  doc.setDrawColor(...LINE_TABLE);
  doc.setLineWidth(0.35);
  doc.line(rightX + colW - 120, yR - 4, rightX + colW, yR - 4);
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_MID);
  doc.text("Total neto", rightX + colW - 72, yR + 6, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...TEXT_DARK);
  doc.text(formatCurrency(input.totalNeto), rightX + colW, yR + 6, { align: "right" });
  doc.setFont("helvetica", "normal");

  y = Math.max(yL, yR + 28) + 16;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...TEXT_DARK);
  doc.text("Detalle técnico", MARGIN_X, y);

  const tableStartY = y + 10;
  const bodyRows: RowInput[] =
    input.lines.length > 0
      ? input.lines.map((l) => [
          l.label,
          l.category,
          l.unit,
          String(l.qty),
          formatCurrency(l.unitPrice),
          formatCurrency(l.lineTotal),
        ])
      : [
          [
            {
              content: "Sin materiales seleccionados.",
              colSpan: 6,
              styles: {
                halign: "center",
                textColor: TEXT_MID,
                fontStyle: "italic",
              } as const,
            },
          ],
        ];

  autoTable(doc, {
    startY: tableStartY,
    pageBreak: "auto",
    head: [["Material", "Categoría", "Unidad", "Cant.", "P. unit.", "Total"]],
    body: bodyRows,
    theme: "plain",
    margin: { left: MARGIN_X, right: MARGIN_X, top: 48, bottom: 40 },
    styles: {
      font: "helvetica",
      fontSize: 8,
      textColor: TEXT_DARK,
      cellPadding: { top: 4, right: 5, bottom: 4, left: 5 },
      lineColor: LINE_TABLE,
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: TABLE_HEAD_GRAY,
      textColor: 255,
      fontStyle: "bold",
      fontSize: 8,
      cellPadding: { top: 6, right: 5, bottom: 6, left: 5 },
    },
    alternateRowStyles: { fillColor: ZEBRA_FILL },
    columnStyles: {
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" },
    },
    didDrawCell: (d) => {
      if (d.section === "body") {
        doc.setDrawColor(...LINE_TABLE);
        doc.setLineWidth(0.1);
        doc.line(
          d.cell.x,
          d.cell.y + d.cell.height,
          d.cell.x + d.cell.width,
          d.cell.y + d.cell.height,
        );
      }
    },
  });

  const footerY = pageH - 32;
  doc.setDrawColor(LINE_TABLE[0], LINE_TABLE[1], LINE_TABLE[2]);
  doc.setLineWidth(0.35);
  doc.line(MARGIN_X, footerY - 6, pageWidth - MARGIN_X, footerY - 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...TEXT_MID);
  doc.text("Küche · Hoja de taller · Documento interno de fabricación", MARGIN_X, footerY + 6);

  const blob = doc.output("blob");
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}
