import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindUnique = vi.fn();
const mockFindMany = vi.fn();
const mockCreate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: (...args: unknown[]) => mockFindUnique(...args) },
    tenantMember: { findMany: (...args: unknown[]) => mockFindMany(...args) },
    notification: { create: (...args: unknown[]) => mockCreate(...args) },
  },
}));

const mockSendNcAssigned = vi.fn().mockResolvedValue(undefined);
const mockSendAuditScheduled = vi.fn().mockResolvedValue(undefined);
const mockSendDocumentReview = vi.fn().mockResolvedValue(undefined);
const mockSendRiskCritical = vi.fn().mockResolvedValue(undefined);
const mockSendActionAssigned = vi.fn().mockResolvedValue(undefined);
const mockSendActionPlanDue = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/email", () => ({
  sendNcAssignedEmail: (...args: unknown[]) => mockSendNcAssigned(...args),
  sendAuditScheduledEmail: (...args: unknown[]) => mockSendAuditScheduled(...args),
  sendDocumentReviewEmail: (...args: unknown[]) => mockSendDocumentReview(...args),
  sendRiskCriticalEmail: (...args: unknown[]) => mockSendRiskCritical(...args),
  sendActionAssignedEmail: (...args: unknown[]) => mockSendActionAssigned(...args),
  sendActionPlanDueEmail: (...args: unknown[]) => mockSendActionPlanDue(...args),
}));

import {
  triggerNcAssigned,
  triggerAuditScheduled,
  triggerActionAssigned,
  triggerRiskCritical,
  triggerActionPlanDue,
} from "./email-triggers";

// Helper to flush fire-and-forget promises
const flush = () => new Promise((r) => setTimeout(r, 50));

describe("Email Triggers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("triggerNcAssigned", () => {
    it("creates notification and sends email", async () => {
      mockFindUnique.mockResolvedValue({ email: "user@test.com", name: "Test User" });
      mockCreate.mockResolvedValue({});

      triggerNcAssigned({
        tenantId: "t1",
        tenantSlug: "slug",
        responsibleId: "u1",
        ncId: "nc1",
        ncCode: "NC-001",
        ncTitle: "Teste NC",
        severity: "major",
      });

      await flush();

      expect(mockFindUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "u1" } })
      );
      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(mockSendNcAssigned).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "user@test.com",
          ncCode: "NC-001",
        })
      );
    });

    it("does not send when user not found", async () => {
      mockFindUnique.mockResolvedValue(null);

      triggerNcAssigned({
        tenantId: "t1",
        tenantSlug: "slug",
        responsibleId: "invalid",
        ncId: "nc1",
        ncCode: "NC-001",
        ncTitle: "Teste",
        severity: "minor",
      });

      await flush();

      expect(mockCreate).not.toHaveBeenCalled();
      expect(mockSendNcAssigned).not.toHaveBeenCalled();
    });
  });

  describe("triggerAuditScheduled", () => {
    it("creates notification and sends email", async () => {
      mockFindUnique.mockResolvedValue({ email: "auditor@test.com" });
      mockCreate.mockResolvedValue({});

      triggerAuditScheduled({
        tenantId: "t1",
        tenantSlug: "slug",
        leadAuditorId: "u2",
        auditId: "a1",
        auditTitle: "Auditoria Interna",
        auditType: "internal",
        startDate: "01/03/2026",
      });

      await flush();

      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(mockSendAuditScheduled).toHaveBeenCalledTimes(1);
    });
  });

  describe("triggerActionAssigned", () => {
    it("creates notification and sends email", async () => {
      mockFindUnique.mockResolvedValue({ email: "resp@test.com" });
      mockCreate.mockResolvedValue({});

      triggerActionAssigned({
        tenantId: "t1",
        tenantSlug: "slug",
        responsibleId: "u3",
        actionId: "ap1",
        actionCode: "AP-001",
        actionTitle: "Acao Teste",
        actionType: "corrective",
      });

      await flush();

      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(mockSendActionAssigned).toHaveBeenCalledTimes(1);
    });
  });

  describe("triggerActionPlanDue", () => {
    it("creates notification and sends email", async () => {
      mockFindUnique.mockResolvedValue({ email: "resp@test.com" });
      mockCreate.mockResolvedValue({});

      triggerActionPlanDue({
        tenantId: "t1",
        tenantSlug: "slug",
        responsibleId: "u4",
        actionId: "ap2",
        actionCode: "AP-002",
        actionTitle: "Atualizar docs",
        dueDate: "28/02/2026",
      });

      await flush();

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: "action_plan_due",
          }),
        })
      );
      expect(mockSendActionPlanDue).toHaveBeenCalledWith(
        expect.objectContaining({
          apCode: "AP-002",
          dueDate: "28/02/2026",
        })
      );
    });
  });

  describe("triggerRiskCritical", () => {
    it("sends to all managers and admins", async () => {
      mockFindMany.mockResolvedValue([
        { user: { id: "u1", email: "admin@test.com" } },
        { user: { id: "u2", email: "pm@test.com" } },
      ]);
      mockCreate.mockResolvedValue({});

      triggerRiskCritical({
        tenantId: "t1",
        tenantSlug: "slug",
        riskId: "r1",
        riskCode: "RSK-001",
        riskTitle: "Risco Critico",
        riskLevel: "critical",
      });

      await flush();

      expect(mockCreate).toHaveBeenCalledTimes(2);
      expect(mockSendRiskCritical).toHaveBeenCalledTimes(2);
    });
  });
});
