export const dynamic = 'force-dynamic';

import { getRequestContext, handleApiError, successResponse, errorResponse, requirePermission } from "@/lib/api-helpers";
import { uploadFile } from "@/lib/storage";
import { logActivity, getClientIp } from "@/lib/audit-log";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png",
  "image/jpeg",
  "text/plain",
];

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await params;
    const ctx = await getRequestContext(tenantSlug);
    requirePermission(ctx, "document", "create");

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "general";

    if (!file) {
      return errorResponse("Nenhum arquivo enviado", 400);
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return errorResponse(
        "Tipo de arquivo não permitido. Tipos aceitos: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, TXT",
        400
      );
    }

    if (file.size > MAX_SIZE) {
      return errorResponse("Arquivo excede o tamanho máximo de 10MB", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await uploadFile({
      tenantId: ctx.tenantId,
      folder,
      fileName: file.name,
      fileBuffer: buffer,
      contentType: file.type,
    });

    void logActivity({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "upload",
      entityType: "file",
      entityId: result.path,
      metadata: { fileName: file.name, size: file.size, contentType: file.type },
      ipAddress: getClientIp(request),
    });

    return successResponse({
      path: result.path,
      url: result.url,
      fileName: file.name,
    }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
