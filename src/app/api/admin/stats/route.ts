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

    const [totalTenants, activeTenants, trialTenants, totalUsers] =
      await Promise.all([
        prisma.tenant.count(),
        prisma.tenant.count({ where: { status: "active" } }),
        prisma.tenant.count({ where: { status: "trial" } }),
        prisma.user.count(),
      ]);

    return successResponse({
      totalTenants,
      activeTenants,
      trialTenants,
      totalUsers,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
