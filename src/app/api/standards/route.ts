export const dynamic = 'force-dynamic';

import { getUserFromRequest, handleApiError, successResponse } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    await getUserFromRequest();

    const url = new URL(request.url);
    const codes = url.searchParams.get("codes");

    const where: Record<string, unknown> = { status: "active" };
    if (codes) {
      where.code = { in: codes.split(",").map((c) => c.trim()) };
    }

    const standards = await prisma.standard.findMany({
      where,
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
