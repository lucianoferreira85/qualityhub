export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission } from "@/lib/api-helpers";
import { createNonconformitySchema } from "@/lib/validations";
import { generateCode } from "@/lib/utils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "nonconformity", "read");

    const url = new URL(request.url);
    const origin = url.searchParams.get("origin");
    const severity = url.searchParams.get("severity");
    const status = url.searchParams.get("status");
    const projectId = url.searchParams.get("projectId");

    const where: Record<string, unknown> = {};
    if (origin) where.origin = origin;
    if (severity) where.severity = severity;
    if (status) where.status = status;
    if (projectId) where.projectId = projectId;

    const ncs = await ctx.db.nonconformity.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        responsible: { select: { id: true, name: true } },
        clause: { select: { id: true, code: true, title: true } },
        _count: { select: { actionPlans: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(ncs);
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
    requirePermission(ctx, "nonconformity", "create");

    const body = await request.json();
    const data = createNonconformitySchema.parse(body);

    const count = await ctx.db.nonconformity.count();
    const code = generateCode("NC", count + 1);

    const nc = await ctx.db.nonconformity.create({
      data: {
        tenantId: ctx.tenantId,
        projectId: data.projectId,
        code,
        title: data.title,
        description: data.description,
        origin: data.origin,
        type: data.type,
        severity: data.severity,
        clauseId: data.clauseId,
        responsibleId: data.responsibleId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
    });

    return successResponse(nc, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
