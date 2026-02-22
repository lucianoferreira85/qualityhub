export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, NotFoundError } from "@/lib/api-helpers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id: projectId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "requirement", "read");

    const project = await ctx.db.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true, targetMaturity: true },
    });
    if (!project) throw new NotFoundError("Projeto");

    const targetMaturity = project.targetMaturity ?? 3;

    const [requirements, controls] = await Promise.all([
      ctx.db.projectRequirement.findMany({
        where: { projectId },
        include: {
          clause: {
            include: {
              standard: { select: { id: true, code: true, name: true } },
            },
          },
        },
      }),
      ctx.db.projectControl.findMany({
        where: { projectId },
        include: {
          control: {
            include: {
              standard: { select: { id: true, code: true, name: true } },
            },
          },
        },
      }),
    ]);

    // Combine all items into a unified structure
    interface GapItem {
      id: string;
      code: string;
      title: string;
      type: "requirement" | "control";
      maturity: number;
      gap: number;
      standardId: string;
      standardCode: string;
      standardName: string;
      domain: string;
    }

    const allItems: GapItem[] = [];

    for (const req of requirements) {
      const gap = Math.max(0, targetMaturity - req.maturity);
      allItems.push({
        id: req.id,
        code: req.clause.code,
        title: req.clause.title,
        type: "requirement",
        maturity: req.maturity,
        gap,
        standardId: req.clause.standard.id,
        standardCode: req.clause.standard.code,
        standardName: req.clause.standard.name,
        domain: req.clause.code.split(".").slice(0, 1).join("."),
      });
    }

    for (const ctrl of controls) {
      const gap = Math.max(0, targetMaturity - ctrl.maturity);
      allItems.push({
        id: ctrl.id,
        code: ctrl.control.code,
        title: ctrl.control.title,
        type: "control",
        maturity: ctrl.maturity,
        gap,
        standardId: ctrl.control.standard.id,
        standardCode: ctrl.control.standard.code,
        standardName: ctrl.control.standard.name,
        domain: ctrl.control.domain || ctrl.control.code.split(".").slice(0, 1).join("."),
      });
    }

    // Overall metrics
    const totalItems = allItems.length;
    const averageMaturity = totalItems > 0
      ? allItems.reduce((sum, i) => sum + i.maturity, 0) / totalItems
      : 0;
    const compliantCount = allItems.filter((i) => i.maturity >= targetMaturity).length;
    const gapPercentage = totalItems > 0
      ? ((totalItems - compliantCount) / totalItems) * 100
      : 0;

    // Group by standard, then by domain
    const standardMap = new Map<string, {
      standardCode: string;
      standardName: string;
      items: GapItem[];
    }>();

    for (const item of allItems) {
      if (!standardMap.has(item.standardId)) {
        standardMap.set(item.standardId, {
          standardCode: item.standardCode,
          standardName: item.standardName,
          items: [],
        });
      }
      standardMap.get(item.standardId)!.items.push(item);
    }

    const byStandard = Array.from(standardMap.entries()).map(([standardId, data]) => {
      const domainMap = new Map<string, GapItem[]>();
      for (const item of data.items) {
        if (!domainMap.has(item.domain)) domainMap.set(item.domain, []);
        domainMap.get(item.domain)!.push(item);
      }

      const byDomain = Array.from(domainMap.entries())
        .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
        .map(([domain, items]) => ({
          domain,
          avgMaturity: items.reduce((s, i) => s + i.maturity, 0) / items.length,
          items: items.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true })),
        }));

      const avgMaturity = data.items.reduce((s, i) => s + i.maturity, 0) / data.items.length;

      return {
        standardId,
        standardCode: data.standardCode,
        standardName: data.standardName,
        avgMaturity,
        byDomain,
      };
    });

    // Maturity distribution
    const maturityLabels = ["Inexistente", "Inicial", "Repetível", "Definido", "Gerenciado", "Otimizado"];
    const maturityDistribution = [0, 1, 2, 3, 4].map((level) => ({
      level,
      label: maturityLabels[level],
      count: allItems.filter((i) => i.maturity === level).length,
    }));

    // Top gaps
    const topGaps = [...allItems]
      .filter((i) => i.gap > 0)
      .sort((a, b) => b.gap - a.gap || a.code.localeCompare(b.code, undefined, { numeric: true }))
      .slice(0, 10);

    return successResponse({
      targetMaturity,
      overall: {
        totalItems,
        averageMaturity: Math.round(averageMaturity * 100) / 100,
        compliantCount,
        gapPercentage: Math.round(gapPercentage * 100) / 100,
      },
      byStandard,
      maturityDistribution,
      topGaps,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
