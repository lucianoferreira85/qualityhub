import { describe, it, expect, vi, beforeEach } from "vitest";
import { exportToCSV, type CsvColumn } from "./export";

describe("exportToCSV", () => {
  let clickSpy: ReturnType<typeof vi.fn>;
  let createObjectURLSpy: ReturnType<typeof vi.fn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.fn>;
  let capturedBlobContent: string;

  beforeEach(() => {
    clickSpy = vi.fn();
    createObjectURLSpy = vi.fn().mockReturnValue("blob:http://localhost/fake");
    revokeObjectURLSpy = vi.fn();
    capturedBlobContent = "";

    vi.stubGlobal("URL", {
      createObjectURL: createObjectURLSpy,
      revokeObjectURL: revokeObjectURLSpy,
    });

    vi.spyOn(document, "createElement").mockReturnValue({
      href: "",
      download: "",
      style: { display: "" },
      click: clickSpy,
    } as unknown as HTMLElement);
    vi.spyOn(document.body, "appendChild").mockImplementation((el) => el);
    vi.spyOn(document.body, "removeChild").mockImplementation((el) => el);
  });

  function mockBlobCapture() {
    vi.stubGlobal(
      "Blob",
      class MockBlob {
        type: string;
        constructor(parts: string[], opts?: { type?: string }) {
          capturedBlobContent = parts[0];
          this.type = opts?.type || "";
        }
      }
    );
  }

  it("creates a download link and clicks it", () => {
    const data = [{ name: "Teste", value: 42 }];
    const columns: CsvColumn[] = [
      { key: "name", label: "Nome" },
      { key: "value", label: "Valor" },
    ];

    exportToCSV(data, columns, "export");

    expect(clickSpy).toHaveBeenCalled();
    expect(createObjectURLSpy).toHaveBeenCalledWith(expect.any(Blob));
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:http://localhost/fake");
  });

  it("uses semicolon as separator", () => {
    mockBlobCapture();

    const data = [{ a: "1", b: "2" }];
    const columns: CsvColumn[] = [
      { key: "a", label: "A" },
      { key: "b", label: "B" },
    ];

    exportToCSV(data, columns, "test");

    // BOM + header + data
    expect(capturedBlobContent).toContain("\uFEFF");
    expect(capturedBlobContent).toContain("A;B");
    expect(capturedBlobContent).toContain("1;2");
  });

  it("escapes values containing quotes", () => {
    mockBlobCapture();

    const data = [{ name: 'Test "quotes"' }];
    const columns: CsvColumn[] = [{ key: "name", label: "Nome" }];

    exportToCSV(data, columns, "test");

    expect(capturedBlobContent).toContain('"Test ""quotes"""');
  });

  it("uses formatter when provided", () => {
    mockBlobCapture();

    const data = [{ status: "open" }];
    const columns: CsvColumn[] = [
      { key: "status", label: "Status", formatter: (v) => v === "open" ? "Aberta" : String(v) },
    ];

    exportToCSV(data, columns, "test");

    expect(capturedBlobContent).toContain("Aberta");
  });

  it("handles null/undefined values", () => {
    mockBlobCapture();

    const data = [{ name: null, age: undefined }];
    const columns: CsvColumn[] = [
      { key: "name", label: "Nome" },
      { key: "age", label: "Idade" },
    ];

    exportToCSV(data, columns as CsvColumn[], "test");

    // Should not throw, null/undefined become empty
    expect(capturedBlobContent).toBeDefined();
  });
});
