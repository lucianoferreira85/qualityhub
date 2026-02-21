export const dynamic = 'force-dynamic';

import { getUserFromRequest, handleApiError, successResponse } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await getUserFromRequest();

    const standards = await prisma.standard.findMany({
      where: { status: "active" },
      select: {
        id: true,
        code: true,
        name: true,
        version: true,
        year: true,
      },
      orderBy: { code: "asc" },
    });

    return successResponse(standards);
  } catch (error) {
    return handleApiError(error);
  }
}
