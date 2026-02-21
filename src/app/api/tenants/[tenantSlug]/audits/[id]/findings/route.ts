export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, NotFoundError } from "@/lib/api-helpers";
import { createFindingSchema } from "@/lib/validations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "auditFinding", "read");

    const audit = await ctx.db.audit.findFirst({ where: { id } });
    if (!audit) throw new NotFoundError("Auditoria");

    const findings = await ctx.db.auditFinding.findMany({
      where: { auditId: id },
      include: {
        clause: { select: { id: true, code: true, title: true } },
        nonconformity: { select: { id: true, code: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(findings);
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
    requirePermission(ctx, "auditFinding", "create");

    const audit = await ctx.db.audit.findFirst({ where: { id } });
    if (!audit) throw new NotFoundError("Auditoria");

    const body = await request.json();
    const data = createFindingSchema.parse(body);

    const finding = await ctx.db.auditFinding.create({
      data: {
        tenantId: ctx.tenantId,
        auditId: id,
        clauseId: data.clauseId,
        classification: data.classification,
        description: data.description,
        evidence: data.evidence,
        nonconformityId: data.nonconformityId,
      },
    });

    return successResponse(finding, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
