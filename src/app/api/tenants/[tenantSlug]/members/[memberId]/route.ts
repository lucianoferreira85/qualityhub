export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, ForbiddenError, NotFoundError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { updateMemberSchema } from "@/lib/validations";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string; memberId: string }> }
) {
  try {
    const { tenantSlug, memberId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "member", "update");

    const body = await request.json();
    const data = updateMemberSchema.parse(body);

    const member = await prisma.tenantMember.findFirst({
      where: { id: memberId, tenantId: ctx.tenantId },
    });

    if (!member) throw new NotFoundError("Membro");

    // Prevent demoting the last tenant_admin
    if (member.role === "tenant_admin" && data.role !== "tenant_admin") {
      const adminCount = await prisma.tenantMember.count({
        where: { tenantId: ctx.tenantId, role: "tenant_admin" },
      });
      if (adminCount <= 1) {
        throw new ForbiddenError("Não é possível rebaixar o último administrador");
      }
    }

    const updated = await prisma.tenantMember.update({
      where: { id: memberId },
      data: { role: data.role },
      include: {
        user: {
          select: { id: true, email: true, name: true, avatarUrl: true },
        },
      },
    });

    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string; memberId: string }> }
) {
  try {
    const { tenantSlug, memberId } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "member", "delete");

    const member = await prisma.tenantMember.findFirst({
      where: { id: memberId, tenantId: ctx.tenantId },
    });

    if (!member) throw new NotFoundError("Membro");

    // Prevent self-removal
    if (member.userId === ctx.userId) {
      throw new ForbiddenError("Não é possível remover a si mesmo");
    }

    // Prevent removing the last tenant_admin
    if (member.role === "tenant_admin") {
      const adminCount = await prisma.tenantMember.count({
        where: { tenantId: ctx.tenantId, role: "tenant_admin" },
      });
      if (adminCount <= 1) {
        throw new ForbiddenError("Não é possível remover o último administrador");
      }
    }

    await prisma.tenantMember.delete({ where: { id: memberId } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
