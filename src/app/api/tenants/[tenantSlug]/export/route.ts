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
