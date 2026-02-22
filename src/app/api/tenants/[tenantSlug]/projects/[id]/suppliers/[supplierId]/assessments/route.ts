export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, NotFoundError } from "@/lib/api-helpers";
import { createSupplierAssessmentSchema } from "@/lib/validations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string; supplierId: string }> }
) {
  try {
    const { tenantSlug, supplierId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "supplier", "read");

    const assessments = await ctx.db.supplierAssessment.findMany({
      where: { supplierId },
      include: {
        assessor: { select: { id: true, name: true } },
      },
      orderBy: { assessmentDate: "desc" },
    });

    return successResponse(assessments);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string; supplierId: string }> }
) {
  try {
    const { tenantSlug, id: projectId, supplierId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "supplier", "create");

    const supplier = await ctx.db.supplier.findFirst({
      where: { id: supplierId, projectId },
    });
    if (!supplier) throw new NotFoundError("Fornecedor");

    const body = await request.json();
    const data = createSupplierAssessmentSchema.parse(body);

    const assessment = await ctx.db.supplierAssessment.create({
      data: {
        tenantId: ctx.tenantId,
        supplierId,
        assessmentDate: new Date(data.assessmentDate),
        assessorId: ctx.userId,
        overallScore: data.overallScore ?? null,
        securityScore: data.securityScore ?? null,
        complianceScore: data.complianceScore ?? null,
        serviceScore: data.serviceScore ?? null,
        findings: data.findings || null,
        recommendations: data.recommendations || null,
        status: data.status || "completed",
        nextAssessmentDate: data.nextAssessmentDate ? new Date(data.nextAssessmentDate) : null,
        notes: data.notes || null,
      },
    });

    // Update supplier's last assessment date
    await ctx.db.supplier.update({
      where: { id: supplierId },
      data: { lastAssessmentDate: new Date(data.assessmentDate) },
    });

    return successResponse(assessment, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
