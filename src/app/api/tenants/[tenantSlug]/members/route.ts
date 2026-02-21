export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "member", "read");

    const members = await prisma.tenantMember.findMany({
      where: { tenantId: ctx.tenantId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
            isActive: true,
            lastLoginAt: true,
          },
        },
      },
      orderBy: { joinedAt: "asc" },
    });

    return successResponse(members);
  } catch (error) {
    return handleApiError(error);
  }
}
