export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, NotFoundError } from "@/lib/api-helpers";
import { z } from "zod";

const createVersionSchema = z.object({
  changeNotes: z.string().min(1, "Notas de alteração são obrigatórias").max(1000),
  newVersion: z.string().min(1, "Versão é obrigatória").max(20),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "document", "read");

    const document = await ctx.db.document.findFirst({ where: { id } });
    if (!document) throw new NotFoundError("Documento");

    const versions = await ctx.db.documentVersion.findMany({
      where: { documentId: id },
      include: {
        changedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(versions);
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
    requirePermission(ctx, "document", "update");

    const body = await request.json();
    const { changeNotes, newVersion } = createVersionSchema.parse(body);

    const document = await ctx.db.document.findFirst({ where: { id } });
    if (!document) throw new NotFoundError("Documento");

    // Snapshot current state as a version entry
    const version = await ctx.db.documentVersion.create({
      data: {
        documentId: id,
        version: document.version,
        content: document.content,
        fileUrl: document.fileUrl,
        changedById: ctx.userId,
        changeNotes,
      },
    });

    // Bump the document version and reset status to draft for new revision
    await ctx.db.document.update({
      where: { id },
      data: {
        version: newVersion,
        status: "draft",
        approvedAt: null,
        approverId: null,
      },
    });

    return successResponse(version, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
