export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getRequestContext, handleApiError, errorResponse } from "@/lib/api-helpers";
import { getSignedUrl } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string; path: string[] }> }
) {
  try {
    const { tenantSlug, path: pathSegments } = await params;
    const ctx = await getRequestContext(tenantSlug);

    const filePath = pathSegments.join("/");

    // Security: ensure the file path starts with the tenant's ID
    if (!filePath.startsWith(ctx.tenantId)) {
      return errorResponse("Acesso negado", 403);
    }

    const signedUrl = await getSignedUrl(filePath);

    return NextResponse.redirect(signedUrl);
  } catch (error) {
    return handleApiError(error);
  }
}
