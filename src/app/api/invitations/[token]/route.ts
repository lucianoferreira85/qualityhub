export const dynamic = 'force-dynamic';

import { handleApiError, successResponse } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        tenant: { select: { name: true, slug: true } },
      },
    });

    if (!invitation) {
      return successResponse({ valid: false, error: "Convite não encontrado" }, 404);
    }

    const isExpired = invitation.status !== "pending" || new Date() > invitation.expiresAt;

    return successResponse({
      valid: !isExpired,
      tenantName: invitation.tenant.name,
      tenantSlug: invitation.tenant.slug,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expired: isExpired,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
