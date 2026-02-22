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

interface GapItem {
  code: string;
  title: string;
  type: "requirement" | "control";
  maturity: number;
  gap: number;
  domain: string;
}

interface DomainData {
  domain: string;
  avgMaturity: number;
  items: GapItem[];
}

interface StandardData {
  standardCode: string;
  standardName: string;
  avgMaturity: number;
  byDomain: DomainData[];
}

interface GapAnalysisReportData {
  projectName: string;
  targetMaturity: number;
  overall: {
    totalItems: number;
    averageMaturity: number;
    compliantCount: number;
    gapPercentage: number;
  };
  byStandard: StandardData[];
  maturityDistribution: { level: number; label: string; count: number }[];
  topGaps: GapItem[];
}

const MATURITY_LABELS = [
  "Inexistente",
  "Inicial",
  "Definido",
  "Gerenciado",
  "Otimizado",
];

const MATURITY_COLORS: [number, number, number][] = [
  [138, 136, 134], // 0 - gray
  [196, 49, 75],   // 1 - danger
  [255, 185, 0],   // 2 - warning
  [0, 120, 212],   // 3 - brand
  [16, 124, 16],   // 4 - success
];

export function generateGapAnalysisReport(
  data: GapAnalysisReportData,
  tenantName?: string
) {
  const doc = createPdfDocument();

  addHeader(doc, { title: "Relatório de Gap Analysis", tenantName });

  let y = 32;

  // Project & Overall Stats
  y = addSectionTitle(doc, `Projeto: ${data.projectName}`, y);
  y = addInfoGrid(
    doc,
    [
      { label: "Total de Itens Avaliados", value: String(data.overall.totalItems) },
      {
        label: "Maturidade Média",
        value: `${data.overall.averageMaturity.toFixed(1)} / ${data.targetMaturity}`,
      },
      { label: "Itens Conformes", value: String(data.overall.compliantCount) },
      { label: "% de Gap", value: `${data.overall.gapPercentage.toFixed(1)}%` },
      { label: "Maturidade Alvo", value: `Nível ${data.targetMaturity}` },
      {
        label: "Normas Avaliadas",
        value: String(data.byStandard.length),
      },
    ],
    y,
    3
  );

  // Maturity Distribution
  y = checkPageBreak(doc, y, 50);
  y = addSectionTitle(doc, "Distribuição de Maturidade", y);

  if (data.maturityDistribution.length > 0) {
    const barMaxWidth = 120;
    const maxCount = Math.max(...data.maturityDistribution.map((d) => d.count), 1);

    data.maturityDistribution.forEach((dist) => {
      y = checkPageBreak(doc, y, 12);

      const color = MATURITY_COLORS[dist.level] || MATURITY_COLORS[0];
      const barWidth = (dist.count / maxCount) * barMaxWidth;

      // Label
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(36, 36, 36);
      doc.text(`${dist.level} - ${MATURITY_LABELS[dist.level] || dist.label}`, 20, y + 3);

      // Bar background
      doc.setFillColor(243, 242, 241);
      doc.roundedRect(60, y - 1, barMaxWidth, 6, 1, 1, "F");

      // Bar filled
      if (barWidth > 0) {
        doc.setFillColor(...color);
        doc.roundedRect(60, y - 1, Math.max(barWidth, 2), 6, 1, 1, "F");
      }

      // Count
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(97, 97, 97);
      doc.text(
        `${dist.count} (${data.overall.totalItems > 0 ? Math.round((dist.count / data.overall.totalItems) * 100) : 0}%)`,
        60 + barMaxWidth + 5,
        y + 3
      );

      y += 10;
    });

    y += 5;
  }

  // Per-standard breakdown
  for (const std of data.byStandard) {
    y = checkPageBreak(doc, y, 30);
    y = addSectionTitle(doc, `${std.standardCode} — ${std.standardName}`, y);

    y = addInfoGrid(
      doc,
      [
        {
          label: "Maturidade Média",
          value: `${std.avgMaturity.toFixed(1)} / ${data.targetMaturity}`,
        },
        {
          label: "Total de Domínios",
          value: String(std.byDomain.length),
        },
      ],
      y
    );

    // Domain summary table
    if (std.byDomain.length > 0) {
      const headers = ["Domínio", "Maturidade Média", "Itens", "Gap Médio"];
      const rows = std.byDomain.map((d) => {
        const avgGap =
          d.items.length > 0
            ? (d.items.reduce((s, i) => s + i.gap, 0) / d.items.length).toFixed(1)
            : "0.0";
        return [
          d.domain,
          `${d.avgMaturity.toFixed(1)} / ${data.targetMaturity}`,
          String(d.items.length),
          avgGap,
        ];
      });

      y = addTable(doc, {
        headers,
        rows,
        y,
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 35 },
          2: { cellWidth: 20 },
          3: { cellWidth: 25 },
        },
      });
    }

    // Detailed items per domain
    for (const domain of std.byDomain) {
      if (domain.items.length === 0) continue;

      y = checkPageBreak(doc, y, 25);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...BRAND_COLOR);
      doc.text(domain.domain, 20, y);
      y += 6;

      const itemHeaders = ["Código", "Título", "Tipo", "Maturidade", "Gap"];
      const itemRows = domain.items.map((item) => [
        item.code,
        item.title,
        item.type === "requirement" ? "Requisito" : "Controle",
        `${item.maturity} — ${MATURITY_LABELS[item.maturity] || "?"}`,
        String(item.gap),
      ]);

      y = addTable(doc, {
        headers: itemHeaders,
        rows: itemRows,
        y,
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 60 },
          2: { cellWidth: 20 },
          3: { cellWidth: 35 },
          4: { cellWidth: 15 },
        },
      });
    }
  }

  // Top Gaps
  if (data.topGaps.length > 0) {
    y = checkPageBreak(doc, y, 25);
    y = addSectionTitle(doc, "Maiores Gaps (Top 10)", y);

    const headers = ["Código", "Título", "Domínio", "Maturidade", "Gap"];
    const rows = data.topGaps.slice(0, 10).map((g) => [
      g.code,
      g.title,
      g.domain,
      `${g.maturity} — ${MATURITY_LABELS[g.maturity] || "?"}`,
      String(g.gap),
    ]);

    addTable(doc, {
      headers,
      rows,
      y,
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 55 },
        2: { cellWidth: 40 },
        3: { cellWidth: 30 },
        4: { cellWidth: 15 },
      },
    });
  }

  addFooter(doc, { tenantName });

  doc.save(
    `gap_analysis_${data.projectName.replace(/\s+/g, "_").toLowerCase()}.pdf`
  );
}
