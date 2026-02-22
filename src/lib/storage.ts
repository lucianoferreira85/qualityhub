import { createSupabaseServerClient } from "@/lib/supabase/server";

const BUCKET = "documents";

function safeName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 200);
}

export async function uploadFile({
  tenantId,
  folder,
  fileName,
  fileBuffer,
  contentType,
}: {
  tenantId: string;
  folder: string;
  fileName: string;
  fileBuffer: Buffer;
  contentType: string;
}): Promise<{ path: string; url: string }> {
  const supabase = await createSupabaseServerClient();
  const ts = Date.now();
  const safe = safeName(fileName);
  const path = `${tenantId}/${folder}/${ts}_${safe}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, fileBuffer, {
      contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data: urlData } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 3600);

  return {
    path,
    url: urlData?.signedUrl || "",
  };
}

export async function getSignedUrl(
  filePath: string,
  expiresIn = 3600
): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(filePath, expiresIn);

  if (error) {
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }

  return data.signedUrl;
}

export async function deleteFile(filePath: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([filePath]);

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}
