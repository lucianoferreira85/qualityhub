import {
  createPdfDocument,
  addHeader,
  addFooter,
  addSectionTitle,
  addInfoGrid,
  addTextBlock,
  checkPageBreak,
} from "@/lib/pdf";
import { getStatusLabel, formatDate } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  corrective: "Corretiva",
  preventive: "Preventiva",
  improvement: "Melhoria",
};

interface ActionPlanReportData {
  code: string;
  title: string;
  description: string;
  type: string;
  status: string;
  dueDate: string | Date | null;
  completedAt: string | Date | null;
  verifiedAt: string | Date | null;
  verificationNotes: string | null;
  createdAt: string | Date;
  project?: { name: string } | null;
  responsible?: { name: string } | null;
  nonconformity?: { code: string; title: string } | null;
  risk?: { code: string; title: string } | null;
}

export function generateActionPlanReport(
  ap: ActionPlanReportData,
  tenantName?: string
) {
  const doc = createPdfDocument();

  addHeader(doc, { title: "Relatório de Plano de Ação", tenantName });

  let y = 32;

  // Info section
  y = addSectionTitle(doc, "Informações Gerais", y);
  y = addInfoGrid(
    doc,
    [
      { label: "Código", value: ap.code },
      { label: "Status", value: getStatusLabel(ap.status) },
      { label: "Título", value: ap.title },
      { label: "Tipo", value: TYPE_LABELS[ap.type] || ap.type },
      {
        label: "Responsável",
        value: ap.responsible?.name || "Não definido",
      },
      { label: "Prazo", value: ap.dueDate ? formatDate(ap.dueDate) : "—" },
      { label: "Projeto", value: ap.project?.name || "—" },
      {
        label: "Criado em",
        value: formatDate(ap.createdAt),
      },
      {
        label: "NC Vinculada",
        value: ap.nonconformity
          ? `${ap.nonconformity.code} - ${ap.nonconformity.title}`
          : "—",
      },
      {
        label: "Risco Vinculado",
        value: ap.risk
          ? `${ap.risk.code} - ${ap.risk.title}`
          : "—",
      },
    ],
    y
  );

  // Description
  y = checkPageBreak(doc, y, 25);
  y = addSectionTitle(doc, "Descrição", y);
  y = addTextBlock(doc, ap.description, y);

  // Completion info
  if (ap.completedAt || ap.verifiedAt) {
    y = checkPageBreak(doc, y, 25);
    y = addSectionTitle(doc, "Conclusão e Verificação", y);
    const items = [];
    if (ap.completedAt) {
      items.push({ label: "Concluída em", value: formatDate(ap.completedAt) });
    }
    if (ap.verifiedAt) {
      items.push({ label: "Verificada em", value: formatDate(ap.verifiedAt) });
    }
    y = addInfoGrid(doc, items, y);
  }

  // Verification notes
  if (ap.verificationNotes) {
    y = checkPageBreak(doc, y, 25);
    y = addSectionTitle(doc, "Notas de Verificação", y);
    addTextBlock(doc, ap.verificationNotes, y);
  }

  addFooter(doc, { tenantName });

  doc.save(`acao_${ap.code.replace(/\s+/g, "_").toLowerCase()}.pdf`);
}
