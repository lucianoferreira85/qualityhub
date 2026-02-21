export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, NotFoundError } from "@/lib/api-helpers";
import { updateProcessSchema } from "@/lib/validations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "process", "read");

    const process = await ctx.db.process.findFirst({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        responsible: { select: { id: true, name: true, email: true } },
        indicators: {
          select: { id: true, name: true, unit: true, frequency: true, target: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!process) throw new NotFoundError("Processo");

    return successResponse(process);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "process", "update");

    const body = await request.json();
    const data = updateProcessSchema.parse(body);

    const process = await ctx.db.process.findFirst({ where: { id } });
    if (!process) throw new NotFoundError("Processo");

    const updated = await ctx.db.process.update({
      where: { id },
      data,
    });

    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "process", "delete");

    const process = await ctx.db.process.findFirst({ where: { id } });
    if (!process) throw new NotFoundError("Processo");

    await ctx.db.process.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
