export const dynamic = 'force-dynamic';

import { getUserFromRequest, handleApiError, successResponse, ForbiddenError, NotFoundError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createControlSchema = z.object({
  code: z.string().min(1, "Código é obrigatório"),
  title: z.string().min(1, "Título é obrigatório"),
  domain: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
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

    const controls = await prisma.standardControl.findMany({
      where: { standardId: id },
      orderBy: { code: "asc" },
    });

    return successResponse(controls);
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
    const data = createControlSchema.parse(body);

    const control = await prisma.standardControl.create({
      data: {
        standardId: id,
        code: data.code,
        title: data.title,
        domain: data.domain,
        type: data.type,
        attributes: (data.attributes ?? {}) as Record<string, string>,
      },
    });

    return successResponse(control, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
