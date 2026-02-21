export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, NotFoundError } from "@/lib/api-helpers";
import { z } from "zod";

const rootCauseSchema = z.object({
  method: z.enum(["five_whys", "ishikawa", "fault_tree", "brainstorming"]),
  analysis: z.record(z.string(), z.unknown()).optional(),
  conclusion: z.string().nullable().optional(),
});

// GET - Get root cause for a nonconformity
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id: ncId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "nonconformity", "read");

    const nc = await ctx.db.nonconformity.findFirst({ where: { id: ncId } });
    if (!nc) throw new NotFoundError("Nao conformidade");

    const rootCause = await ctx.db.ncRootCause.findUnique({
      where: { nonconformityId: ncId },
    });

    return successResponse(rootCause);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST - Create or update root cause analysis
export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id: ncId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "nonconformity", "update");

    const nc = await ctx.db.nonconformity.findFirst({ where: { id: ncId } });
    if (!nc) throw new NotFoundError("Nao conformidade");

    const body = await request.json();
    const data = rootCauseSchema.parse(body);

    const rootCause = await ctx.db.ncRootCause.upsert({
      where: { nonconformityId: ncId },
      update: {
        method: data.method,
        analysis: data.analysis || {},
        conclusion: data.conclusion ?? null,
      },
      create: {
        nonconformityId: ncId,
        method: data.method,
        analysis: data.analysis || {},
        conclusion: data.conclusion ?? null,
      },
    });

    return successResponse(rootCause, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE - Remove root cause analysis
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id: ncId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "nonconformity", "update");

    const nc = await ctx.db.nonconformity.findFirst({ where: { id: ncId } });
    if (!nc) throw new NotFoundError("Nao conformidade");

    const existing = await ctx.db.ncRootCause.findUnique({
      where: { nonconformityId: ncId },
    });
    if (!existing) throw new NotFoundError("Analise de causa raiz");

    await ctx.db.ncRootCause.delete({
      where: { nonconformityId: ncId },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
