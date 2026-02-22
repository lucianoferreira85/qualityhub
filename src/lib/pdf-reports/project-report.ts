import {
  createPdfDocument,
  addHeader,
  addFooter,
  addSectionTitle,
  addInfoGrid,
  addTable,
  addTextBlock,
  checkPageBreak,
  BRAND_COLOR,
} from "@/lib/pdf";
import { getStatusLabel, formatDate } from "@/lib/utils";

interface ProjectReportData {
  name: string;
  description: string | null;
  status: string;
  progress: number;
  targetMaturity: number;
  startDate: string | Date | null;
  endDate: string | Date | null;
  createdAt: string | Date;
  client?: { name: string; contactName?: string | null } | null;
  standards?: { standard: { code: string; name: string } }[];
  members?: {
    role: string;
    user: { name: string; email: string };
  }[];
  _count?: {
    requirements?: number;
    controls?: number;
    risks?: number;
    nonconformities?: number;
    actionPlans?: number;
    audits?: number;
    documents?: number;
    securityObjectives?: number;
    policies?: number;
    informationAssets?: number;
    suppliers?: number;
  };
}

const ROLE_LABELS: Record<string, string> = {
  project_manager: "Gerente de Projeto",
  senior_consultant: "Consultor Sênior",
  junior_consultant: "Consultor Júnior",
  internal_auditor: "Auditor Interno",
  external_auditor: "Auditor Externo",
  viewer: "Visualizador",
};

export function generateProjectReport(
  project: ProjectReportData,
  tenantName?: string
) {
  const doc = createPdfDocument();

  addHeader(doc, { title: "Relatório Executivo do Projeto", tenantName });

  let y = 32;

  // Project info
  y = addSectionTitle(doc, "Informações do Projeto", y);
  y = addInfoGrid(
    doc,
    [
      { label: "Nome do Projeto", value: project.name },
      { label: "Status", value: getStatusLabel(project.status) },
      { label: "Cliente", value: project.client?.name || "—" },
      { label: "Progresso", value: `${Number(project.progress)}%` },
      {
        label: "Data de Início",
        value: project.startDate ? formatDate(project.startDate) : "—",
      },
      {
        label: "Data de Conclusão",
        value: project.endDate ? formatDate(project.endDate) : "—",
      },
      {
        label: "Maturidade Alvo",
        value: `Nível ${project.targetMaturity}`,
      },
      {
        label: "Criado em",
        value: formatDate(project.createdAt),
      },
    ],
    y
  );

  // Description
  if (project.description) {
    y = checkPageBreak(doc, y, 25);
    y = addSectionTitle(doc, "Descrição", y);
    y = addTextBlock(doc, project.description, y);
  }

  // Linked standards
  if (project.standards && project.standards.length > 0) {
    y = checkPageBreak(doc, y, 25);
    y = addSectionTitle(doc, "Normas Vinculadas", y);

    const headers = ["Código", "Norma"];
    const rows = project.standards.map((ps) => [
      ps.standard.code,
      ps.standard.name,
    ]);

    y = addTable(doc, {
      headers,
      rows,
      y,
      columnStyles: {
        0: { cellWidth: 35 },
      },
    });
  }

  // KPI Overview
  if (project._count) {
    y = checkPageBreak(doc, y, 40);
    y = addSectionTitle(doc, "Visão Geral — Números do Projeto", y);

    const c = project._count;
    const kpis = [
      { label: "Requisitos", value: String(c.requirements || 0) },
      { label: "Controles", value: String(c.controls || 0) },
      { label: "Riscos", value: String(c.risks || 0) },
      { label: "Não Conformidades", value: String(c.nonconformities || 0) },
      { label: "Planos de Ação", value: String(c.actionPlans || 0) },
      { label: "Auditorias", value: String(c.audits || 0) },
      { label: "Documentos", value: String(c.documents || 0) },
      { label: "Objetivos", value: String(c.securityObjectives || 0) },
      { label: "Políticas", value: String(c.policies || 0) },
      { label: "Ativos", value: String(c.informationAssets || 0) },
      { label: "Fornecedores", value: String(c.suppliers || 0) },
    ];

    y = addInfoGrid(doc, kpis, y, 4);
  }

  // Progress bar
  y = checkPageBreak(doc, y, 20);
  y = addSectionTitle(doc, "Progresso Geral", y);

  const barX = 20;
  const barWidth = doc.internal.pageSize.getWidth() - 40;
  const barHeight = 8;
  const progressVal = Number(project.progress) / 100;

  // Background
  doc.setFillColor(243, 242, 241);
  doc.roundedRect(barX, y, barWidth, barHeight, 2, 2, "F");

  // Filled portion
  if (progressVal > 0) {
    doc.setFillColor(...BRAND_COLOR);
    doc.roundedRect(
      barX,
      y,
      barWidth * Math.min(progressVal, 1),
      barHeight,
      2,
      2,
      "F"
    );
  }

  // Percentage text
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(36, 36, 36);
  doc.text(
    `${Number(project.progress)}%`,
    barX + barWidth / 2,
    y + barHeight / 2 + 2,
    { align: "center" }
  );
  y += barHeight + 10;

  // Team
  if (project.members && project.members.length > 0) {
    y = checkPageBreak(doc, y, 25);
    y = addSectionTitle(doc, "Equipe do Projeto", y);

    const headers = ["Nome", "E-mail", "Papel"];
    const rows = project.members.map((m) => [
      m.user.name,
      m.user.email,
      ROLE_LABELS[m.role] || m.role,
    ]);

    y = addTable(doc, {
      headers,
      rows,
      y,
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 60 },
      },
    });
  }

  addFooter(doc, { tenantName });

  doc.save(
    `projeto_${project.name.replace(/\s+/g, "_").toLowerCase()}.pdf`
  );
}
