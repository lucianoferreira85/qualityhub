import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma, tenantPrisma, type TenantPrismaClient } from "@/lib/prisma";
import { hasPermission, type Action, type Resource } from "@/lib/permissions";
import { OrgRole } from "@prisma/client";

// ==================== Response Helpers ====================

export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json({ data }, { status });
}

export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

// ==================== Error Classes ====================

export class UnauthorizedError extends Error {
  constructor(message = "Não autorizado") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Acesso negado") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends Error {
  constructor(entity = "Recurso") {
    super(`${entity} não encontrado`);
    this.name = "NotFoundError";
  }
}

export class PlanLimitError extends Error {
  resource: string;
  current: number;
  limit: number;

  constructor(resource: string, current: number, limit: number) {
    super(
      `Limite do plano atingido para ${resource}: ${current}/${limit}. Faça upgrade do plano.`
    );
    this.name = "PlanLimitError";
    this.resource = resource;
    this.current = current;
    this.limit = limit;
  }
}

export class ValidationError extends Error {
  errors: Record<string, string[]>;

  constructor(errors: Record<string, string[]>) {
    super("Erro de validação");
    this.name = "ValidationError";
    this.errors = errors;
  }
}

// ==================== Error Handler ====================

export function handleApiError(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return errorResponse(error.message, 401);
  }
  if (error instanceof ForbiddenError) {
    return errorResponse(error.message, 403);
  }
  if (error instanceof NotFoundError) {
    return errorResponse(error.message, 404);
  }
  if (error instanceof PlanLimitError) {
    return NextResponse.json(
      {
        error: error.message,
        resource: error.resource,
        current: error.current,
        limit: error.limit,
      },
      { status: 402 }
    );
  }
  if (error instanceof ValidationError) {
    return NextResponse.json(
      { error: error.message, details: error.errors },
      { status: 422 }
    );
  }

  console.error("API Error:", error);
  return errorResponse("Erro interno do servidor", 500);
}

// ==================== Auth Helpers ====================

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

// ==================== Tenant Context ====================

export interface RequestContext {
  userId: string;
  tenantId: string;
  tenantSlug: string;
  role: OrgRole;
  db: TenantPrismaClient;
}

export async function getRequestContext(
  tenantSlug: string,
  requiredRoles?: OrgRole[]
): Promise<RequestContext> {
  const userId = await getUserFromRequest();

  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
  });

  if (!tenant) {
    throw new NotFoundError("Empresa");
  }

  if (tenant.status === "suspended" || tenant.status === "cancelled") {
    throw new ForbiddenError("Empresa suspensa ou cancelada");
  }

  const membership = await prisma.tenantMember.findUnique({
    where: {
      tenantId_userId: {
        tenantId: tenant.id,
        userId,
      },
    },
  });

  if (!membership) {
    throw new ForbiddenError("Você não é membro desta empresa");
  }

  if (requiredRoles && !requiredRoles.includes(membership.role)) {
    throw new ForbiddenError("Permissão insuficiente");
  }

  const db = tenantPrisma(tenant.id);

  return {
    userId,
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    role: membership.role,
    db,
  };
}

export function requirePermission(
  ctx: RequestContext,
  resource: Resource,
  action: Action
): void {
  if (!hasPermission(ctx.role, resource, action)) {
    throw new ForbiddenError(
      `Sem permissão para ${action} em ${resource}`
    );
  }
}
