export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, NotFoundError } from "@/lib/api-helpers";
import { updateSoaSchema } from "@/lib/validations";
import { z } from "zod";

const createSoaEntrySchema = z.object({
  controlId: z.string().uuid(),
  applicable: z.boolean().optional(),
  justification: z.string().nullable().optional(),
  implementationStatus: z.string().nullable().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "soaEntry", "read");

    const project = await ctx.db.project.findFirst({ where: { id } });
    if (!project) throw new NotFoundError("Projeto");

    const entries = await ctx.db.soaEntry.findMany({
      where: { projectId: id },
      include: {
        control: { select: { id: true, code: true, title: true, domain: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return successResponse(entries);
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
    requirePermission(ctx, "soaEntry", "create");

    const project = await ctx.db.project.findFirst({ where: { id } });
    if (!project) throw new NotFoundError("Projeto");

    const body = await request.json();
    const data = createSoaEntrySchema.parse(body);

    const existing = await ctx.db.soaEntry.findFirst({
      where: { projectId: id, controlId: data.controlId },
    });

    if (existing) {
      const updateData = updateSoaSchema.parse(body);
      const updated = await ctx.db.soaEntry.update({
        where: { id: existing.id },
        data: updateData,
      });
      return successResponse(updated);
    }

    const entry = await ctx.db.soaEntry.create({
      data: {
        tenantId: ctx.tenantId,
        projectId: id,
        controlId: data.controlId,
        applicable: data.applicable,
        justification: data.justification,
        implementationStatus: data.implementationStatus,
      },
    });

    return successResponse(entry, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
