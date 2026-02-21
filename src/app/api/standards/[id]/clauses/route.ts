export const dynamic = 'force-dynamic';

import { getUserFromRequest, handleApiError, successResponse, NotFoundError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await getUserFromRequest();

    const standard = await prisma.standard.findUnique({ where: { id } });
    if (!standard) throw new NotFoundError("Norma");

    const clauses = await prisma.standardClause.findMany({
      where: { standardId: id, parentId: null },
      include: {
        children: {
          orderBy: { orderIndex: "asc" },
        },
      },
      orderBy: { orderIndex: "asc" },
    });

    return successResponse(clauses);
  } catch (error) {
    return handleApiError(error);
  }
}
