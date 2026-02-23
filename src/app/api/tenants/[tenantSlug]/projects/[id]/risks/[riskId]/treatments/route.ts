export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, NotFoundError, ValidationError } from "@/lib/api-helpers";
import { z } from "zod";

const createTreatmentSchema = z.object({
  description: z.string().min(1, "Descricao obrigatoria"),
  controlId: z.string().uuid().nullable().optional(),
  status: z.enum(["planned", "in_progress", "completed", "cancelled"]).optional(),
});

const updateTreatmentSchema = z.object({
  description: z.string().min(1).optional(),
  status: z.enum(["planned", "in_progress", "completed", "cancelled"]).optional(),
});

// GET - List treatments for a risk
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string; riskId: string }> }
) {
  try {
    const { tenantSlug, id: projectId, riskId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "risk", "read");

    const risk = await ctx.db.risk.findFirst({
      where: { id: riskId, projectId },
    });
    if (!risk) throw new NotFoundError("Risco");

    const treatments = await ctx.db.riskTreatment.findMany({
      where: { riskId },
      include: {
        control: { select: { id: true, code: true, title: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return successResponse(treatments);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST - Create a treatment for a risk
export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string; riskId: string }> }
) {
  try {
    const { tenantSlug, id: projectId, riskId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "risk", "update");

    const risk = await ctx.db.risk.findFirst({
      where: { id: riskId, projectId },
    });
    if (!risk) throw new NotFoundError("Risco");

    const body = await request.json();
    const data = createTreatmentSchema.parse(body);

    const treatment = await ctx.db.riskTreatment.create({
      data: {
        tenantId: ctx.tenantId,
        riskId,
        description: data.description,
        controlId: data.controlId || null,
        status: data.status || "planned",
      },
    });

    return successResponse(treatment, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH - Update a treatment
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string; riskId: string }> }
) {
  try {
    const { tenantSlug, id: projectId, riskId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "risk", "update");

    const risk = await ctx.db.risk.findFirst({
      where: { id: riskId, projectId },
    });
    if (!risk) throw new NotFoundError("Risco");

    const url = new URL(request.url);
    const treatmentId = url.searchParams.get("id");

    if (!treatmentId) {
      throw new ValidationError({ id: ["id do tratamento é obrigatório"] });
    }

    const body = await request.json();
    const data = updateTreatmentSchema.parse(body);

    const existing = await ctx.db.riskTreatment.findFirst({
      where: { id: treatmentId, riskId },
    });
    if (!existing) throw new NotFoundError("Tratamento");

    const updated = await ctx.db.riskTreatment.update({
      where: { id: treatmentId },
      data: {
        ...(data.description && { description: data.description }),
        ...(data.status && { status: data.status }),
      },
    });

    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE - Remove a treatment
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string; riskId: string }> }
) {
  try {
    const { tenantSlug, id: projectId, riskId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "risk", "update");

    const risk = await ctx.db.risk.findFirst({
      where: { id: riskId, projectId },
    });
    if (!risk) throw new NotFoundError("Risco");

    const url = new URL(request.url);
    const treatmentId = url.searchParams.get("id");

    if (!treatmentId) {
      throw new ValidationError({ id: ["id do tratamento é obrigatório"] });
    }

    const existing = await ctx.db.riskTreatment.findFirst({
      where: { id: treatmentId, riskId },
    });
    if (!existing) throw new NotFoundError("Tratamento");

    await ctx.db.riskTreatment.delete({
      where: { id: treatmentId },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
