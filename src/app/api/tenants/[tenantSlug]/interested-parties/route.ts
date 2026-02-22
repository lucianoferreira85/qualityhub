export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission } from "@/lib/api-helpers";
import { createInterestedPartySchema } from "@/lib/validations";
import { logActivity, getClientIp } from "@/lib/audit-log";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "interestedParty", "read");

    const url = new URL(request.url);
    const type = url.searchParams.get("type");
    const projectId = url.searchParams.get("projectId");
    const status = url.searchParams.get("status");
    const category = url.searchParams.get("category");

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (category) where.category = category;

    const parties = await ctx.db.interestedParty.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return successResponse(parties);
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
    requirePermission(ctx, "interestedParty", "create");

    const body = await request.json();
    const data = createInterestedPartySchema.parse(body);

    const party = await ctx.db.interestedParty.create({
      data: {
        ...data,
        tenantId: ctx.tenantId,
      },
    });

    void logActivity({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "create",
      entityType: "interestedParty",
      entityId: party.id,
      metadata: { name: data.name, type: data.type },
      ipAddress: getClientIp(request),
    });

    return successResponse(party, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
