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
import { formatDate } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Agendada",
  in_progress: "Em Andamento",
  completed: "Concluída",
  cancelled: "Cancelada",
};

interface Decision {
  text: string;
  responsible?: string;
  deadline?: string;
}

interface ManagementReviewReportData {
  scheduledDate: string | Date;
  actualDate: string | Date | null;
  status: string;
  minutes: string | null;
  decisions: Decision[];
  project?: { name: string } | null;
}

export function generateManagementReviewReport(
  review: ManagementReviewReportData,
  tenantName?: string
) {
  const doc = createPdfDocument();

  addHeader(doc, { title: "Relatório de Análise Crítica", tenantName });

  let y = 32;

  // Info section
  y = addSectionTitle(doc, "Informações Gerais", y);
  y = addInfoGrid(
    doc,
    [
      {
        label: "Status",
        value: STATUS_LABELS[review.status] || review.status,
      },
      { label: "Projeto", value: review.project?.name || "—" },
      {
        label: "Data Agendada",
        value: formatDate(review.scheduledDate),
      },
      {
        label: "Data Realizada",
        value: review.actualDate ? formatDate(review.actualDate) : "—",
      },
    ],
    y
  );

  // Minutes
  if (review.minutes) {
    y = checkPageBreak(doc, y, 25);
    y = addSectionTitle(doc, "Ata da Reunião", y);
    y = addTextBlock(doc, review.minutes, y);
  }

  // Decisions table
  if (review.decisions && review.decisions.length > 0) {
    y = checkPageBreak(doc, y, 25);
    y = addSectionTitle(doc, "Decisões", y);

    const headers = ["#", "Decisão", "Responsável", "Prazo"];
    const rows = review.decisions.map((d, i) => [
      String(i + 1),
      d.text || "",
      d.responsible || "—",
      d.deadline ? formatDate(d.deadline) : "—",
    ]);

    addTable(doc, { headers, rows, y });
  }

  addFooter(doc, { tenantName });

  const dateStr = formatDate(review.scheduledDate).replace(/\//g, "-");
  doc.save(`analise_critica_${dateStr}.pdf`);
}
