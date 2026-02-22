import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const BRAND_COLOR: [number, number, number] = [0, 120, 212];
const DARK_TEXT: [number, number, number] = [36, 36, 36];
const SECONDARY_TEXT: [number, number, number] = [97, 97, 97];
const LIGHT_BG: [number, number, number] = [243, 242, 241];

interface PdfOptions {
  orientation?: "portrait" | "landscape";
}

export function createPdfDocument(options?: PdfOptions): jsPDF {
  return new jsPDF({
    orientation: options?.orientation || "portrait",
    unit: "mm",
    format: "a4",
  });
}

export function addHeader(
  doc: jsPDF,
  opts: { title: string; tenantName?: string }
) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Blue header bar
  doc.setFillColor(...BRAND_COLOR);
  doc.rect(0, 0, pageWidth, 22, "F");

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(opts.title, 20, 14);

  // Tenant name + date on right
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const dateStr = new Date().toLocaleDateString("pt-BR");
  const rightText = opts.tenantName
    ? `${opts.tenantName} | ${dateStr}`
    : dateStr;
  doc.text(rightText, pageWidth - 20, 14, { align: "right" });

  doc.setTextColor(...DARK_TEXT);
}

export function addFooter(doc: jsPDF, opts?: { tenantName?: string }) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setDrawColor(209, 209, 209);
    doc.line(20, pageHeight - 15, pageWidth - 20, pageHeight - 15);

    doc.setFontSize(8);
    doc.setTextColor(...SECONDARY_TEXT);
    doc.setFont("helvetica", "normal");

    const left = opts?.tenantName
      ? `${opts.tenantName} — QualityHub`
      : "QualityHub";
    doc.text(left, 20, pageHeight - 10);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - 20, pageHeight - 10, {
      align: "right",
    });
  }
}

export function addSectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFillColor(...BRAND_COLOR);
  doc.rect(20, y, 3, 7, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...DARK_TEXT);
  doc.text(title, 26, y + 5.5);

  return y + 12;
}

export function addInfoGrid(
  doc: jsPDF,
  items: { label: string; value: string }[],
  y: number,
  cols: number = 2
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const usableWidth = pageWidth - 40;
  const colWidth = usableWidth / cols;
  let currentY = y;

  items.forEach((item, i) => {
    const col = i % cols;
    const x = 20 + col * colWidth;

    if (col === 0 && i > 0) {
      currentY += 12;
    }

    currentY = checkPageBreak(doc, currentY, 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...SECONDARY_TEXT);
    doc.text(item.label, x, currentY);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...DARK_TEXT);
    doc.text(item.value || "—", x, currentY + 5);
  });

  return currentY + 14;
}

export function addTable(
  doc: jsPDF,
  opts: {
    headers: string[];
    rows: string[][];
    y: number;
    columnStyles?: Record<number, { cellWidth?: number; halign?: string }>;
  }
): number {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let finalY = opts.y;

  autoTable(doc, {
    startY: opts.y,
    head: [opts.headers],
    body: opts.rows,
    margin: { left: 20, right: 20 },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: DARK_TEXT,
      lineColor: [209, 209, 209],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: BRAND_COLOR,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    columnStyles: opts.columnStyles as Record<
      number,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any
    >,
    didDrawPage: (data) => {
      finalY = data.cursor?.y || opts.y;
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  finalY = (doc as any).lastAutoTable?.finalY || finalY;
  return finalY + 5;
}

export function addTextBlock(doc: jsPDF, text: string, y: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...DARK_TEXT);

  const lines = doc.splitTextToSize(text, pageWidth - 40);
  let currentY = y;

  for (const line of lines) {
    currentY = checkPageBreak(doc, currentY, 5);
    doc.text(line, 20, currentY);
    currentY += 4.5;
  }

  return currentY + 3;
}

export function checkPageBreak(
  doc: jsPDF,
  y: number,
  requiredSpace: number
): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + requiredSpace > pageHeight - 20) {
    doc.addPage();
    return 30;
  }
  return y;
}

export function addBadge(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  color: [number, number, number]
) {
  const textWidth = doc.getTextWidth(text);
  const padding = 3;
  const height = 6;

  doc.setFillColor(color[0], color[1], color[2], 0.15);
  doc.roundedRect(x, y - 4, textWidth + padding * 2, height, 2, 2, "F");

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...color);
  doc.text(text, x + padding, y);
}

export { BRAND_COLOR, DARK_TEXT, SECONDARY_TEXT, LIGHT_BG };
