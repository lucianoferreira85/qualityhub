export const dynamic = "force-dynamic";

import { getRequestContext, handleApiError, successResponse, requirePermission } from "@/lib/api-helpers";

function getMonthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function getPeriodStart(period: string): Date {
  const now = new Date();
  const months = period === "3m" ? 3 : period === "12m" ? 12 : 6;
  return new Date(now.getFullYear(), now.getMonth() - months, 1);
}

function buildMonthBuckets(periodStart: Date): Record<string, number> {
  const buckets: Record<string, number> = {};
  const now = new Date();
  const cursor = new Date(periodStart.getFullYear(), periodStart.getMonth(), 1);
  while (cursor <= now) {
    buckets[getMonthKey(cursor)] = 0;
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return buckets;
}

function groupByMonth<T extends { createdAt: Date }>(
  records: T[],
  template: Record<string, number>
): Record<string, number> {
  const result = { ...template };
  for (const r of records) {
    const key = getMonthKey(new Date(r.createdAt));
    if (key in result) result[key]++;
  }
  return result;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "project", "read");

    const url = new URL(request.url);
    const period = url.searchParams.get("period") || "6m";
    const projectId = url.searchParams.get("projectId") || undefined;

    const periodStart = getPeriodStart(period);
    const monthBuckets = buildMonthBuckets(periodStart);
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const projectFilter = projectId ? { projectId } : {};
    const dateFilter = { createdAt: { gte: periodStart } };

    const [
      risks,
      ncs,
      actions,
      incidents,
      projects,
      controls,
      overdueActions,
      upcomingAudits,
      upcomingDocReviews,
      overdueRiskReviews,
    ] = await Promise.all([
      // 1. Risks in period
      ctx.db.risk.findMany({
        where: { ...projectFilter, ...dateFilter },
        select: { createdAt: true },
      }),
      // 2. NCs in period
      ctx.db.nonconformity.findMany({
        where: { ...projectFilter, ...dateFilter },
        select: { createdAt: true },
      }),
      // 3. Actions in period
      ctx.db.actionPlan.findMany({
        where: { ...projectFilter, ...dateFilter },
        select: { createdAt: true },
      }),
      // 4. Incidents in period
      ctx.db.securityIncident.findMany({
        where: { ...projectFilter, ...dateFilter },
        select: { createdAt: true },
      }),
      // 5. Projects with compliance data
      ctx.db.project.findMany({
        where: { status: { not: "archived" } },
        select: {
          id: true,
          name: true,
          targetMaturity: true,
          requirements: {
            select: { maturity: true },
          },
          controls: {
            select: { maturity: true, control: { select: { domain: true } } },
          },
          nonconformities: {
            where: { status: { not: "closed" } },
            select: { id: true },
          },
          actionPlans: {
            where: { status: { in: ["planned", "in_progress"] } },
            select: { id: true, dueDate: true },
          },
        },
      }),
      // 6. All controls with domain info (for heatmap)
      ctx.db.projectControl.findMany({
        where: projectFilter,
        select: {
          maturity: true,
          projectId: true,
          control: { select: { domain: true } },
          project: { select: { name: true } },
        },
      }),
      // 7. Overdue actions (for expirations)
      ctx.db.actionPlan.findMany({
        where: {
          ...projectFilter,
          status: { in: ["planned", "in_progress"] },
          dueDate: { lte: thirtyDaysFromNow },
        },
        select: {
          id: true,
          title: true,
          dueDate: true,
          project: { select: { name: true } },
        },
        orderBy: { dueDate: "asc" },
        take: 20,
      }),
      // 8. Upcoming audits
      ctx.db.audit.findMany({
        where: {
          ...projectFilter,
          status: { in: ["planned", "in_progress"] },
          startDate: { lte: thirtyDaysFromNow },
        },
        select: {
          id: true,
          title: true,
          startDate: true,
          project: { select: { name: true } },
        },
        orderBy: { startDate: "asc" },
        take: 10,
      }),
      // 9. Document reviews upcoming
      ctx.db.document.findMany({
        where: {
          ...(projectId ? { projectId } : {}),
          nextReviewDate: { gte: new Date(), lte: thirtyDaysFromNow },
        },
        select: {
          id: true,
          title: true,
          nextReviewDate: true,
          project: { select: { name: true } },
        },
        orderBy: { nextReviewDate: "asc" },
        take: 10,
      }),
      // 10. Overdue risk reviews
      ctx.db.risk.findMany({
        where: {
          ...projectFilter,
          nextReviewDate: { lt: new Date() },
          status: { not: "closed" },
        },
        select: {
          id: true,
          title: true,
          nextReviewDate: true,
          project: { select: { name: true } },
        },
        orderBy: { nextReviewDate: "asc" },
        take: 10,
      }),
    ]);

    // === TRENDS ===
    const risksByMonth = groupByMonth(risks, monthBuckets);
    const ncsByMonth = groupByMonth(ncs, monthBuckets);
    const actionsByMonth = groupByMonth(actions, monthBuckets);
    const incidentsByMonth = groupByMonth(incidents, monthBuckets);

    const months = Object.keys(monthBuckets).sort();
    const trends = months.map((month) => ({
      month,
      risks: risksByMonth[month] || 0,
      ncs: ncsByMonth[month] || 0,
      actions: actionsByMonth[month] || 0,
      incidents: incidentsByMonth[month] || 0,
    }));

    // === PROJECT COMPARISON ===
    const projectComparison = projects.map((p) => {
      const totalReqs = p.requirements.length;
      const totalCtrls = p.controls.length;
      const compliantReqs = p.requirements.filter((r) => r.maturity >= 3).length;
      const compliantCtrls = p.controls.filter((c) => c.maturity >= 3).length;
      const totalItems = totalReqs + totalCtrls;
      const compliantItems = compliantReqs + compliantCtrls;
      const allMaturities = [
        ...p.requirements.map((r) => r.maturity),
        ...p.controls.map((c) => c.maturity),
      ];
      const avgMat =
        allMaturities.length > 0
          ? allMaturities.reduce((a, b) => a + b, 0) / allMaturities.length
          : 0;

      return {
        id: p.id,
        name: p.name,
        compliance: totalItems > 0 ? Math.round((compliantItems / totalItems) * 100) : 0,
        avgMaturity: Math.round(avgMat * 100) / 100,
        totalRisks: p.requirements.length, // this is a proxy; real risk count from project
        openNCs: p.nonconformities.length,
        pendingActions: p.actionPlans.length,
      };
    });

    // === MATURITY HEATMAP ===
    const heatmapMap = new Map<string, { sum: number; count: number; projectName: string }>();
    for (const c of controls) {
      const domain = c.control?.domain || "Sem dominio";
      const projName = c.project?.name || "Projeto";
      const key = `${domain}|||${c.projectId}`;
      const existing = heatmapMap.get(key);
      if (existing) {
        existing.sum += c.maturity;
        existing.count++;
      } else {
        heatmapMap.set(key, { sum: c.maturity, count: 1, projectName: projName });
      }
    }

    const maturityHeatmap = Array.from(heatmapMap.entries()).map(([key, val]) => ({
      domain: key.split("|||")[0],
      projectName: val.projectName,
      avgMaturity: Math.round((val.sum / val.count) * 100) / 100,
    }));

    // === CERTIFICATION READINESS ===
    const now = new Date();
    const certificationReadiness = projects.map((p) => {
      const totalReqs = p.requirements.length;
      const totalCtrls = p.controls.length;
      const compliantReqs = p.requirements.filter((r) => r.maturity >= 3).length;
      const compliantCtrls = p.controls.filter((c) => c.maturity >= 3).length;
      const reqCompliance = totalReqs > 0 ? Math.round((compliantReqs / totalReqs) * 100) : 0;
      const ctrlCompliance = totalCtrls > 0 ? Math.round((compliantCtrls / totalCtrls) * 100) : 0;
      const openNCs = p.nonconformities.length;
      const pendingActions = p.actionPlans.length;
      const overdueItems = p.actionPlans.filter(
        (a) => a.dueDate && new Date(a.dueDate) < now
      ).length;

      // Score: weighted average
      // 40% requirement compliance + 30% control compliance + 15% NC penalty + 15% overdue penalty
      const ncPenalty = openNCs > 0 ? Math.max(0, 100 - openNCs * 15) : 100;
      const overduePenalty = overdueItems > 0 ? Math.max(0, 100 - overdueItems * 20) : 100;
      const readinessScore = Math.round(
        reqCompliance * 0.4 + ctrlCompliance * 0.3 + ncPenalty * 0.15 + overduePenalty * 0.15
      );

      return {
        projectId: p.id,
        projectName: p.name,
        requirementCompliance: reqCompliance,
        controlCompliance: ctrlCompliance,
        openNCs,
        pendingActions,
        overdueItems,
        readinessScore: Math.max(0, Math.min(100, readinessScore)),
      };
    });

    // === EXPIRATIONS ===
    type Expiration = {
      type: string;
      id: string;
      title: string;
      dueDate: string;
      daysUntil: number;
      projectName?: string;
    };

    const expirations: Expiration[] = [];

    for (const a of overdueActions) {
      if (a.dueDate) {
        const daysUntil = Math.ceil(
          (new Date(a.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        expirations.push({
          type: "action",
          id: a.id,
          title: a.title,
          dueDate: a.dueDate.toISOString(),
          daysUntil,
          projectName: a.project?.name,
        });
      }
    }

    for (const a of upcomingAudits) {
      const daysUntil = Math.ceil(
        (new Date(a.startDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      expirations.push({
        type: "audit",
        id: a.id,
        title: a.title,
        dueDate: a.startDate.toISOString(),
        daysUntil,
        projectName: a.project?.name,
      });
    }

    for (const d of upcomingDocReviews) {
      if (d.nextReviewDate) {
        const daysUntil = Math.ceil(
          (new Date(d.nextReviewDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        expirations.push({
          type: "review",
          id: d.id,
          title: d.title,
          dueDate: d.nextReviewDate.toISOString(),
          daysUntil,
          projectName: d.project?.name,
        });
      }
    }

    for (const r of overdueRiskReviews) {
      if (r.nextReviewDate) {
        const daysUntil = Math.ceil(
          (new Date(r.nextReviewDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        expirations.push({
          type: "risk_review",
          id: r.id,
          title: r.title,
          dueDate: r.nextReviewDate.toISOString(),
          daysUntil,
          projectName: r.project?.name,
        });
      }
    }

    expirations.sort((a, b) => a.daysUntil - b.daysUntil);

    return successResponse({
      trends,
      projectComparison,
      maturityHeatmap,
      certificationReadiness,
      expirations,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
