export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, NotFoundError } from "@/lib/api-helpers";
import { updateDocumentSchema } from "@/lib/validations";
import { logActivity, getClientIp } from "@/lib/audit-log";
import { triggerDocumentReview } from "@/lib/email-triggers";
import { deleteFile } from "@/lib/storage";

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
    const { changeNotes, ...data } = updateDocumentSchema.parse(body);

    const document = await ctx.db.document.findFirst({ where: { id } });
    if (!document) throw new NotFoundError("Documento");

    // Detect meaningful changes that warrant a version snapshot
    const contentChanged = data.content !== undefined && data.content !== document.content;
    const versionChanged = data.version !== undefined && data.version !== document.version;
    const statusChanged = data.status !== undefined && data.status !== document.status;
    const shouldVersion = contentChanged || versionChanged || statusChanged;

    // Auto-version: snapshot the PREVIOUS state before applying changes
    if (shouldVersion) {
      await ctx.db.documentVersion.create({
        data: {
          documentId: id,
          version: document.version,
          content: document.content,
          fileUrl: document.fileUrl,
          changedById: ctx.userId,
          changeNotes: changeNotes || null,
        },
      });
    }

    // Auto-set approverId when approving
    const updateData: Record<string, unknown> = { ...data };
    if (data.nextReviewDate) {
      updateData.nextReviewDate = new Date(data.nextReviewDate);
    }
    if (data.status === "approved") {
      updateData.approvedAt = new Date();
      if (!data.approverId) {
        updateData.approverId = ctx.userId;
      }
    }

    const updated = await ctx.db.document.update({
      where: { id },
      data: updateData,
    });

    const logAction = statusChanged ? "status_change" : "update";
    void logActivity({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: logAction,
      entityType: "document",
      entityId: id,
      metadata: { changes: data, previousStatus: document.status },
      ipAddress: getClientIp(request),
    });

    if (data.status === "in_review" && document.reviewerId) {
      triggerDocumentReview({
        tenantId: ctx.tenantId,
        tenantSlug,
        reviewerId: document.reviewerId,
        docId: id,
        docCode: document.code,
        docTitle: document.title,
      });
    }

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

    const versions = await ctx.db.documentVersion.findMany({
      where: { documentId: id },
      select: { fileUrl: true },
    });

    await ctx.db.document.delete({ where: { id } });

    void logActivity({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "delete",
      entityType: "document",
      entityId: id,
      metadata: { code: document.code, title: document.title },
      ipAddress: getClientIp(_request),
    });

    // Cleanup storage files (fire-and-forget)
    void (async () => {
      try {
        const filePaths: string[] = [];
        if (document.fileUrl) filePaths.push(document.fileUrl);
        for (const v of versions) {
          if (v.fileUrl) filePaths.push(v.fileUrl);
        }
        for (const p of filePaths) {
          await deleteFile(p).catch((err) =>
            console.error(`[Storage] Failed to delete ${p}:`, err)
          );
        }
      } catch (err) {
        console.error("[Storage] Cleanup failed for document:", id, err);
      }
    })();

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
