export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission } from "@/lib/api-helpers";
import { createDocumentSchema } from "@/lib/validations";
import { generateCode } from "@/lib/utils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "document", "read");

    const url = new URL(request.url);
    const type = url.searchParams.get("type");
    const status = url.searchParams.get("status");
    const projectId = url.searchParams.get("projectId");

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (projectId) where.projectId = projectId;

    const documents = await ctx.db.document.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        author: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return successResponse(documents);
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
    requirePermission(ctx, "document", "create");

    const body = await request.json();
    const data = createDocumentSchema.parse(body);

    const count = await ctx.db.document.count();
    const prefixMap: Record<string, string> = {
      policy: "POL",
      procedure: "PRC",
      work_instruction: "IT",
      form: "FRM",
      record: "REG",
      manual: "MAN",
    };
    const code = generateCode(prefixMap[data.type] || "DOC", count + 1);

    const document = await ctx.db.document.create({
      data: {
        tenantId: ctx.tenantId,
        projectId: data.projectId,
        code,
        title: data.title,
        type: data.type,
        category: data.category,
        content: data.content,
        fileUrl: data.fileUrl,
        authorId: ctx.userId,
        reviewerId: data.reviewerId,
        nextReviewDate: data.nextReviewDate ? new Date(data.nextReviewDate) : undefined,
      },
    });

    return successResponse(document, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
