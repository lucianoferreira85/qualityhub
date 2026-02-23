export const dynamic = 'force-dynamic';

import { getUserFromRequest, handleApiError, successResponse, ForbiddenError, NotFoundError, errorResponse } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { updatePlanSchema } from "@/lib/validations";

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

    const plan = await prisma.plan.findUnique({
      where: { id },
      include: {
        _count: { select: { subscriptions: true } },
      },
    });

    if (!plan) throw new NotFoundError("Plano");

    return successResponse(plan);
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

    const plan = await prisma.plan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundError("Plano");

    const body = await request.json();
    const data = updatePlanSchema.parse(body);

    const updated = await prisma.plan.update({
      where: { id },
      data: {
        ...data,
        features: data.features as Record<string, boolean> | undefined,
      },
    });

    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireSuperAdmin();

    const plan = await prisma.plan.findUnique({
      where: { id },
      include: { _count: { select: { subscriptions: true } } },
    });

    if (!plan) throw new NotFoundError("Plano");

    if (plan._count.subscriptions > 0) {
      return errorResponse(
        `Não é possível excluir: plano possui ${plan._count.subscriptions} assinatura(s) ativa(s)`,
        409
      );
    }

    await prisma.plan.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
