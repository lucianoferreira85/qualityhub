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
  getAuditTypeLabel,
  getStatusLabel,
  getConclusionLabel,
  getClassificationLabel,
  formatDate,
} from "@/lib/utils";

interface AuditReportData {
  title: string;
  type: string;
  status: string;
  startDate: string | Date;
  endDate: string | Date | null;
  scope: string | null;
  conclusion: string | null;
  notes: string | null;
  leadAuditor?: { name: string; email: string } | null;
  project?: { name: string } | null;
  findings?: {
    classification: string;
    description: string;
    evidence: string | null;
    clause?: { code: string; title: string } | null;
    nonconformity?: { code: string } | null;
  }[];
}

export function generateAuditReport(
  audit: AuditReportData,
  tenantName?: string
) {
  const doc = createPdfDocument();

  addHeader(doc, { title: "Relatório de Auditoria", tenantName });

  let y = 32;

  // Info section
  y = addSectionTitle(doc, "Informações Gerais", y);
  y = addInfoGrid(
    doc,
    [
      { label: "Título", value: audit.title },
      { label: "Tipo", value: getAuditTypeLabel(audit.type) },
      { label: "Status", value: getStatusLabel(audit.status) },
      {
        label: "Conclusão",
        value: audit.conclusion
          ? getConclusionLabel(audit.conclusion)
          : "Sem conclusão",
      },
      {
        label: "Período",
        value: `${formatDate(audit.startDate)}${audit.endDate ? ` — ${formatDate(audit.endDate)}` : ""}`,
      },
      {
        label: "Auditor Líder",
        value: audit.leadAuditor?.name || "Não definido",
      },
      { label: "Projeto", value: audit.project?.name || "—" },
    ],
    y
  );

  // Scope
  if (audit.scope) {
    y = checkPageBreak(doc, y, 25);
    y = addSectionTitle(doc, "Escopo", y);
    y = addTextBlock(doc, audit.scope, y);
  }

  // Findings
  if (audit.findings && audit.findings.length > 0) {
    y = checkPageBreak(doc, y, 25);
    y = addSectionTitle(doc, "Constatações", y);

    const headers = [
      "Classificação",
      "Descrição",
      "Evidência",
      "Cláusula",
      "NC",
    ];
    const rows = audit.findings.map((f) => [
      getClassificationLabel(f.classification),
      f.description,
      f.evidence || "—",
      f.clause ? `${f.clause.code} - ${f.clause.title}` : "—",
      f.nonconformity?.code || "—",
    ]);

    y = addTable(doc, {
      headers,
      rows,
      y,
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 50 },
        3: { cellWidth: 35 },
        4: { cellWidth: 20 },
      },
    });
  }

  // Notes
  if (audit.notes) {
    y = checkPageBreak(doc, y, 25);
    y = addSectionTitle(doc, "Observações", y);
    addTextBlock(doc, audit.notes, y);
  }

  addFooter(doc, { tenantName });

  doc.save(`auditoria_${audit.title.replace(/\s+/g, "_").toLowerCase()}.pdf`);
}
