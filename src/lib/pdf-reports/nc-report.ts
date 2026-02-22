import {
  createPdfDocument,
  addHeader,
  addFooter,
  addSectionTitle,
  addInfoGrid,
  addTable,
  addTextBlock,
  checkPageBreak,
} from "@/lib/pdf";
import {
  getStatusLabel,
  getSeverityLabel,
  getOriginLabel,
  formatDate,
} from "@/lib/utils";

const ROOT_CAUSE_METHODS: Record<string, string> = {
  five_whys: "5 Porquês",
  ishikawa: "Ishikawa",
  fault_tree: "Árvore de Falhas",
  brainstorming: "Brainstorming",
};

interface NcReportData {
  code: string;
  title: string;
  description: string;
  origin: string;
  severity: string;
  status: string;
  dueDate: string | Date | null;
  closedAt: string | Date | null;
  createdAt: string | Date;
  project?: { name: string } | null;
  responsible?: { name: string; email: string } | null;
  clause?: { code: string; title: string } | null;
  rootCause?: {
    method: string;
    analysis: Record<string, unknown>;
    conclusion: string | null;
  } | null;
  actionPlans?: {
    code: string;
    title: string;
    status: string;
    dueDate: string | Date | null;
    responsible?: { name: string } | null;
  }[];
}

export function generateNcReport(nc: NcReportData, tenantName?: string) {
  const doc = createPdfDocument();

  addHeader(doc, { title: "Relatório de Não Conformidade", tenantName });

  let y = 32;

  // Info section
  y = addSectionTitle(doc, "Informações Gerais", y);
  y = addInfoGrid(
    doc,
    [
      { label: "Código", value: nc.code },
      { label: "Status", value: getStatusLabel(nc.status) },
      { label: "Título", value: nc.title },
      { label: "Severidade", value: getSeverityLabel(nc.severity) },
      { label: "Origem", value: getOriginLabel(nc.origin) },
      {
        label: "Responsável",
        value: nc.responsible?.name || "Não definido",
      },
      { label: "Projeto", value: nc.project?.name || "—" },
      {
        label: "Cláusula",
        value: nc.clause ? `${nc.clause.code} - ${nc.clause.title}` : "—",
      },
      { label: "Prazo", value: nc.dueDate ? formatDate(nc.dueDate) : "—" },
      {
        label: "Fechada em",
        value: nc.closedAt ? formatDate(nc.closedAt) : "—",
      },
    ],
    y
  );

  // Description
  y = checkPageBreak(doc, y, 25);
  y = addSectionTitle(doc, "Descrição", y);
  y = addTextBlock(doc, nc.description, y);

  // Root Cause
  if (nc.rootCause) {
    y = checkPageBreak(doc, y, 25);
    y = addSectionTitle(doc, "Análise de Causa Raiz", y);
    y = addInfoGrid(
      doc,
      [
        {
          label: "Método",
          value:
            ROOT_CAUSE_METHODS[nc.rootCause.method] || nc.rootCause.method,
        },
        {
          label: "Conclusão",
          value: nc.rootCause.conclusion || "Sem conclusão",
        },
      ],
      y
    );

    // Render analysis details
    const analysis = nc.rootCause.analysis;
    if (nc.rootCause.method === "five_whys" && analysis.whys) {
      const whys = analysis.whys as string[];
      whys.forEach((why, i) => {
        if (why) {
          y = checkPageBreak(doc, y, 8);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(97, 97, 97);
          doc.text(`Porquê ${i + 1}:`, 20, y);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(36, 36, 36);
          doc.text(why, 48, y);
          y += 6;
        }
      });
      y += 4;
    } else if (nc.rootCause.method === "ishikawa" && analysis.categories) {
      const categories = analysis.categories as Record<string, string>;
      Object.entries(categories).forEach(([cat, detail]) => {
        if (detail) {
          y = checkPageBreak(doc, y, 8);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(97, 97, 97);
          doc.text(`${cat}:`, 20, y);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(36, 36, 36);
          const lines = doc.splitTextToSize(String(detail), 120);
          doc.text(lines, 55, y);
          y += lines.length * 4.5 + 2;
        }
      });
      y += 4;
    }
  }

  // Action Plans
  if (nc.actionPlans && nc.actionPlans.length > 0) {
    y = checkPageBreak(doc, y, 25);
    y = addSectionTitle(doc, "Planos de Ação", y);

    const headers = ["Código", "Título", "Status", "Prazo", "Responsável"];
    const rows = nc.actionPlans.map((ap) => [
      ap.code,
      ap.title,
      getStatusLabel(ap.status),
      ap.dueDate ? formatDate(ap.dueDate) : "—",
      ap.responsible?.name || "—",
    ]);

    addTable(doc, { headers, rows, y });
  }

  addFooter(doc, { tenantName });

  doc.save(`nc_${nc.code.replace(/\s+/g, "_").toLowerCase()}.pdf`);
}
