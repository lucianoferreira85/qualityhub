import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSend = vi.fn().mockResolvedValue({ id: "test-id" });

vi.mock("resend", () => {
  return {
    Resend: class {
      emails = { send: mockSend };
    },
  };
});

import {
  sendNcAssignedEmail,
  sendActionPlanDueEmail,
  sendAuditScheduledEmail,
  sendNotificationEmail,
} from "./email";

describe("Email functions", () => {
  beforeEach(() => {
    mockSend.mockClear();
    mockSend.mockResolvedValue({ id: "test-id" });
  });

  describe("sendNcAssignedEmail", () => {
    it("sends email with correct recipient and subject", async () => {
      await sendNcAssignedEmail({
        to: "user@test.com",
        ncCode: "NC-2026-001",
        ncTitle: "Falha no controle de acesso",
        severity: "major",
        tenantSlug: "empresa-teste",
        ncId: "uuid-123",
      });

      expect(mockSend).toHaveBeenCalledTimes(1);
      const call = mockSend.mock.calls[0][0];
      expect(call.to).toBe("user@test.com");
      expect(call.subject).toContain("NC-2026-001");
    });
  });

  describe("sendActionPlanDueEmail", () => {
    it("sends email with due date info", async () => {
      await sendActionPlanDueEmail({
        to: "resp@test.com",
        apCode: "AP-2026-005",
        apTitle: "Atualizar firewall",
        dueDate: "28/02/2026",
        tenantSlug: "empresa-teste",
        apId: "uuid-456",
      });

      expect(mockSend).toHaveBeenCalledTimes(1);
      const call = mockSend.mock.calls[0][0];
      expect(call.to).toBe("resp@test.com");
      expect(call.subject).toContain("AP-2026-005");
      expect(call.html).toContain("Atualizar firewall");
      expect(call.html).toContain("28/02/2026");
    });
  });

  describe("sendAuditScheduledEmail", () => {
    it("sends email with audit info", async () => {
      await sendAuditScheduledEmail({
        to: "auditor@test.com",
        auditTitle: "Auditoria ISO 27001",
        auditType: "internal",
        startDate: "01/03/2026",
        tenantSlug: "empresa-teste",
        auditId: "uuid-789",
      });

      expect(mockSend).toHaveBeenCalledTimes(1);
      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain("Auditoria ISO 27001");
    });
  });

  describe("sendNotificationEmail", () => {
    it("sends generic notification email", async () => {
      await sendNotificationEmail({
        to: "user@test.com",
        subject: "Alerta Teste",
        title: "Titulo do Alerta",
        message: "Mensagem de teste",
        ctaText: "Ver Detalhes",
        ctaUrl: "http://localhost:3000/test",
      });

      expect(mockSend).toHaveBeenCalledTimes(1);
      const call = mockSend.mock.calls[0][0];
      expect(call.subject).toContain("Alerta Teste");
      expect(call.html).toContain("Titulo do Alerta");
      expect(call.html).toContain("Ver Detalhes");
    });

    it("works without CTA", async () => {
      await sendNotificationEmail({
        to: "user@test.com",
        subject: "Alerta Simples",
        title: "Titulo",
        message: "Msg",
      });

      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe("error handling", () => {
    it("does not throw when Resend fails", async () => {
      mockSend.mockRejectedValueOnce(new Error("API error"));

      await expect(
        sendNcAssignedEmail({
          to: "user@test.com",
          ncCode: "NC-001",
          ncTitle: "Teste",
          severity: "minor",
          tenantSlug: "t",
          ncId: "id",
        })
      ).resolves.not.toThrow();
    });
  });
});
