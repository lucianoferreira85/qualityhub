export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission } from "@/lib/api-helpers";
import { createSgsiScopeSchema } from "@/lib/validations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "sgsiScope", "read");

    const scopes = await ctx.db.sgsiScope.findMany({
      where: { projectId: id },
      include: {
        approvedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(scopes);
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
    requirePermission(ctx, "sgsiScope", "create");

    const body = await request.json();
    const data = createSgsiScopeSchema.parse(body);

    const scope = await ctx.db.sgsiScope.create({
      data: {
        tenantId: ctx.tenantId,
        projectId: id,
        title: data.title,
        description: data.description || null,
        boundaries: data.boundaries || null,
        exclusions: data.exclusions || null,
        justification: data.justification || null,
        interfaces: data.interfaces || null,
      },
    });

    return successResponse(scope, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
