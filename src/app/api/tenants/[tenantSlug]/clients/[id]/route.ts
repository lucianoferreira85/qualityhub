export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, NotFoundError } from "@/lib/api-helpers";
import { updateClientSchema } from "@/lib/validations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "client", "read");

    const client = await ctx.db.consultingClient.findFirst({
      where: { id },
    });

    if (!client) throw new NotFoundError("Cliente");

    const projects = await ctx.db.project.findMany({
      where: { clientId: id },
      select: {
        id: true,
        name: true,
        status: true,
        progress: true,
        startDate: true,
        endDate: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse({ ...client, projects });
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
    requirePermission(ctx, "client", "update");

    const body = await request.json();
    const data = updateClientSchema.parse(body);

    const client = await ctx.db.consultingClient.findFirst({ where: { id } });
    if (!client) throw new NotFoundError("Cliente");

    const updated = await ctx.db.consultingClient.update({
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
    requirePermission(ctx, "client", "delete");

    const client = await ctx.db.consultingClient.findFirst({ where: { id } });
    if (!client) throw new NotFoundError("Cliente");

    await ctx.db.consultingClient.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
