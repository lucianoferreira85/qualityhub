export const dynamic = 'force-dynamic';

import { getUserFromRequest, handleApiError, successResponse, ForbiddenError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { createPlanSchema } from "@/lib/validations";

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

export async function POST(request: Request) {
  try {
    const userId = await getUserFromRequest();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isSuperAdmin: true },
    });

    if (!user?.isSuperAdmin) {
      throw new ForbiddenError("Acesso restrito a Super Admin");
    }

    const body = await request.json();
    const data = createPlanSchema.parse(body);

    const plan = await prisma.plan.create({
      data: {
        name: data.name,
        slug: data.slug,
        price: data.price,
        maxUsers: data.maxUsers,
        maxProjects: data.maxProjects,
        maxStandards: data.maxStandards,
        maxStorage: data.maxStorage,
        maxClients: data.maxClients,
        features: data.features || {},
        isActive: data.isActive ?? true,
      },
    });

    return successResponse(plan, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
