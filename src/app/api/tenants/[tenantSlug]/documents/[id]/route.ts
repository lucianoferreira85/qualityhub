export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, NotFoundError } from "@/lib/api-helpers";
import { updateDocumentSchema } from "@/lib/validations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "document", "read");

    const document = await ctx.db.document.findFirst({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        author: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true, email: true } },
        approver: { select: { id: true, name: true, email: true } },
        versions: {
          include: {
            changedBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!document) throw new NotFoundError("Documento");

    return successResponse(document);
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
    requirePermission(ctx, "document", "update");

    const body = await request.json();
    const data = updateDocumentSchema.parse(body);

    const document = await ctx.db.document.findFirst({ where: { id } });
    if (!document) throw new NotFoundError("Documento");

    const updated = await ctx.db.document.update({
      where: { id },
      data: {
        ...data,
        nextReviewDate: data.nextReviewDate ? new Date(data.nextReviewDate) : undefined,
        approvedAt: data.status === "approved" ? new Date() : undefined,
      },
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
    requirePermission(ctx, "document", "delete");

    const document = await ctx.db.document.findFirst({ where: { id } });
    if (!document) throw new NotFoundError("Documento");

    await ctx.db.document.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
