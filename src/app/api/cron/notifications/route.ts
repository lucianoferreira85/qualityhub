export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { prisma } from "@/lib/prisma";
import { sendActionPlanDueEmail, sendNotificationEmail } from "@/lib/email";
import { formatDate } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const threeDaysFromNow = new Date(today);
  threeDaysFromNow.setDate(today.getDate() + 3);

  let actionsDue = 0;
  let ncsOverdue = 0;
  let auditsUpcoming = 0;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    // 1. Action Plans due in next 3 days
    const duePlans = await prisma.actionPlan.findMany({
      where: {
        status: { notIn: ["completed", "verified", "effective", "ineffective"] },
        dueDate: { gte: today, lte: threeDaysFromNow },
        responsibleId: { not: null },
      },
      include: {
        responsible: { select: { id: true, email: true } },
        tenant: { select: { id: true, slug: true } },
      },
    });

    for (const ap of duePlans) {
      if (!ap.responsible || !ap.tenant) continue;

      const existing = await prisma.notification.findFirst({
        where: {
          entityId: ap.id,
          type: "action_plan_due",
          createdAt: { gte: today },
        },
      });
      if (existing) continue;

      await prisma.notification.create({
        data: {
          tenantId: ap.tenant.id,
          userId: ap.responsible.id,
          type: "action_plan_due",
          title: `Ação Vencendo: ${ap.code}`,
          message: `O plano de ação "${ap.title}" vence em ${ap.dueDate ? formatDate(ap.dueDate) : "breve"}.`,
          entityType: "actionPlan",
          entityId: ap.id,
        },
      });

      await sendActionPlanDueEmail({
        to: ap.responsible.email,
        apCode: ap.code,
        apTitle: ap.title,
        dueDate: ap.dueDate ? formatDate(ap.dueDate) : "—",
        tenantSlug: ap.tenant.slug,
        apId: ap.id,
      }).catch((err) => console.error("[Cron] Email failed for AP:", ap.code, err));

      actionsDue++;
    }

    // 2. Overdue NCs
    const overdueNcs = await prisma.nonconformity.findMany({
      where: {
        status: { notIn: ["closed"] },
        dueDate: { lt: today },
        responsibleId: { not: null },
      },
      include: {
        responsible: { select: { id: true, email: true } },
        tenant: { select: { id: true, slug: true } },
      },
    });

    for (const nc of overdueNcs) {
      if (!nc.responsible || !nc.tenant) continue;

      const existing = await prisma.notification.findFirst({
        where: {
          entityId: nc.id,
          type: "nc_overdue",
          createdAt: { gte: today },
        },
      });
      if (existing) continue;

      await prisma.notification.create({
        data: {
          tenantId: nc.tenant.id,
          userId: nc.responsible.id,
          type: "nc_overdue",
          title: `NC Vencida: ${nc.code}`,
          message: `A não conformidade "${nc.title}" está vencida desde ${nc.dueDate ? formatDate(nc.dueDate) : "—"}.`,
          entityType: "nonconformity",
          entityId: nc.id,
        },
      });

      await sendNotificationEmail({
        to: nc.responsible.email,
        subject: `NC Vencida: ${nc.code}`,
        title: "Não Conformidade Vencida",
        message: `A não conformidade "${nc.title}" (${nc.code}) está vencida desde ${nc.dueDate ? formatDate(nc.dueDate) : "—"}.`,
        ctaText: "Ver NC",
        ctaUrl: `${baseUrl}/${nc.tenant.slug}/nonconformities/${nc.id}`,
      }).catch((err) => console.error("[Cron] Email failed for NC:", nc.code, err));

      ncsOverdue++;
    }

    // 3. Upcoming audits (next 3 days)
    const upcomingAudits = await prisma.audit.findMany({
      where: {
        status: "planned",
        startDate: { gte: today, lte: threeDaysFromNow },
        leadAuditorId: { not: null },
      },
      include: {
        leadAuditor: { select: { id: true, email: true } },
        tenant: { select: { id: true, slug: true } },
      },
    });

    for (const audit of upcomingAudits) {
      if (!audit.leadAuditor || !audit.tenant) continue;

      const existing = await prisma.notification.findFirst({
        where: {
          entityId: audit.id,
          type: "audit_upcoming",
          createdAt: { gte: today },
        },
      });
      if (existing) continue;

      await prisma.notification.create({
        data: {
          tenantId: audit.tenant.id,
          userId: audit.leadAuditor.id,
          type: "audit_upcoming",
          title: `Auditoria Próxima: ${audit.title}`,
          message: `A auditoria "${audit.title}" inicia em ${formatDate(audit.startDate)}.`,
          entityType: "audit",
          entityId: audit.id,
        },
      });

      await sendNotificationEmail({
        to: audit.leadAuditor.email,
        subject: `Auditoria Próxima: ${audit.title}`,
        title: "Auditoria se Aproximando",
        message: `A auditoria "${audit.title}" está agendada para ${formatDate(audit.startDate)}.`,
        ctaText: "Ver Auditoria",
        ctaUrl: `${baseUrl}/${audit.tenant.slug}/audits/${audit.id}`,
      }).catch((err) => console.error("[Cron] Email failed for audit:", audit.title, err));

      auditsUpcoming++;
    }
  } catch (err) {
    console.error("[Cron] Notification job failed:", err);
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    processed: { actionsDue, ncsOverdue, auditsUpcoming },
    timestamp: now.toISOString(),
  });
}
