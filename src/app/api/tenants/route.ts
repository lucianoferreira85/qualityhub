export const dynamic = 'force-dynamic';

import { getUserFromRequest, handleApiError, successResponse } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { createTenantSchema } from "@/lib/validations";
import slugify from "slugify";

export async function POST(request: Request) {
  try {
    const userId = await getUserFromRequest();
    const body = await request.json();
    const data = createTenantSchema.parse(body);

    let slug = slugify(data.name, { lower: true, strict: true });

    const existing = await prisma.tenant.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const professionalPlan = await prisma.plan.findFirst({
      where: { slug: "professional" },
    });

    const tenant = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: data.name,
          slug,
          cnpj: data.cnpj,
          status: "trial",
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      });

      await tx.tenantMember.create({
        data: {
          tenantId: tenant.id,
          userId,
          role: "tenant_admin",
        },
      });

      if (professionalPlan) {
        await tx.subscription.create({
          data: {
            tenantId: tenant.id,
            planId: professionalPlan.id,
            status: "trialing",
          },
        });
      }

      return tenant;
    });

    return successResponse(tenant, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
