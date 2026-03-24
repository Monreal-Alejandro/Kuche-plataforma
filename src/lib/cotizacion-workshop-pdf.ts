import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { RowInput } from "jspdf-autotable";

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

function getTableFinalY(doc: jsPDF): number {
  return (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 0;
}

/**
 * Genera el PDF de «Hoja de taller» (mismo contenido lógico que la vista de impresión del cotizador).
 * Devuelve data URL para guardar en IndexedDB o abrir en pestaña.
 */
export async function buildWorkshopPdfDataUrl(
  input: WorkshopPdfBuildInput,
  logoDataUrl: string | null,
): Promise<string> {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 42;
  const dark: [number, number, number] = [31, 41, 55];
  const muted: [number, number, number] = [100, 116, 139];
  const softFill: [number, number, number] = [248, 250, 252];
  const lightBorder: [number, number, number] = [226, 232, 240];

  let y = 36;
  const logoW = 100;
  const logoH = 36;

  if (logoDataUrl) {
    try {
      const fmt = logoDataUrl.includes("image/png") ? "PNG" : "JPEG";
      doc.addImage(logoDataUrl, fmt, marginX, y, logoW, logoH);
    } catch {
      // sin logo si falla el decode
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(dark[0], dark[1], dark[2]);
  doc.text("Hoja de Taller", marginX + (logoDataUrl ? logoW + 14 : 0), y + 24);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(muted[0], muted[1], muted[2]);
  const dateStr = new Date().toLocaleDateString("es-MX");
  doc.text(dateStr, pageWidth - marginX, y + 14, { align: "right" });

  y += logoH + 18;
  doc.setFontSize(10);
  doc.setTextColor(dark[0], dark[1], dark[2]);
  doc.text(`${input.client} · ${input.projectType}`, marginX, y);
  y += 14;
  doc.setTextColor(muted[0], muted[1], muted[2]);
  doc.text(
    `${input.location} · Entrega: ${input.deliveryWeeksLabel}`,
    marginX,
    y,
    { maxWidth: pageWidth - marginX * 2 },
  );

  y += 28;
  autoTable(doc, {
    startY: y,
    body: [
      ["Total", formatCurrency(input.precioTotalSinIva)],
      ["IVA (16%)", formatCurrency(input.montoIva)],
      ["Total neto", formatCurrency(input.totalNeto)],
    ],
    theme: "grid",
    styles: {
      fontSize: 9,
      textColor: dark,
      lineColor: lightBorder,
      lineWidth: 0.5,
      cellPadding: 6,
    },
    columnStyles: {
      0: { fontStyle: "bold", fillColor: softFill },
      1: { halign: "right", fontStyle: "bold" },
    },
    margin: { left: marginX, right: marginX },
  });

  const afterSummary = getTableFinalY(doc) + 18;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(dark[0], dark[1], dark[2]);
  doc.text("Detalle técnico", marginX, afterSummary);

  const tableStartY = afterSummary + 8;
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
                textColor: muted,
                fontStyle: "italic",
              } as const,
            },
          ],
        ];

  autoTable(doc, {
    startY: tableStartY,
    head: [["Material", "Categoría", "Unidad", "Cant.", "P. unit.", "Total"]],
    body: bodyRows,
    theme: "grid",
    styles: {
      fontSize: 8,
      textColor: dark,
      lineColor: lightBorder,
      lineWidth: 0.5,
      cellPadding: 5,
    },
    headStyles: { fillColor: softFill, textColor: dark, fontStyle: "bold" },
    columnStyles: {
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" },
    },
    margin: { left: marginX, right: marginX },
  });

  const footerY = doc.internal.pageSize.getHeight() - 28;
  doc.setDrawColor(lightBorder[0], lightBorder[1], lightBorder[2]);
  doc.line(marginX, footerY - 8, pageWidth - marginX, footerY - 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(muted[0], muted[1], muted[2]);
  doc.text("Kuche · Hoja de taller (sincronizada con cotización formal)", marginX, footerY + 4);

  const blob = doc.output("blob");
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}
