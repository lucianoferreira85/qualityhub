export const dynamic = 'force-dynamic';

import { getUserFromRequest, handleApiError, successResponse, ForbiddenError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const userId = await getUserFromRequest();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isSuperAdmin: true },
    });

    if (!user?.isSuperAdmin) {
      throw new ForbiddenError("Acesso restrito a Super Admin");
    }

    const tenants = await prisma.tenant.findMany({
      include: {
        subscription: {
          include: {
            plan: { select: { id: true, name: true, slug: true } },
          },
        },
        _count: {
          select: { members: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(tenants);
  } catch (error) {
    return handleApiError(error);
  }
}
