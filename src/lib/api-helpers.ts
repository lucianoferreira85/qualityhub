import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json({ data }, { status });
}

export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function getUserFromRequest(): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new UnauthorizedError();
  }

  const existingUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!existingUser) {
    await prisma.user.create({
      data: {
        id: user.id,
        email: user.email || "",
        name:
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "Usuário",
      },
    });
  }

  return user.id;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Não autorizado");
    this.name = "UnauthorizedError";
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return errorResponse("Não autorizado", 401);
  }

  console.error("API Error:", error);
  return errorResponse("Erro interno do servidor", 500);
}
