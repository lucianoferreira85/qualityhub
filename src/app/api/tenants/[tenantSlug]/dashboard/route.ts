export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission } from "@/lib/api-helpers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "project", "read");

    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

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
      reqMaturityAgg,
      ctrlMaturityAgg,
      compliantReqs,
      compliantCtrls,
      upcomingReviews,
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
          targetMaturity: true,
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
      // Compliance: avg maturity of requirements
      ctx.db.projectRequirement.aggregate({
        _avg: { maturity: true },
        _count: { id: true },
      }),
      // Compliance: avg maturity of controls
      ctx.db.projectControl.aggregate({
        _avg: { maturity: true },
        _count: { id: true },
      }),
      // Compliant requirements (maturity >= 3)
      ctx.db.projectRequirement.count({ where: { maturity: { gte: 3 } } }),
      // Compliant controls (maturity >= 3)
      ctx.db.projectControl.count({ where: { maturity: { gte: 3 } } }),
      // Documents with upcoming review dates
      ctx.db.document.findMany({
        where: {
          nextReviewDate: {
            gte: new Date(),
            lte: thirtyDaysFromNow,
          },
        },
        select: {
          id: true,
          code: true,
          title: true,
          nextReviewDate: true,
          type: true,
        },
        orderBy: { nextReviewDate: "asc" },
        take: 5,
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

    const projectProgress = projectsWithProgress.map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      controls: p._count.controls,
      requirements: p._count.requirements,
      risks: p._count.risks,
      ncs: p._count.nonconformities,
      total: p._count.controls + p._count.requirements,
      targetMaturity: p.targetMaturity,
    }));

    const totalReqs = reqMaturityAgg._count.id;
    const totalCtrls = ctrlMaturityAgg._count.id;
    const totalComplianceItems = totalReqs + totalCtrls;
    const totalCompliant = compliantReqs + compliantCtrls;

    const complianceOverview = {
      avgRequirementMaturity: Math.round((reqMaturityAgg._avg.maturity || 0) * 100) / 100,
      avgControlMaturity: Math.round((ctrlMaturityAgg._avg.maturity || 0) * 100) / 100,
      totalRequirements: totalReqs,
      totalControls: totalCtrls,
      compliancePercentage: totalComplianceItems > 0
        ? Math.round((totalCompliant / totalComplianceItems) * 100)
        : 0,
    };

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
      complianceOverview,
      upcomingReviews,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
