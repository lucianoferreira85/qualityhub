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

    const plans = await prisma.plan.findMany({
      include: {
        _count: {
          select: { subscriptions: true },
        },
      },
      orderBy: { price: "asc" },
    });

    return successResponse(plans);
  } catch (error) {
    return handleApiError(error);
  }
}
