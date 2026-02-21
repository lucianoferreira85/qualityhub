export const dynamic = 'force-dynamic';

import { getUserFromRequest, handleApiError, successResponse } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const userId = await getUserFromRequest();

    const memberships = await prisma.tenantMember.findMany({
      where: { userId },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            status: true,
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    const tenants = memberships.map((m) => ({
      id: m.tenant.id,
      name: m.tenant.name,
      slug: m.tenant.slug,
      logo: m.tenant.logo,
      status: m.tenant.status,
      role: m.role,
    }));

    return successResponse(tenants);
  } catch (error) {
    return handleApiError(error);
  }
}
