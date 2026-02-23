export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, NotFoundError, PlanLimitError, ValidationError } from "@/lib/api-helpers";
import { checkPlanLimit } from "@/lib/plan-limits";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const addStandardSchema = z.object({
  standardId: z.string().uuid(),
});

// POST - Add a standard to a project (with auto-import of clauses and controls)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id: projectId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "project", "update");

    const project = await ctx.db.project.findFirst({ where: { id: projectId } });
    if (!project) throw new NotFoundError("Projeto");

    const body = await request.json();
    const data = addStandardSchema.parse(body);

    // Check plan limit for standards
    const limitCheck = await checkPlanLimit(ctx.tenantId, "standards");
    if (!limitCheck.allowed) {
      throw new PlanLimitError("standards", limitCheck.current, limitCheck.limit);
    }

    // Link standard to project
    await prisma.projectStandard.create({
      data: {
        projectId,
        standardId: data.standardId,
      },
    });

    // Auto-import clauses and controls from this standard
    const [allClauses, allControls] = await Promise.all([
      prisma.standardClause.findMany({
        where: { standardId: data.standardId },
        select: { id: true },
      }),
      prisma.standardControl.findMany({
        where: { standardId: data.standardId },
        select: { id: true },
      }),
    ]);

    await Promise.all([
      allClauses.length > 0
        ? prisma.projectRequirement.createMany({
            data: allClauses.map((clause) => ({
              tenantId: ctx.tenantId,
              projectId,
              clauseId: clause.id,
            })),
            skipDuplicates: true,
          })
        : Promise.resolve(),
      allControls.length > 0
        ? prisma.projectControl.createMany({
            data: allControls.map((control) => ({
              tenantId: ctx.tenantId,
              projectId,
              controlId: control.id,
            })),
            skipDuplicates: true,
          })
        : Promise.resolve(),
    ]);

    return successResponse({
      added: true,
      imported: {
        clauses: allClauses.length,
        controls: allControls.length,
      },
    }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE - Remove a standard from a project (removes associated requirements and controls)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id: projectId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "project", "update");

    const project = await ctx.db.project.findFirst({ where: { id: projectId } });
    if (!project) throw new NotFoundError("Projeto");

    const url = new URL(request.url);
    const standardId = url.searchParams.get("id");

    if (!standardId) {
      throw new ValidationError({ id: ["id da norma é obrigatório"] });
    }

    // Get clause and control IDs from this standard
    const [clauseIds, controlIds] = await Promise.all([
      prisma.standardClause.findMany({
        where: { standardId },
        select: { id: true },
      }),
      prisma.standardControl.findMany({
        where: { standardId },
        select: { id: true },
      }),
    ]);

    // Remove requirements and controls linked to this standard, then unlink the standard
    await Promise.all([
      clauseIds.length > 0
        ? prisma.projectRequirement.deleteMany({
            where: {
              projectId,
              clauseId: { in: clauseIds.map((c) => c.id) },
            },
          })
        : Promise.resolve(),
      controlIds.length > 0
        ? prisma.projectControl.deleteMany({
            where: {
              projectId,
              controlId: { in: controlIds.map((c) => c.id) },
            },
          })
        : Promise.resolve(),
    ]);

    await prisma.projectStandard.deleteMany({
      where: {
        projectId,
        standardId,
      },
    });

    return successResponse({ removed: true });
  } catch (error) {
    return handleApiError(error);
  }
}
