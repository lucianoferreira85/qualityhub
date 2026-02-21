export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getUserFromRequest, handleApiError, successResponse } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const userId = await getUserFromRequest();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        isSuperAdmin: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    return successResponse(user);
  } catch (error) {
    return handleApiError(error);
  }
}
