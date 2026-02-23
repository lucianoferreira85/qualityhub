import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUpload = vi.fn();
const mockRemove = vi.fn();
const mockCreateSignedUrl = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn().mockResolvedValue({
    storage: {
      from: () => ({
        upload: mockUpload,
        remove: mockRemove,
        createSignedUrl: mockCreateSignedUrl,
      }),
    },
  }),
}));

import { uploadFile, deleteFile, getSignedUrl } from "./storage";

describe("Storage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("uploadFile", () => {
    it("uploads and returns path and signed URL", async () => {
      mockUpload.mockResolvedValue({ error: null });
      mockCreateSignedUrl.mockResolvedValue({
        data: { signedUrl: "https://supabase.co/signed/abc" },
      });

      const result = await uploadFile({
        tenantId: "t1",
        folder: "docs",
        fileName: "report.pdf",
        fileBuffer: Buffer.from("data"),
        contentType: "application/pdf",
      });

      expect(result.path).toMatch(/^t1\/docs\/\d+_report\.pdf$/);
      expect(result.url).toBe("https://supabase.co/signed/abc");
      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringMatching(/^t1\/docs\/\d+_report\.pdf$/),
        expect.any(Buffer),
        { contentType: "application/pdf", upsert: false }
      );
    });

    it("sanitizes file names with special characters", async () => {
      mockUpload.mockResolvedValue({ error: null });
      mockCreateSignedUrl.mockResolvedValue({
        data: { signedUrl: "https://supabase.co/signed/x" },
      });

      const result = await uploadFile({
        tenantId: "t1",
        folder: "docs",
        fileName: "meu arquivo (cópia) [final].pdf",
        fileBuffer: Buffer.from("data"),
        contentType: "application/pdf",
      });

      // Special chars replaced with underscore, consecutive underscores collapsed
      expect(result.path).not.toContain(" ");
      expect(result.path).not.toContain("(");
      expect(result.path).not.toContain("[");
      expect(result.path).toMatch(/_/);
    });

    it("throws when upload fails", async () => {
      mockUpload.mockResolvedValue({ error: { message: "Bucket not found" } });

      await expect(
        uploadFile({
          tenantId: "t1",
          folder: "docs",
          fileName: "file.pdf",
          fileBuffer: Buffer.from("data"),
          contentType: "application/pdf",
        })
      ).rejects.toThrow("Upload failed: Bucket not found");
    });

    it("returns empty URL when signed URL is null", async () => {
      mockUpload.mockResolvedValue({ error: null });
      mockCreateSignedUrl.mockResolvedValue({ data: null });

      const result = await uploadFile({
        tenantId: "t1",
        folder: "docs",
        fileName: "file.pdf",
        fileBuffer: Buffer.from("data"),
        contentType: "application/pdf",
      });

      expect(result.url).toBe("");
    });
  });

  describe("getSignedUrl", () => {
    it("returns signed URL for a file path", async () => {
      mockCreateSignedUrl.mockResolvedValue({
        data: { signedUrl: "https://supabase.co/signed/xyz" },
      });

      const url = await getSignedUrl("t1/docs/123_file.pdf");

      expect(url).toBe("https://supabase.co/signed/xyz");
      expect(mockCreateSignedUrl).toHaveBeenCalledWith(
        "t1/docs/123_file.pdf",
        3600
      );
    });

    it("uses custom expiration", async () => {
      mockCreateSignedUrl.mockResolvedValue({
        data: { signedUrl: "https://supabase.co/signed/short" },
      });

      await getSignedUrl("t1/docs/file.pdf", 600);

      expect(mockCreateSignedUrl).toHaveBeenCalledWith(
        "t1/docs/file.pdf",
        600
      );
    });

    it("throws when signed URL generation fails", async () => {
      mockCreateSignedUrl.mockResolvedValue({
        data: null,
        error: { message: "Not found" },
      });

      await expect(getSignedUrl("invalid/path")).rejects.toThrow(
        "Failed to generate signed URL: Not found"
      );
    });
  });

  describe("deleteFile", () => {
    it("calls remove with the correct path", async () => {
      mockRemove.mockResolvedValue({ error: null });

      await deleteFile("t1/docs/123_file.pdf");

      expect(mockRemove).toHaveBeenCalledWith(["t1/docs/123_file.pdf"]);
    });

    it("throws when deletion fails", async () => {
      mockRemove.mockResolvedValue({
        error: { message: "Permission denied" },
      });

      await expect(deleteFile("t1/docs/file.pdf")).rejects.toThrow(
        "Failed to delete file: Permission denied"
      );
    });
  });
});
