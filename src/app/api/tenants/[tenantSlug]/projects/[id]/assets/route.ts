export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission } from "@/lib/api-helpers";
import { createAssetSchema } from "@/lib/validations";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "informationAsset", "read");

    const url = new URL(request.url);
    const type = url.searchParams.get("type");
    const classification = url.searchParams.get("classification");
    const criticality = url.searchParams.get("criticality");
    const status = url.searchParams.get("status");

    const where: Record<string, unknown> = { projectId: id };
    if (type) where.type = type;
    if (classification) where.classification = classification;
    if (criticality) where.criticality = criticality;
    if (status) where.status = status;

    const assets = await ctx.db.informationAsset.findMany({
      where,
      include: {
        responsible: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(assets);
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
    requirePermission(ctx, "informationAsset", "create");

    const body = await request.json();
    const data = createAssetSchema.parse(body);

    const count = await ctx.db.informationAsset.count({ where: { projectId: id } });
    const code = `AST-${String(count + 1).padStart(3, "0")}`;

    const asset = await ctx.db.informationAsset.create({
      data: {
        tenantId: ctx.tenantId,
        projectId: id,
        code,
        name: data.name,
        description: data.description || null,
        type: data.type,
        category: data.category || null,
        owner: data.owner || null,
        custodian: data.custodian || null,
        location: data.location || null,
        classification: data.classification || "internal",
        criticality: data.criticality || "medium",
        businessValue: data.businessValue || null,
        acquisitionDate: data.acquisitionDate ? new Date(data.acquisitionDate) : null,
        endOfLifeDate: data.endOfLifeDate ? new Date(data.endOfLifeDate) : null,
        nextReviewDate: data.nextReviewDate ? new Date(data.nextReviewDate) : null,
        responsibleId: data.responsibleId || null,
        notes: data.notes || null,
      },
    });

    return successResponse(asset, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
