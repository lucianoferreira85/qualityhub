export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, NotFoundError, ValidationError } from "@/lib/api-helpers";
import { z } from "zod";

const createProjectControlSchema = z.object({
  controlId: z.string().uuid(),
  status: z.enum(["not_started", "in_progress", "implemented", "verified", "nonconforming"]).optional(),
  maturity: z.number().int().min(0).max(4).optional(),
  responsibleId: z.string().uuid().nullable().optional(),
  implementationNotes: z.string().nullable().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "control", "read");

    const project = await ctx.db.project.findFirst({ where: { id } });
    if (!project) throw new NotFoundError("Projeto");

    const controls = await ctx.db.projectControl.findMany({
      where: { projectId: id },
      include: {
        control: { select: { id: true, code: true, title: true, domain: true } },
        responsible: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return successResponse(controls);
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
    requirePermission(ctx, "control", "create");

    const project = await ctx.db.project.findFirst({ where: { id } });
    if (!project) throw new NotFoundError("Projeto");

    const body = await request.json();
    const data = createProjectControlSchema.parse(body);

    const control = await ctx.db.projectControl.create({
      data: {
        tenantId: ctx.tenantId,
        projectId: id,
        controlId: data.controlId,
        status: data.status,
        maturity: data.maturity,
        responsibleId: data.responsibleId,
        implementationNotes: data.implementationNotes,
      },
    });

    return successResponse(control, 201);
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
    requirePermission(ctx, "control", "delete");

    const project = await ctx.db.project.findFirst({ where: { id } });
    if (!project) throw new NotFoundError("Projeto");

    const url = new URL(request.url);
    const controlId = url.searchParams.get("id");

    if (!controlId) {
      throw new ValidationError({ id: ["id do controle é obrigatório"] });
    }

    const existing = await ctx.db.projectControl.findFirst({
      where: { id: controlId, projectId: id },
    });
    if (!existing) throw new NotFoundError("Controle");

    await ctx.db.projectControl.delete({ where: { id: controlId } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
