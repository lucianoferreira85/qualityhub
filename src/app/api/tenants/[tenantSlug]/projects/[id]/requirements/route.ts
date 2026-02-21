export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, NotFoundError } from "@/lib/api-helpers";
import { z } from "zod";

const createRequirementSchema = z.object({
  clauseId: z.string().uuid(),
  status: z.enum(["not_started", "in_progress", "implemented", "verified", "nonconforming"]).optional(),
  maturity: z.number().int().min(0).max(4).optional(),
  responsibleId: z.string().uuid().nullable().optional(),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val))).nullable().optional(),
  notes: z.string().nullable().optional(),
  evidence: z.string().nullable().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "requirement", "read");

    const project = await ctx.db.project.findFirst({ where: { id } });
    if (!project) throw new NotFoundError("Projeto");

    const requirements = await ctx.db.projectRequirement.findMany({
      where: { projectId: id },
      include: {
        clause: { select: { id: true, code: true, title: true, description: true } },
        responsible: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return successResponse(requirements);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "requirement", "create");

    const project = await ctx.db.project.findFirst({ where: { id } });
    if (!project) throw new NotFoundError("Projeto");

    const body = await request.json();
    const data = createRequirementSchema.parse(body);

    const requirement = await ctx.db.projectRequirement.create({
      data: {
        tenantId: ctx.tenantId,
        projectId: id,
        clauseId: data.clauseId,
        status: data.status,
        maturity: data.maturity,
        responsibleId: data.responsibleId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        notes: data.notes,
        evidence: data.evidence,
      },
    });

    return successResponse(requirement, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "requirement", "delete");

    const project = await ctx.db.project.findFirst({ where: { id } });
    if (!project) throw new NotFoundError("Projeto");

    const body = await request.json();
    const { requirementId } = body;

    if (!requirementId) {
      return new Response(JSON.stringify({ error: "requirementId é obrigatório" }), { status: 400 });
    }

    const existing = await ctx.db.projectRequirement.findFirst({
      where: { id: requirementId, projectId: id },
    });
    if (!existing) throw new NotFoundError("Requisito");

    await ctx.db.projectRequirement.delete({ where: { id: requirementId } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
