export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse } from "@/lib/api-helpers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await params;
    const ctx = await getRequestContext(tenantSlug);

    const [
      totalProjects,
      totalAudits,
      openNonconformities,
      pendingActions,
      totalDocuments,
      risksByLevel,
      effectiveActions,
      totalVerifiedActions,
      ncsByStatus,
      projectsWithProgress,
      recentNcs,
      recentActions,
      upcomingAudits,
      overdueActions,
    ] = await Promise.all([
      ctx.db.project.count({ where: { status: { not: "archived" } } }),
      ctx.db.audit.count(),
      ctx.db.nonconformity.count({ where: { status: { not: "closed" } } }),
      ctx.db.actionPlan.count({ where: { status: { in: ["planned", "in_progress"] } } }),
      ctx.db.document.count(),
      ctx.db.risk.groupBy({
        by: ["riskLevel"],
        _count: { id: true },
      }),
      ctx.db.actionPlan.count({ where: { status: "effective" } }),
      ctx.db.actionPlan.count({ where: { status: { in: ["effective", "ineffective", "verified"] } } }),
      ctx.db.nonconformity.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      ctx.db.project.findMany({
        where: { status: { not: "archived" } },
        select: {
          id: true,
          name: true,
          status: true,
          _count: {
            select: {
              controls: true,
              requirements: true,
              risks: true,
              nonconformities: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
      ctx.db.nonconformity.findMany({
        select: {
          id: true,
          code: true,
          title: true,
          severity: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      ctx.db.actionPlan.findMany({
        where: { status: { in: ["planned", "in_progress"] } },
        select: {
          id: true,
          title: true,
          status: true,
          dueDate: true,
          responsible: { select: { id: true, name: true } },
        },
        orderBy: { dueDate: "asc" },
        take: 5,
      }),
      ctx.db.audit.findMany({
        where: {
          status: { in: ["planned", "in_progress"] },
          startDate: { gte: new Date() },
        },
        select: {
          id: true,
          title: true,
          type: true,
          startDate: true,
          endDate: true,
        },
        orderBy: { startDate: "asc" },
        take: 3,
      }),
      ctx.db.actionPlan.count({
        where: {
          status: { in: ["planned", "in_progress"] },
          dueDate: { lt: new Date() },
        },
      }),
    ]);

    const riskDistribution = risksByLevel.map((r) => ({
      level: r.riskLevel,
      count: r._count.id,
    }));

    const ncByStatus = ncsByStatus.map((n) => ({
      status: n.status,
      count: n._count.id,
    }));

    const projectProgress = projectsWithProgress.map((p) => {
      const total = p._count.controls + p._count.requirements;
      return {
        id: p.id,
        name: p.name,
        status: p.status,
        controls: p._count.controls,
        requirements: p._count.requirements,
        risks: p._count.risks,
        ncs: p._count.nonconformities,
        total,
      };
    });

    const actionEffectiveness =
      totalVerifiedActions > 0
        ? (effectiveActions / totalVerifiedActions) * 100
        : 0;

    return successResponse({
      totalProjects,
      totalAudits,
      openNonconformities,
      pendingActions,
      totalDocuments,
      riskDistribution,
      ncByStatus,
      actionEffectiveness,
      projectProgress,
      recentNcs,
      recentActions,
      upcomingAudits,
      overdueActions,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
