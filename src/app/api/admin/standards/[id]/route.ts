export const dynamic = 'force-dynamic';

import { getUserFromRequest, handleApiError, successResponse, ForbiddenError, NotFoundError, errorResponse } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { updateStandardSchema } from "@/lib/validations";

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

    const standard = await prisma.standard.findUnique({
      where: { id },
      include: {
        _count: {
          select: { clauses: true, controls: true, projects: true },
        },
      },
    });

    if (!standard) throw new NotFoundError("Norma");

    return successResponse(standard);
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

    const standard = await prisma.standard.findUnique({ where: { id } });
    if (!standard) throw new NotFoundError("Norma");

    const body = await request.json();
    const data = updateStandardSchema.parse(body);

    const updated = await prisma.standard.update({
      where: { id },
      data,
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

    const standard = await prisma.standard.findUnique({
      where: { id },
      include: { _count: { select: { projects: true } } },
    });

    if (!standard) throw new NotFoundError("Norma");

    if (standard._count.projects > 0) {
      return errorResponse(
        `Não é possível excluir: norma associada a ${standard._count.projects} projeto(s)`,
        409
      );
    }

    await prisma.standard.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
