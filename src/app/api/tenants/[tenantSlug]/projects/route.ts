export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, PlanLimitError } from "@/lib/api-helpers";
import { createProjectSchema } from "@/lib/validations";
import { checkPlanLimit } from "@/lib/plan-limits";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "project", "read");

    const projects = await ctx.db.project.findMany({
      include: {
        client: { select: { id: true, name: true } },
        standards: { include: { standard: { select: { id: true, code: true, name: true } } } },
        _count: { select: { members: true, risks: true, nonconformities: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(projects);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "project", "create");

    const body = await request.json();
    const data = createProjectSchema.parse(body);

    const limit = await checkPlanLimit(ctx.tenantId, "projects");
    if (!limit.allowed) {
      throw new PlanLimitError("projects", limit.current, limit.limit);
    }

    const project = await ctx.db.project.create({
      data: {
        tenantId: ctx.tenantId,
        name: data.name,
        description: data.description,
        clientId: data.clientId,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        members: {
          create: {
            userId: ctx.userId,
            role: "owner",
          },
        },
        ...(data.standardIds?.length && {
          standards: {
            create: data.standardIds.map((standardId) => ({
              standardId,
            })),
          },
        }),
      },
    });

    // Auto-import all clauses as ProjectRequirements and all controls as ProjectControls
    if (data.standardIds?.length) {
      const [allClauses, allControls] = await Promise.all([
        prisma.standardClause.findMany({
          where: { standardId: { in: data.standardIds } },
          select: { id: true },
        }),
        prisma.standardControl.findMany({
          where: { standardId: { in: data.standardIds } },
          select: { id: true },
        }),
      ]);

      await Promise.all([
        allClauses.length > 0
          ? prisma.projectRequirement.createMany({
              data: allClauses.map((clause) => ({
                tenantId: ctx.tenantId,
                projectId: project.id,
                clauseId: clause.id,
              })),
              skipDuplicates: true,
            })
          : Promise.resolve(),
        allControls.length > 0
          ? prisma.projectControl.createMany({
              data: allControls.map((control) => ({
                tenantId: ctx.tenantId,
                projectId: project.id,
                controlId: control.id,
              })),
              skipDuplicates: true,
            })
          : Promise.resolve(),
      ]);
    }

    return successResponse(project, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
