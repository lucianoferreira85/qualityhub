import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "status_change"
  | "upload"
  | "download"
  | "export";

export interface LogActivityParams {
  tenantId: string;
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
}

/**
 * Logs an activity to the audit_logs table.
 * Fire-and-forget: errors are caught silently so they never block the main request.
 */
export function logActivity(params: LogActivityParams): void {
  prisma.auditLog
    .create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: (params.metadata ?? {}) as Prisma.InputJsonValue,
        ipAddress: params.ipAddress ?? null,
      },
    })
    .catch((err) => {
      console.error("[AuditLog] Failed to log activity:", err);
    });
}

/**
 * Extracts the client IP from common proxy headers.
 */
export function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || null;
}
