import { prisma } from "@/lib/prisma";
import {
  sendNcAssignedEmail,
  sendAuditScheduledEmail,
  sendDocumentReviewEmail,
  sendRiskCriticalEmail,
} from "@/lib/email";

/**
 * Creates an in-app notification and fires an email.
 * All functions are fire-and-forget — they catch errors silently.
 */

export function triggerNcAssigned({
  tenantId,
  tenantSlug,
  responsibleId,
  ncId,
  ncCode,
  ncTitle,
  severity,
}: {
  tenantId: string;
  tenantSlug: string;
  responsibleId: string;
  ncId: string;
  ncCode: string;
  ncTitle: string;
  severity: string;
}) {
  void (async () => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: responsibleId },
        select: { email: true, name: true },
      });
      if (!user) return;

      await prisma.notification.create({
        data: {
          tenantId,
          userId: responsibleId,
          type: "nc_assigned",
          title: `NC Atribuída: ${ncCode}`,
          message: `Você foi designado como responsável pela NC "${ncTitle}" (${severity}).`,
          entityType: "nonconformity",
          entityId: ncId,
        },
      });

      await sendNcAssignedEmail({
        to: user.email,
        ncCode,
        ncTitle,
        severity,
        tenantSlug,
        ncId,
      });
    } catch (err) {
      console.error("[Trigger] NC assigned failed:", err);
    }
  })();
}

export function triggerAuditScheduled({
  tenantId,
  tenantSlug,
  leadAuditorId,
  auditId,
  auditTitle,
  auditType,
  startDate,
}: {
  tenantId: string;
  tenantSlug: string;
  leadAuditorId: string;
  auditId: string;
  auditTitle: string;
  auditType: string;
  startDate: string;
}) {
  void (async () => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: leadAuditorId },
        select: { email: true },
      });
      if (!user) return;

      await prisma.notification.create({
        data: {
          tenantId,
          userId: leadAuditorId,
          type: "audit_scheduled",
          title: `Auditoria Agendada: ${auditTitle}`,
          message: `Você foi designado como auditor líder da auditoria "${auditTitle}" iniciando em ${startDate}.`,
          entityType: "audit",
          entityId: auditId,
        },
      });

      await sendAuditScheduledEmail({
        to: user.email,
        auditTitle,
        auditType,
        startDate,
        tenantSlug,
        auditId,
      });
    } catch (err) {
      console.error("[Trigger] Audit scheduled failed:", err);
    }
  })();
}

export function triggerDocumentReview({
  tenantId,
  tenantSlug,
  reviewerId,
  docId,
  docCode,
  docTitle,
}: {
  tenantId: string;
  tenantSlug: string;
  reviewerId: string;
  docId: string;
  docCode: string;
  docTitle: string;
}) {
  void (async () => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: reviewerId },
        select: { email: true },
      });
      if (!user) return;

      await prisma.notification.create({
        data: {
          tenantId,
          userId: reviewerId,
          type: "document_review",
          title: `Documento para Revisão: ${docCode}`,
          message: `O documento "${docTitle}" está aguardando sua revisão.`,
          entityType: "document",
          entityId: docId,
        },
      });

      await sendDocumentReviewEmail({
        to: user.email,
        docCode,
        docTitle,
        tenantSlug,
        docId,
      });
    } catch (err) {
      console.error("[Trigger] Document review failed:", err);
    }
  })();
}

export function triggerRiskCritical({
  tenantId,
  tenantSlug,
  riskId,
  riskCode,
  riskTitle,
  riskLevel,
}: {
  tenantId: string;
  tenantSlug: string;
  riskId: string;
  riskCode: string;
  riskTitle: string;
  riskLevel: string;
}) {
  void (async () => {
    try {
      // Notify all project_managers and tenant_admins
      const managers = await prisma.tenantMember.findMany({
        where: {
          tenantId,
          role: { in: ["tenant_admin", "project_manager"] },
        },
        include: { user: { select: { id: true, email: true } } },
      });

      for (const member of managers) {
        await prisma.notification.create({
          data: {
            tenantId,
            userId: member.user.id,
            type: "risk_critical",
            title: `Risco Crítico: ${riskCode}`,
            message: `Um risco de nível "${riskLevel}" foi identificado: "${riskTitle}".`,
            entityType: "risk",
            entityId: riskId,
          },
        });

        await sendRiskCriticalEmail({
          to: member.user.email,
          riskCode,
          riskTitle,
          riskLevel,
          tenantSlug,
          riskId,
        });
      }
    } catch (err) {
      console.error("[Trigger] Risk critical failed:", err);
    }
  })();
}
