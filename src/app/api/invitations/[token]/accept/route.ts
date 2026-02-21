export const dynamic = 'force-dynamic';

import { getUserFromRequest, handleApiError, successResponse, NotFoundError, ForbiddenError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const userId = await getUserFromRequest();

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!invitation) {
      throw new NotFoundError("Convite");
    }

    if (invitation.status !== "pending") {
      throw new ForbiddenError("Este convite já foi utilizado ou revogado");
    }

    if (new Date() > invitation.expiresAt) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "expired" },
      });
      throw new ForbiddenError("Este convite expirou");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (user?.email !== invitation.email) {
      throw new ForbiddenError("Este convite foi enviado para outro e-mail");
    }

    const existingMember = await prisma.tenantMember.findUnique({
      where: {
        tenantId_userId: {
          tenantId: invitation.tenant.id,
          userId,
        },
      },
    });

    if (existingMember) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "accepted" },
      });

      return successResponse({
        message: "Você já é membro desta empresa",
        tenantSlug: invitation.tenant.slug,
      });
    }

    await prisma.$transaction([
      prisma.tenantMember.create({
        data: {
          tenantId: invitation.tenant.id,
          userId,
          role: invitation.role,
          invitedById: invitation.invitedById,
        },
      }),
      prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "accepted" },
      }),
    ]);

    return successResponse({
      message: "Convite aceito com sucesso",
      tenantSlug: invitation.tenant.slug,
      role: invitation.role,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
