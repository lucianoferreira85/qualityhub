export const dynamic = 'force-dynamic';

import { getUserFromRequest, handleApiError, successResponse, ForbiddenError, NotFoundError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { updateAdminTenantSchema } from "@/lib/validations";

async function requireSuperAdmin() {
  const userId = await getUserFromRequest();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true },
  });
  if (!user?.isSuperAdmin) {
    throw new ForbiddenError("Acesso restrito a Super Admin");
  }
  return userId;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireSuperAdmin();

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        subscription: {
          include: {
            plan: { select: { id: true, name: true, slug: true } },
          },
        },
        _count: { select: { members: true, projects: true } },
      },
    });

    if (!tenant) throw new NotFoundError("Empresa");

    return successResponse(tenant);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireSuperAdmin();

    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundError("Empresa");

    const body = await request.json();
    const data = updateAdminTenantSchema.parse(body);

    const updated = await prisma.tenant.update({
      where: { id },
      data,
    });

    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
