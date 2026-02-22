export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import {
  getRequestContext,
  handleApiError,
  requirePermission,
} from "@/lib/api-helpers";

function escapeCSV(value: string): string {
  const str = String(value ?? "");
  if (str.includes('"') || str.includes(";") || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCSV(headers: string[], rows: string[][]): string {
  const BOM = "\uFEFF";
  const sep = ";";
  const headerLine = headers.map(escapeCSV).join(sep);
  const dataLines = rows.map((row) => row.map(escapeCSV).join(sep));
  return BOM + [headerLine, ...dataLines].join("\n");
}

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  const parsed = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await params;
    const ctx = await getRequestContext(tenantSlug);

    const url = new URL(request.url);
    const type = url.searchParams.get("type");
    const projectId = url.searchParams.get("projectId");

    if (!type) {
      return NextResponse.json(
        { error: "Parâmetro 'type' é obrigatório" },
        { status: 400 }
      );
    }

    let csv = "";
    let filename = "";

    switch (type) {
      case "risks": {
        requirePermission(ctx, "risk", "read");
        const where: Record<string, unknown> = {};
        if (projectId) where.projectId = projectId;

        const risks = await ctx.db.risk.findMany({
          where,
          include: {
            project: { select: { name: true } },
            responsible: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
        });

        const headers = [
          "Código",
          "Título",
          "Descrição",
          "Categoria",
          "Probabilidade",
          "Impacto",
          "Nível",
          "Tratamento",
          "Responsável",
          "Projeto",
          "Criado em",
        ];
        const rows = risks.map((r) => [
          r.code,
          r.title,
          r.description || "",
          r.category || "",
          String(r.probability),
          String(r.impact),
          r.riskLevel,
          r.treatment || "",
          r.responsible?.name || "",
          r.project?.name || "",
          fmtDate(r.createdAt),
        ]);

        csv = toCSV(headers, rows);
        filename = "riscos";
        break;
      }

      case "nonconformities": {
        requirePermission(ctx, "nonconformity", "read");
        const where: Record<string, unknown> = {};
        if (projectId) where.projectId = projectId;

        const ncs = await ctx.db.nonconformity.findMany({
          where,
          include: {
            project: { select: { name: true } },
            responsible: { select: { name: true } },
            clause: { select: { code: true, title: true } },
          },
          orderBy: { createdAt: "desc" },
        });

        const headers = [
          "Código",
          "Título",
          "Descrição",
          "Severidade",
          "Origem",
          "Status",
          "Responsável",
          "Cláusula",
          "Projeto",
          "Prazo",
          "Criado em",
        ];
        const rows = ncs.map((nc) => [
          nc.code,
          nc.title,
          nc.description || "",
          nc.severity,
          nc.origin || "",
          nc.status,
          nc.responsible?.name || "",
          nc.clause ? `${nc.clause.code} - ${nc.clause.title}` : "",
          nc.project?.name || "",
          fmtDate(nc.dueDate),
          fmtDate(nc.createdAt),
        ]);

        csv = toCSV(headers, rows);
        filename = "nao-conformidades";
        break;
      }

      case "action-plans": {
        requirePermission(ctx, "actionPlan", "read");
        const where: Record<string, unknown> = {};
        if (projectId) where.projectId = projectId;

        const plans = await ctx.db.actionPlan.findMany({
          where,
          include: {
            project: { select: { name: true } },
            responsible: { select: { name: true } },
            nonconformity: { select: { code: true } },
          },
          orderBy: { createdAt: "desc" },
        });

        const headers = [
          "Código",
          "Título",
          "Descrição",
          "Tipo",
          "Status",
          "Responsável",
          "NC Vinculada",
          "Projeto",
          "Prazo",
          "Criado em",
        ];
        const rows = plans.map((ap) => [
          ap.code,
          ap.title,
          ap.description || "",
          ap.type || "",
          ap.status,
          ap.responsible?.name || "",
          ap.nonconformity?.code || "",
          ap.project?.name || "",
          fmtDate(ap.dueDate),
          fmtDate(ap.createdAt),
        ]);

        csv = toCSV(headers, rows);
        filename = "planos-de-acao";
        break;
      }

      case "controls": {
        requirePermission(ctx, "control", "read");
        if (!projectId) {
          return NextResponse.json(
            { error: "projectId é obrigatório para exportação de controles" },
            { status: 400 }
          );
        }

        const controls = await ctx.db.projectControl.findMany({
          where: { projectId },
          include: {
            control: { select: { code: true, title: true, domain: true } },
            responsible: { select: { name: true } },
          },
          orderBy: { control: { code: "asc" } },
        });

        const headers = [
          "Código",
          "Controle",
          "Domínio",
          "Status",
          "Maturidade",
          "Responsável",
          "Notas de Implementação",
        ];
        const rows = controls.map((c) => [
          c.control?.code || "",
          c.control?.title || "",
          c.control?.domain || "",
          c.status,
          String(c.maturity),
          c.responsible?.name || "",
          c.implementationNotes || "",
        ]);

        csv = toCSV(headers, rows);
        filename = "controles";
        break;
      }

      case "requirements": {
        requirePermission(ctx, "requirement", "read");
        if (!projectId) {
          return NextResponse.json(
            { error: "projectId é obrigatório para exportação de requisitos" },
            { status: 400 }
          );
        }

        const reqs = await ctx.db.projectRequirement.findMany({
          where: { projectId },
          include: {
            clause: { select: { code: true, title: true } },
            responsible: { select: { name: true } },
          },
          orderBy: { clause: { code: "asc" } },
        });

        const headers = [
          "Código",
          "Cláusula",
          "Status",
          "Maturidade",
          "Responsável",
          "Prazo",
          "Notas",
          "Evidência",
        ];
        const rows = reqs.map((r) => [
          r.clause?.code || "",
          r.clause?.title || "",
          r.status,
          String(r.maturity),
          r.responsible?.name || "",
          fmtDate(r.dueDate),
          r.notes || "",
          r.evidence || "",
        ]);

        csv = toCSV(headers, rows);
        filename = "requisitos";
        break;
      }

      case "assets": {
        requirePermission(ctx, "project", "read");
        if (!projectId) {
          return NextResponse.json(
            { error: "projectId é obrigatório para exportação de ativos" },
            { status: 400 }
          );
        }

        const assets = await ctx.db.informationAsset.findMany({
          where: { projectId },
          include: {
            responsible: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
        });

        const headers = [
          "Código",
          "Nome",
          "Tipo",
          "Classificação",
          "Proprietário",
          "Responsável",
          "Localização",
          "Criticidade",
          "Criado em",
        ];
        const rows = assets.map((a) => [
          a.code,
          a.name,
          a.type || "",
          a.classification || "",
          a.owner || "",
          a.responsible?.name || "",
          a.location || "",
          a.criticality || "",
          fmtDate(a.createdAt),
        ]);

        csv = toCSV(headers, rows);
        filename = "ativos";
        break;
      }

      case "audits": {
        requirePermission(ctx, "audit", "read");
        const where: Record<string, unknown> = {};
        if (projectId) where.projectId = projectId;

        const audits = await ctx.db.audit.findMany({
          where,
          include: {
            project: { select: { name: true } },
            leadAuditor: { select: { name: true } },
            _count: { select: { findings: true } },
          },
          orderBy: { createdAt: "desc" },
        });

        const headers = [
          "Título",
          "Tipo",
          "Status",
          "Conclusão",
          "Auditor Líder",
          "Projeto",
          "Data Início",
          "Data Fim",
          "Constatações",
        ];
        const rows = audits.map((a) => [
          a.title,
          a.type,
          a.status,
          a.conclusion || "",
          a.leadAuditor?.name || "",
          a.project?.name || "",
          fmtDate(a.startDate),
          fmtDate(a.endDate),
          String(a._count.findings),
        ]);

        csv = toCSV(headers, rows);
        filename = "auditorias";
        break;
      }

      case "documents": {
        requirePermission(ctx, "document", "read");
        const where: Record<string, unknown> = {};
        if (projectId) where.projectId = projectId;

        const docs = await ctx.db.document.findMany({
          where,
          include: {
            author: { select: { name: true } },
            reviewer: { select: { name: true } },
            approver: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
        });

        const headers = [
          "Código",
          "Título",
          "Tipo",
          "Categoria",
          "Versão",
          "Status",
          "Autor",
          "Revisor",
          "Aprovador",
          "Próxima Revisão",
          "Criado em",
        ];
        const rows = docs.map((d) => [
          d.code,
          d.title,
          d.type,
          d.category || "",
          d.version,
          d.status,
          d.author?.name || "",
          d.reviewer?.name || "",
          d.approver?.name || "",
          fmtDate(d.nextReviewDate),
          fmtDate(d.createdAt),
        ]);

        csv = toCSV(headers, rows);
        filename = "documentos";
        break;
      }

      case "indicators": {
        requirePermission(ctx, "project", "read");
        const where: Record<string, unknown> = {};
        if (projectId) where.projectId = projectId;

        const indicators = await ctx.db.indicator.findMany({
          where,
          include: {
            measurements: {
              orderBy: { period: "desc" },
              take: 1,
            },
          },
          orderBy: { createdAt: "desc" },
        });

        const headers = [
          "Nome",
          "Unidade",
          "Frequência",
          "Meta",
          "Último Valor",
          "Status",
        ];
        const rows = indicators.map((ind) => {
          const lastVal = ind.measurements[0]?.value;
          const target = Number(ind.target);
          const last = lastVal ? Number(lastVal) : null;
          const status = last === null ? "Sem medição" : last >= target ? "Atingido" : "Abaixo da meta";
          return [
            ind.name,
            ind.unit,
            ind.frequency,
            String(target),
            last !== null ? String(last) : "",
            status,
          ];
        });

        csv = toCSV(headers, rows);
        filename = "indicadores";
        break;
      }

      case "processes": {
        requirePermission(ctx, "project", "read");
        const where: Record<string, unknown> = {};
        if (projectId) where.projectId = projectId;

        const processes = await ctx.db.process.findMany({
          where,
          include: {
            responsible: { select: { name: true } },
          },
          orderBy: { code: "asc" },
        });

        const headers = ["Código", "Nome", "Responsável", "Status"];
        const rows = processes.map((p) => [
          p.code,
          p.name,
          p.responsible?.name || "",
          p.status,
        ]);

        csv = toCSV(headers, rows);
        filename = "processos";
        break;
      }

      case "suppliers": {
        requirePermission(ctx, "project", "read");
        if (!projectId) {
          return NextResponse.json(
            { error: "projectId é obrigatório para exportação de fornecedores" },
            { status: 400 }
          );
        }

        const suppliers = await ctx.db.supplier.findMany({
          where: { projectId },
          include: {
            responsible: { select: { name: true } },
            assessments: {
              orderBy: { assessmentDate: "desc" },
              take: 1,
            },
          },
          orderBy: { code: "asc" },
        });

        const headers = [
          "Código",
          "Nome",
          "Contato",
          "Email",
          "Tipo",
          "Status",
          "Nível de Risco",
          "Última Avaliação",
        ];
        const rows = suppliers.map((s) => [
          s.code,
          s.name,
          s.contactName || "",
          s.contactEmail || "",
          s.type,
          s.status,
          s.riskLevel,
          s.assessments[0] ? String(Number(s.assessments[0].overallScore)) : "",
        ]);

        csv = toCSV(headers, rows);
        filename = "fornecedores";
        break;
      }

      case "incidents": {
        requirePermission(ctx, "project", "read");
        const where: Record<string, unknown> = {};
        if (projectId) where.projectId = projectId;

        const incidents = await ctx.db.securityIncident.findMany({
          where,
          include: {
            reportedBy: { select: { name: true } },
            assignedTo: { select: { name: true } },
          },
          orderBy: { reportedAt: "desc" },
        });

        const headers = [
          "Código",
          "Título",
          "Tipo",
          "Severidade",
          "Status",
          "Reportado Por",
          "Atribuído A",
          "Reportado em",
          "Resolvido em",
        ];
        const rows = incidents.map((i) => [
          i.code,
          i.title,
          i.type,
          i.severity,
          i.status,
          i.reportedBy?.name || "",
          i.assignedTo?.name || "",
          fmtDate(i.reportedAt),
          fmtDate(i.resolvedAt),
        ]);

        csv = toCSV(headers, rows);
        filename = "incidentes";
        break;
      }

      case "changes": {
        requirePermission(ctx, "project", "read");
        const where: Record<string, unknown> = {};
        if (projectId) where.projectId = projectId;

        const changes = await ctx.db.changeRequest.findMany({
          where,
          include: {
            requestedBy: { select: { name: true } },
            assignedTo: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
        });

        const headers = [
          "Código",
          "Título",
          "Tipo",
          "Prioridade",
          "Status",
          "Solicitado Por",
          "Atribuído A",
          "Impacto",
          "Solicitado em",
        ];
        const rows = changes.map((c) => [
          c.code,
          c.title,
          c.type,
          c.priority,
          c.status,
          c.requestedBy?.name || "",
          c.assignedTo?.name || "",
          c.impactAnalysis || "",
          fmtDate(c.createdAt),
        ]);

        csv = toCSV(headers, rows);
        filename = "mudancas";
        break;
      }

      case "policies": {
        requirePermission(ctx, "project", "read");
        const where: Record<string, unknown> = {};
        if (projectId) where.projectId = projectId;

        const policies = await ctx.db.policy.findMany({
          where,
          include: {
            author: { select: { name: true } },
            _count: { select: { acknowledgments: true } },
          },
          orderBy: { code: "asc" },
        });

        const headers = [
          "Código",
          "Título",
          "Categoria",
          "Versão",
          "Status",
          "Autor",
          "Reconhecimentos",
          "Publicado em",
          "Próxima Revisão",
        ];
        const rows = policies.map((p) => [
          p.code,
          p.title,
          p.category || "",
          p.version,
          p.status,
          p.author?.name || "",
          String(p._count.acknowledgments),
          fmtDate(p.publishedAt),
          fmtDate(p.nextReviewDate),
        ]);

        csv = toCSV(headers, rows);
        filename = "politicas";
        break;
      }

      case "awareness": {
        requirePermission(ctx, "project", "read");
        const where: Record<string, unknown> = {};
        if (projectId) where.projectId = projectId;

        const campaigns = await ctx.db.awarenessCampaign.findMany({
          where,
          include: {
            _count: { select: { participants: true } },
          },
          orderBy: { startDate: "desc" },
        });

        const headers = [
          "Código",
          "Título",
          "Tipo",
          "Status",
          "Data Início",
          "Data Fim",
          "Participantes",
          "Taxa Conclusão",
        ];
        const rows = campaigns.map((c) => [
          c.code,
          c.title,
          c.type,
          c.status,
          fmtDate(c.startDate),
          fmtDate(c.endDate),
          String(c._count.participants),
          c.completionRate ? `${Number(c.completionRate)}%` : "",
        ]);

        csv = toCSV(headers, rows);
        filename = "conscientizacao";
        break;
      }

      case "dashboard-trends": {
        requirePermission(ctx, "project", "read");
        // Generate last 6 months of trend data
        const months: string[][] = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
          const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
          const monthLabel = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric" }).format(start);

          const dateFilter = { gte: start, lte: end };
          const projectFilter: Record<string, unknown> = {};
          if (projectId) projectFilter.projectId = projectId;

          const [risks, ncs, actions, incidents] = await Promise.all([
            ctx.db.risk.count({ where: { ...projectFilter, createdAt: dateFilter } }),
            ctx.db.nonconformity.count({ where: { ...projectFilter, createdAt: dateFilter } }),
            ctx.db.actionPlan.count({ where: { ...projectFilter, createdAt: dateFilter } }),
            ctx.db.securityIncident.count({ where: { ...projectFilter, createdAt: dateFilter } }),
          ]);

          months.push([monthLabel, String(risks), String(ncs), String(actions), String(incidents)]);
        }

        const headers = ["Mês", "Riscos", "NCs", "Ações", "Incidentes"];
        csv = toCSV(headers, months);
        filename = "tendencias-dashboard";
        break;
      }

      default:
        return NextResponse.json(
          { error: `Tipo de exportação '${type}' não suportado` },
          { status: 400 }
        );
    }

    const dateStr = new Date().toISOString().split("T")[0];
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}-${dateStr}.csv"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
