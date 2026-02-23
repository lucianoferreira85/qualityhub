export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { updateTenantSchema } from "@/lib/validations";
import type { Prisma } from "@prisma/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await params;
    const ctx = await getRequestContext(tenantSlug);

    const [tenant, membership] = await Promise.all([
      prisma.tenant.findUnique({
        where: { id: ctx.tenantId },
        include: {
          subscription: {
            include: { plan: true },
          },
        },
      }),
      prisma.tenantMember.findUnique({
        where: {
          tenantId_userId: {
            tenantId: ctx.tenantId,
            userId: ctx.userId,
          },
        },
      }),
    ]);

    return successResponse({
      tenant: {
        id: tenant!.id,
        name: tenant!.name,
        slug: tenant!.slug,
        logo: tenant!.logo,
        status: tenant!.status,
      },
      membership: {
        role: ctx.role,
        joinedAt: membership?.joinedAt?.toISOString() ?? new Date().toISOString(),
      },
      plan: tenant!.subscription?.plan
        ? {
            name: tenant!.subscription.plan.name,
            slug: tenant!.subscription.plan.slug,
            features: tenant!.subscription.plan.features as Record<string, boolean>,
          }
        : null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "settings", "update");

    const body = await request.json();
    const data = updateTenantSchema.parse(body);

    const updated = await prisma.tenant.update({
      where: { id: ctx.tenantId },
      data: {
        ...data,
        settings: data.settings as Prisma.InputJsonValue | undefined,
      },
    });

    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
