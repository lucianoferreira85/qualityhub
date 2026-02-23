export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, requirePermission, PlanLimitError, NotFoundError, ForbiddenError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { createInvitationSchema } from "@/lib/validations";
import { checkPlanLimit } from "@/lib/plan-limits";
import { sendInvitationEmail } from "@/lib/email";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "invitation", "read");

    const invitations = await prisma.invitation.findMany({
      where: { tenantId: ctx.tenantId },
      include: {
        invitedBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(invitations);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "invitation", "create");

    const body = await request.json();
    const data = createInvitationSchema.parse(body);

    const limit = await checkPlanLimit(ctx.tenantId, "users");
    if (!limit.allowed) {
      throw new PlanLimitError("users", limit.current, limit.limit);
    }

    const existingMember = await prisma.tenantMember.findFirst({
      where: {
        tenantId: ctx.tenantId,
        user: { email: data.email },
      },
    });

    if (existingMember) {
      return successResponse({ error: "Usuário já é membro" }, 409);
    }

    const invitation = await prisma.invitation.create({
      data: {
        tenantId: ctx.tenantId,
        email: data.email,
        role: data.role,
        invitedById: ctx.userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Send invitation email (non-blocking)
    const [inviter, tenant] = await Promise.all([
      prisma.user.findUnique({ where: { id: ctx.userId }, select: { name: true } }),
      prisma.tenant.findUnique({ where: { id: ctx.tenantId }, select: { name: true } }),
    ]);

    sendInvitationEmail({
      to: data.email,
      inviterName: inviter?.name || "Um administrador",
      tenantName: tenant?.name || "sua empresa",
      role: data.role,
      token: invitation.token,
    }).catch(() => {}); // Fire-and-forget

    return successResponse(invitation, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "invitation", "delete");

    const url = new URL(request.url);
    const invitationId = url.searchParams.get("id");

    if (!invitationId) {
      throw new NotFoundError("Convite (id não fornecido)");
    }

    const invitation = await prisma.invitation.findFirst({
      where: { id: invitationId, tenantId: ctx.tenantId },
    });

    if (!invitation) throw new NotFoundError("Convite");

    if (invitation.status !== "pending") {
      throw new ForbiddenError("Apenas convites pendentes podem ser revogados");
    }

    await prisma.invitation.update({
      where: { id: invitationId },
      data: { status: "revoked" },
    });

    return successResponse({ revoked: true });
  } catch (error) {
    return handleApiError(error);
  }
}
