import {
  createPdfDocument,
  addHeader,
  addFooter,
  addSectionTitle,
  addInfoGrid,
  addTable,
  checkPageBreak,
  BRAND_COLOR,
} from "@/lib/pdf";
import { getRiskLevelLabel } from "@/lib/utils";

const RISK_COLORS: Record<string, [number, number, number]> = {
  low: [16, 124, 16],
  medium: [157, 93, 0],
  high: [234, 118, 0],
  critical: [196, 49, 75],
};

const TREATMENT_LABELS: Record<string, string> = {
  accept: "Aceitar",
  mitigate: "Mitigar",
  transfer: "Transferir",
  avoid: "Evitar",
};

const CATEGORY_LABELS: Record<string, string> = {
  strategic: "Estratégico",
  operational: "Operacional",
  compliance: "Conformidade",
  financial: "Financeiro",
  technology: "Tecnologia",
  legal: "Legal",
};

interface RiskReportData {
  projectName: string;
  risks: {
    code: string;
    title: string;
    description: string;
    category: string;
    probability: number;
    impact: number;
    riskLevel: string;
    treatment: string | null;
    treatmentPlan: string | null;
    status: string;
    responsible?: { name: string } | null;
    treatments?: { description: string; status: string }[];
  }[];
}

export function generateRiskReport(data: RiskReportData, tenantName?: string) {
  const doc = createPdfDocument();

  addHeader(doc, { title: "Avaliação de Riscos", tenantName });

  let y = 32;

  // Stats
  const total = data.risks.length;
  const critical = data.risks.filter((r) => r.riskLevel === "critical").length;
  const high = data.risks.filter((r) => r.riskLevel === "high").length;
  const medium = data.risks.filter((r) => r.riskLevel === "medium").length;
  const low = data.risks.filter((r) => r.riskLevel === "low").length;

  y = addSectionTitle(doc, `Projeto: ${data.projectName}`, y);
  y = addInfoGrid(
    doc,
    [
      { label: "Total de Riscos", value: String(total) },
      { label: "Críticos", value: String(critical) },
      { label: "Altos", value: String(high) },
      { label: "Médios", value: String(medium) },
      { label: "Baixos", value: String(low) },
    ],
    y,
    3
  );

  // Risk Matrix 5x5
  y = checkPageBreak(doc, y, 70);
  y = addSectionTitle(doc, "Matriz de Riscos", y);

  const cellSize = 18;
  const matrixX = 40;
  const matrixY = y;

  // Build matrix data
  const matrixData: Record<string, number> = {};
  data.risks.forEach((r) => {
    const key = `${r.probability}-${r.impact}`;
    matrixData[key] = (matrixData[key] || 0) + 1;
  });

  // Labels
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND_COLOR);
  doc.text("Probabilidade", matrixX - 18, matrixY + (cellSize * 5) / 2, {
    angle: 90,
  });
  doc.text(
    "Impacto",
    matrixX + (cellSize * 5) / 2,
    matrixY + cellSize * 5 + 8,
    { align: "center" }
  );

  for (let prob = 5; prob >= 1; prob--) {
    for (let imp = 1; imp <= 5; imp++) {
      const cx = matrixX + (imp - 1) * cellSize;
      const cy = matrixY + (5 - prob) * cellSize;
      const score = prob * imp;

      // Color by risk level
      let fillColor: [number, number, number];
      if (score >= 15) fillColor = [253, 231, 233]; // critical bg
      else if (score >= 10) fillColor = [255, 237, 213]; // high bg
      else if (score >= 5) fillColor = [255, 244, 206]; // medium bg
      else fillColor = [223, 246, 221]; // low bg

      doc.setFillColor(...fillColor);
      doc.setDrawColor(209, 209, 209);
      doc.rect(cx, cy, cellSize, cellSize, "FD");

      // Count in cell
      const key = `${prob}-${imp}`;
      const count = matrixData[key] || 0;
      if (count > 0) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(36, 36, 36);
        doc.text(String(count), cx + cellSize / 2, cy + cellSize / 2 + 2, {
          align: "center",
        });
      }

      // Axis labels
      if (prob === 1) {
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(97, 97, 97);
        doc.text(String(imp), cx + cellSize / 2, cy + cellSize + 5, {
          align: "center",
        });
      }
      if (imp === 1) {
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(97, 97, 97);
        doc.text(String(prob), cx - 4, cy + cellSize / 2 + 1, {
          align: "center",
        });
      }
    }
  }

  y = matrixY + cellSize * 5 + 15;

  // Risk table by level
  const sortedRisks = [...data.risks].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return (
      (order[a.riskLevel as keyof typeof order] ?? 4) -
      (order[b.riskLevel as keyof typeof order] ?? 4)
    );
  });

  y = checkPageBreak(doc, y, 25);
  y = addSectionTitle(doc, "Lista de Riscos", y);

  const headers = [
    "Código",
    "Título",
    "Categoria",
    "P",
    "I",
    "Nível",
    "Tratamento",
    "Responsável",
  ];
  const rows = sortedRisks.map((r) => [
    r.code,
    r.title,
    CATEGORY_LABELS[r.category] || r.category,
    String(r.probability),
    String(r.impact),
    getRiskLevelLabel(r.riskLevel),
    r.treatment ? TREATMENT_LABELS[r.treatment] || r.treatment : "—",
    r.responsible?.name || "—",
  ]);

  y = addTable(doc, {
    headers,
    rows,
    y,
    columnStyles: {
      0: { cellWidth: 18 },
      3: { cellWidth: 10, halign: "center" },
      4: { cellWidth: 10, halign: "center" },
      5: { cellWidth: 22 },
    },
  });

  // Detail per critical/high risk
  const criticalHighRisks = sortedRisks.filter(
    (r) => r.riskLevel === "critical" || r.riskLevel === "high"
  );

  if (criticalHighRisks.length > 0) {
    y = checkPageBreak(doc, y, 25);
    y = addSectionTitle(doc, "Detalhamento — Riscos Críticos e Altos", y);

    for (const risk of criticalHighRisks) {
      y = checkPageBreak(doc, y, 30);

      const color = RISK_COLORS[risk.riskLevel] || [36, 36, 36];
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...color);
      doc.text(`${risk.code} — ${risk.title}`, 20, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(36, 36, 36);
      const descLines = doc.splitTextToSize(risk.description, 150);
      doc.text(descLines, 20, y);
      y += descLines.length * 4 + 2;

      if (risk.treatmentPlan) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(97, 97, 97);
        doc.text("Plano de Tratamento:", 20, y);
        y += 4;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(36, 36, 36);
        const planLines = doc.splitTextToSize(risk.treatmentPlan, 150);
        doc.text(planLines, 20, y);
        y += planLines.length * 4 + 4;
      }

      y += 4;
    }
  }

  addFooter(doc, { tenantName });

  doc.save(
    `riscos_${data.projectName.replace(/\s+/g, "_").toLowerCase()}.pdf`
  );
}
