import { describe, it, expect } from "vitest";
import {
  cn,
  formatDate,
  formatDateShort,
  getInitials,
  getRiskLevel,
  getRiskLevelLabel,
  getStatusColor,
  getStatusLabel,
  generateCode,
  getSeverityColor,
  getSeverityLabel,
  getOriginLabel,
  getAuditTypeLabel,
  getConclusionLabel,
  getConclusionColor,
  getClassificationLabel,
  getClassificationColor,
  getDocumentTypeLabel,
  getProcessStatusLabel,
  getProcessStatusColor,
  getFrequencyLabel,
  getRoleLabel,
} from "./utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("merges tailwind classes correctly", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
  });
});

describe("formatDate", () => {
  it("formats Date object to pt-BR", () => {
    // Use ISO date with time to avoid timezone offset issues
    const result = formatDate(new Date("2025-03-15T12:00:00"));
    expect(result).toMatch(/15\/03\/2025/);
  });

  it("formats string date to pt-BR", () => {
    const result = formatDate("2025-12-25T12:00:00");
    expect(result).toMatch(/25\/12\/2025/);
  });
});

describe("formatDateShort", () => {
  it("returns short date format", () => {
    const result = formatDateShort(new Date("2025-06-10"));
    expect(result).toBeTruthy();
    expect(result.length).toBeLessThan(15);
  });
});

describe("getInitials", () => {
  it("returns initials for two-word name", () => {
    expect(getInitials("John Doe")).toBe("JD");
  });

  it("returns initials for single name", () => {
    expect(getInitials("Admin")).toBe("A");
  });

  it("limits to 2 characters", () => {
    expect(getInitials("John Michael Doe")).toBe("JM");
  });
});

describe("getRiskLevel", () => {
  it("returns very_high for score >= 17", () => {
    expect(getRiskLevel(5, 4)).toBe("very_high");
    expect(getRiskLevel(4, 5)).toBe("very_high");
  });

  it("returns high for score >= 10", () => {
    expect(getRiskLevel(5, 2)).toBe("high");
    expect(getRiskLevel(2, 5)).toBe("high");
  });

  it("returns medium for score >= 5", () => {
    expect(getRiskLevel(5, 1)).toBe("medium");
    expect(getRiskLevel(1, 5)).toBe("medium");
  });

  it("returns low for score < 5", () => {
    expect(getRiskLevel(2, 2)).toBe("low");
    expect(getRiskLevel(1, 1)).toBe("low");
  });
});

describe("getRiskLevelLabel", () => {
  it("returns Portuguese labels", () => {
    expect(getRiskLevelLabel("very_high")).toBe("Muito Alto");
    expect(getRiskLevelLabel("high")).toBe("Alto");
    expect(getRiskLevelLabel("medium")).toBe("Médio");
    expect(getRiskLevelLabel("low")).toBe("Baixo");
    expect(getRiskLevelLabel("very_low")).toBe("Muito Baixo");
  });

  it("returns raw value for unknown level", () => {
    expect(getRiskLevelLabel("unknown")).toBe("unknown");
  });
});

describe("getStatusColor", () => {
  it("returns classes for known statuses", () => {
    expect(getStatusColor("open")).toContain("bg-danger-bg");
    expect(getStatusColor("closed")).toContain("bg-success-bg");
    expect(getStatusColor("treated")).toContain("text-brand");
  });

  it("returns default for unknown status", () => {
    expect(getStatusColor("xyz")).toBe("bg-gray-100 text-gray-800");
  });
});

describe("getStatusLabel", () => {
  it("returns Portuguese labels for all enum values", () => {
    expect(getStatusLabel("identified")).toBe("Identificado");
    expect(getStatusLabel("analyzing")).toBe("Em Análise");
    expect(getStatusLabel("treated")).toBe("Tratado");
    expect(getStatusLabel("accepted")).toBe("Aceito");
    expect(getStatusLabel("monitored")).toBe("Monitorado");
    expect(getStatusLabel("closed")).toBe("Fechada");
    expect(getStatusLabel("completed")).toBe("Concluída");
  });

  it("returns raw value for unknown", () => {
    expect(getStatusLabel("xyz")).toBe("xyz");
  });
});

describe("generateCode", () => {
  it("generates code with prefix, year, and padded sequence", () => {
    const year = new Date().getFullYear();
    expect(generateCode("NC", 1)).toBe(`NC-${year}-001`);
    expect(generateCode("NC", 42)).toBe(`NC-${year}-042`);
    expect(generateCode("AUD", 100)).toBe(`AUD-${year}-100`);
  });
});

describe("getSeverityLabel", () => {
  it("returns correct labels", () => {
    expect(getSeverityLabel("observation")).toBe("Observação");
    expect(getSeverityLabel("minor")).toBe("Menor");
    expect(getSeverityLabel("major")).toBe("Maior");
    expect(getSeverityLabel("critical")).toBe("Crítica");
  });
});

describe("getSeverityColor", () => {
  it("returns classes for known severities", () => {
    expect(getSeverityColor("critical")).toContain("bg-danger-bg");
    expect(getSeverityColor("minor")).toContain("bg-warning-bg");
  });

  it("returns default for unknown", () => {
    expect(getSeverityColor("xyz")).toBe("bg-gray-100 text-gray-800");
  });
});

describe("getOriginLabel", () => {
  it("returns correct labels", () => {
    expect(getOriginLabel("audit")).toBe("Auditoria");
    expect(getOriginLabel("customer_complaint")).toBe("Reclamação de Cliente");
    expect(getOriginLabel("internal")).toBe("Interna");
  });
});

describe("getAuditTypeLabel", () => {
  it("returns correct labels including surveillance", () => {
    expect(getAuditTypeLabel("internal")).toBe("Interna");
    expect(getAuditTypeLabel("external")).toBe("Externa");
    expect(getAuditTypeLabel("surveillance")).toBe("Vigilância");
    expect(getAuditTypeLabel("certification")).toBe("Certificação");
  });
});

describe("getConclusionLabel", () => {
  it("returns correct labels", () => {
    expect(getConclusionLabel("conforming")).toBe("Conforme");
    expect(getConclusionLabel("minor_nc")).toBe("NC Menor");
    expect(getConclusionLabel("major_nc")).toBe("NC Maior");
  });
});

describe("getConclusionColor", () => {
  it("returns correct colors", () => {
    expect(getConclusionColor("conforming")).toContain("bg-success-bg");
    expect(getConclusionColor("major_nc")).toContain("bg-danger-bg");
  });
});

describe("getClassificationLabel/Color", () => {
  it("returns correct labels", () => {
    expect(getClassificationLabel("conformity")).toBe("Conformidade");
    expect(getClassificationLabel("opportunity")).toBe("Oportunidade");
  });

  it("returns correct colors", () => {
    expect(getClassificationColor("conformity")).toContain("bg-success-bg");
    expect(getClassificationColor("opportunity")).toContain("bg-info-bg");
  });
});

describe("getDocumentTypeLabel", () => {
  it("returns correct labels", () => {
    expect(getDocumentTypeLabel("policy")).toBe("Política");
    expect(getDocumentTypeLabel("procedure")).toBe("Procedimento");
    expect(getDocumentTypeLabel("form")).toBe("Formulário");
  });
});

describe("getProcessStatusLabel/Color", () => {
  it("returns correct labels", () => {
    expect(getProcessStatusLabel("active")).toBe("Ativo");
    expect(getProcessStatusLabel("inactive")).toBe("Inativo");
    expect(getProcessStatusLabel("draft")).toBe("Rascunho");
  });

  it("returns correct colors", () => {
    expect(getProcessStatusColor("active")).toContain("bg-success-bg");
  });
});

describe("getFrequencyLabel", () => {
  it("returns correct labels", () => {
    expect(getFrequencyLabel("daily")).toBe("Diário");
    expect(getFrequencyLabel("monthly")).toBe("Mensal");
    expect(getFrequencyLabel("yearly")).toBe("Anual");
  });
});

describe("getRoleLabel", () => {
  it("returns correct labels", () => {
    expect(getRoleLabel("tenant_admin")).toBe("Administrador");
    expect(getRoleLabel("project_manager")).toBe("Gerente de Projetos");
    expect(getRoleLabel("internal_auditor")).toBe("Auditor Interno");
  });

  it("returns raw value for unknown", () => {
    expect(getRoleLabel("custom_role")).toBe("custom_role");
  });
});
