export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getUserFromRequest, handleApiError, successResponse } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { updateUserProfileSchema } from "@/lib/validations";

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

export async function PATCH(request: Request) {
  try {
    const userId = await getUserFromRequest();

    const body = await request.json();
    const data = updateUserProfileSchema.parse(body);

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
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

    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
