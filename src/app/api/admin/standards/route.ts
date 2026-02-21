export const dynamic = 'force-dynamic';

import { getUserFromRequest, handleApiError, successResponse, ForbiddenError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createStandardSchema = z.object({
  code: z.string().min(1, "Código é obrigatório"),
  name: z.string().min(1, "Nome é obrigatório"),
  version: z.string().min(1, "Versão é obrigatória"),
  year: z.number().int().min(1900).max(2100),
  description: z.string().nullable().optional(),
});

export async function GET() {
  try {
    const userId = await getUserFromRequest();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isSuperAdmin: true },
    });

    if (!user?.isSuperAdmin) {
      throw new ForbiddenError("Acesso restrito a Super Admin");
    }

    const standards = await prisma.standard.findMany({
      include: {
        _count: {
          select: { clauses: true, controls: true, projects: true },
        },
      },
      orderBy: { code: "asc" },
    });

    return successResponse(standards);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserFromRequest();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isSuperAdmin: true },
    });

    if (!user?.isSuperAdmin) {
      throw new ForbiddenError("Acesso restrito a Super Admin");
    }

    const body = await request.json();
    const data = createStandardSchema.parse(body);

    const standard = await prisma.standard.create({
      data: {
        code: data.code,
        name: data.name,
        version: data.version,
        year: data.year,
        description: data.description,
      },
    });

    return successResponse(standard, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
