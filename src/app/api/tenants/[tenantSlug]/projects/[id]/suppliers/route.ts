export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission } from "@/lib/api-helpers";
import { createSupplierSchema } from "@/lib/validations";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "supplier", "read");

    const url = new URL(request.url);
    const type = url.searchParams.get("type");
    const riskLevel = url.searchParams.get("riskLevel");
    const status = url.searchParams.get("status");

    const where: Record<string, unknown> = { projectId: id };
    if (type) where.type = type;
    if (riskLevel) where.riskLevel = riskLevel;
    if (status) where.status = status;

    const suppliers = await ctx.db.supplier.findMany({
      where,
      include: {
        responsible: { select: { id: true, name: true } },
        _count: { select: { assessments: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(suppliers);
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
    requirePermission(ctx, "supplier", "create");

    const body = await request.json();
    const data = createSupplierSchema.parse(body);

    const count = await ctx.db.supplier.count({ where: { projectId: id } });
    const code = `SUP-${String(count + 1).padStart(3, "0")}`;

    const supplier = await ctx.db.supplier.create({
      data: {
        tenantId: ctx.tenantId,
        projectId: id,
        code,
        name: data.name,
        cnpj: data.cnpj || null,
        contactName: data.contactName || null,
        contactEmail: data.contactEmail || null,
        contactPhone: data.contactPhone || null,
        type: data.type,
        category: data.category || null,
        servicesProvided: data.servicesProvided || null,
        dataAccess: data.dataAccess || null,
        contractStartDate: data.contractStartDate ? new Date(data.contractStartDate) : null,
        contractEndDate: data.contractEndDate ? new Date(data.contractEndDate) : null,
        slaDetails: data.slaDetails || null,
        securityRequirements: data.securityRequirements || null,
        riskLevel: data.riskLevel || "medium",
        responsibleId: data.responsibleId || null,
        nextAssessmentDate: data.nextAssessmentDate ? new Date(data.nextAssessmentDate) : null,
        notes: data.notes || null,
      },
    });

    return successResponse(supplier, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
