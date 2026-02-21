export const dynamic = 'force-dynamic';

import { getUserFromRequest, handleApiError, successResponse, ForbiddenError, NotFoundError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createClauseSchema = z.object({
  code: z.string().min(1, "Código é obrigatório"),
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().nullable().optional(),
  parentId: z.string().uuid().nullable().optional(),
  orderIndex: z.number().int().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await getUserFromRequest();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isSuperAdmin: true },
    });

    if (!user?.isSuperAdmin) {
      throw new ForbiddenError("Acesso restrito a Super Admin");
    }

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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await getUserFromRequest();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isSuperAdmin: true },
    });

    if (!user?.isSuperAdmin) {
      throw new ForbiddenError("Acesso restrito a Super Admin");
    }

    const standard = await prisma.standard.findUnique({ where: { id } });
    if (!standard) throw new NotFoundError("Norma");

    const body = await request.json();
    const data = createClauseSchema.parse(body);

    const clause = await prisma.standardClause.create({
      data: {
        standardId: id,
        code: data.code,
        title: data.title,
        description: data.description,
        parentId: data.parentId,
        orderIndex: data.orderIndex ?? 0,
      },
    });

    return successResponse(clause, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
