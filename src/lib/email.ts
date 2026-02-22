import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY || "");
  }
  return _resend;
}

const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@qualityhub.com.br";
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function emailWrapper(title: string, content: string) {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #1a1a1a; font-size: 24px; margin: 0;">QualityHub</h1>
      </div>
      <div style="background: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 32px;">
        <h2 style="color: #1a1a1a; font-size: 20px; margin: 0 0 16px;">${title}</h2>
        ${content}
      </div>
      <p style="text-align: center; color: #8a8886; font-size: 12px; margin-top: 24px;">
        QualityHub — Sistema de Gestão da Qualidade
      </p>
    </div>
  `;
}

function ctaButton(text: string, url: string) {
  return `
    <div style="text-align: center; margin: 24px 0;">
      <a href="${url}" style="display: inline-block; background: #0078D4; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 4px; font-size: 14px; font-weight: 600;">
        ${text}
      </a>
    </div>
  `;
}

function infoRow(label: string, value: string) {
  return `
    <tr>
      <td style="padding: 6px 12px 6px 0; color: #616161; font-size: 14px; font-weight: 600;">${label}</td>
      <td style="padding: 6px 0; color: #242424; font-size: 14px;">${value}</td>
    </tr>
  `;
}

export async function sendInvitationEmail({
  to,
  inviterName,
  tenantName,
  role,
  token,
}: {
  to: string;
  inviterName: string;
  tenantName: string;
  role: string;
  token: string;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const inviteUrl = `${baseUrl}/invite/${token}`;

  const roleLabels: Record<string, string> = {
    tenant_admin: "Administrador",
    project_manager: "Gerente de Projetos",
    senior_consultant: "Consultor Senior",
    junior_consultant: "Consultor Junior",
    internal_auditor: "Auditor Interno",
    external_auditor: "Auditor Externo",
    client_viewer: "Visualizador",
  };

  const roleLabel = roleLabels[role] || role;

  try {
    await getResend().emails.send({
      from: `QualityHub <${fromEmail}>`,
      to,
      subject: `Convite para ${tenantName} — QualityHub`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #1a1a1a; font-size: 24px; margin: 0;">QualityHub</h1>
          </div>
          <div style="background: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 32px;">
            <h2 style="color: #1a1a1a; font-size: 20px; margin: 0 0 16px;">Você foi convidado!</h2>
            <p style="color: #616161; font-size: 14px; line-height: 1.6; margin: 0 0 8px;">
              <strong>${inviterName}</strong> convidou você para participar de <strong>${tenantName}</strong> como <strong>${roleLabel}</strong>.
            </p>
            <p style="color: #616161; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
              Clique no botão abaixo para aceitar o convite e criar sua conta (ou fazer login).
            </p>
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${inviteUrl}" style="display: inline-block; background: #0078D4; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 4px; font-size: 14px; font-weight: 600;">
                Aceitar Convite
              </a>
            </div>
            <p style="color: #8a8886; font-size: 12px; line-height: 1.5; margin: 0;">
              Este convite expira em 7 dias. Se você não esperava este email, pode ignorá-lo com segurança.
            </p>
          </div>
          <p style="text-align: center; color: #8a8886; font-size: 12px; margin-top: 24px;">
            QualityHub — Sistema de Gestão da Qualidade
          </p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("[Email] Failed to send invitation:", error);
    return { success: false, error };
  }
}

// ==================== NC Assigned ====================

export async function sendNcAssignedEmail({
  to,
  ncCode,
  ncTitle,
  severity,
  tenantSlug,
  ncId,
}: {
  to: string;
  ncCode: string;
  ncTitle: string;
  severity: string;
  tenantSlug: string;
  ncId: string;
}) {
  const sevLabels: Record<string, string> = { minor: "Menor", major: "Maior", critical: "Crítica" };
  const url = `${baseUrl}/${tenantSlug}/nonconformities/${ncId}`;
  try {
    await getResend().emails.send({
      from: `QualityHub <${fromEmail}>`,
      to,
      subject: `NC Atribuída: ${ncCode} — QualityHub`,
      html: emailWrapper(
        "Não Conformidade Atribuída",
        `<p style="color: #616161; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
          Você foi designado como responsável pela seguinte não conformidade:
        </p>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
          ${infoRow("Código", ncCode)}
          ${infoRow("Título", ncTitle)}
          ${infoRow("Severidade", sevLabels[severity] || severity)}
        </table>
        ${ctaButton("Ver Não Conformidade", url)}`
      ),
    });
    return { success: true };
  } catch (error) {
    console.error("[Email] Failed to send NC assigned:", error);
    return { success: false, error };
  }
}

// ==================== Action Plan Due ====================

export async function sendActionPlanDueEmail({
  to,
  apCode,
  apTitle,
  dueDate,
  tenantSlug,
  apId,
}: {
  to: string;
  apCode: string;
  apTitle: string;
  dueDate: string;
  tenantSlug: string;
  apId: string;
}) {
  const url = `${baseUrl}/${tenantSlug}/action-plans/${apId}`;
  try {
    await getResend().emails.send({
      from: `QualityHub <${fromEmail}>`,
      to,
      subject: `Plano de Ação Vencendo: ${apCode} — QualityHub`,
      html: emailWrapper(
        "Plano de Ação Próximo do Vencimento",
        `<p style="color: #616161; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
          O seguinte plano de ação está próximo da data de vencimento:
        </p>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
          ${infoRow("Código", apCode)}
          ${infoRow("Título", apTitle)}
          ${infoRow("Prazo", dueDate)}
        </table>
        ${ctaButton("Ver Plano de Ação", url)}`
      ),
    });
    return { success: true };
  } catch (error) {
    console.error("[Email] Failed to send AP due:", error);
    return { success: false, error };
  }
}

// ==================== Audit Scheduled ====================

export async function sendAuditScheduledEmail({
  to,
  auditTitle,
  auditType,
  startDate,
  tenantSlug,
  auditId,
}: {
  to: string;
  auditTitle: string;
  auditType: string;
  startDate: string;
  tenantSlug: string;
  auditId: string;
}) {
  const typeLabels: Record<string, string> = { internal: "Interna", external: "Externa", supplier: "Fornecedor" };
  const url = `${baseUrl}/${tenantSlug}/audits/${auditId}`;
  try {
    await getResend().emails.send({
      from: `QualityHub <${fromEmail}>`,
      to,
      subject: `Auditoria Agendada: ${auditTitle} — QualityHub`,
      html: emailWrapper(
        "Nova Auditoria Agendada",
        `<p style="color: #616161; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
          Você foi designado como auditor líder da seguinte auditoria:
        </p>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
          ${infoRow("Título", auditTitle)}
          ${infoRow("Tipo", typeLabels[auditType] || auditType)}
          ${infoRow("Data Início", startDate)}
        </table>
        ${ctaButton("Ver Auditoria", url)}`
      ),
    });
    return { success: true };
  } catch (error) {
    console.error("[Email] Failed to send audit scheduled:", error);
    return { success: false, error };
  }
}

// ==================== Document Review ====================

export async function sendDocumentReviewEmail({
  to,
  docCode,
  docTitle,
  tenantSlug,
  docId,
}: {
  to: string;
  docCode: string;
  docTitle: string;
  tenantSlug: string;
  docId: string;
}) {
  const url = `${baseUrl}/${tenantSlug}/documents/${docId}`;
  try {
    await getResend().emails.send({
      from: `QualityHub <${fromEmail}>`,
      to,
      subject: `Documento para Revisão: ${docCode} — QualityHub`,
      html: emailWrapper(
        "Documento Aguardando Revisão",
        `<p style="color: #616161; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
          O seguinte documento foi encaminhado para sua revisão:
        </p>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
          ${infoRow("Código", docCode)}
          ${infoRow("Título", docTitle)}
        </table>
        ${ctaButton("Revisar Documento", url)}`
      ),
    });
    return { success: true };
  } catch (error) {
    console.error("[Email] Failed to send document review:", error);
    return { success: false, error };
  }
}

// ==================== Risk Critical ====================

export async function sendRiskCriticalEmail({
  to,
  riskCode,
  riskTitle,
  riskLevel,
  tenantSlug,
  riskId,
}: {
  to: string;
  riskCode: string;
  riskTitle: string;
  riskLevel: string;
  tenantSlug: string;
  riskId: string;
}) {
  const url = `${baseUrl}/${tenantSlug}/risks/${riskId}`;
  try {
    await getResend().emails.send({
      from: `QualityHub <${fromEmail}>`,
      to,
      subject: `⚠ Risco Crítico Identificado: ${riskCode} — QualityHub`,
      html: emailWrapper(
        "Risco Crítico Identificado",
        `<p style="color: #616161; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
          Um novo risco de nível <strong style="color: #c4314b;">${riskLevel}</strong> foi identificado:
        </p>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
          ${infoRow("Código", riskCode)}
          ${infoRow("Título", riskTitle)}
          ${infoRow("Nível", riskLevel.toUpperCase())}
        </table>
        ${ctaButton("Ver Risco", url)}`
      ),
    });
    return { success: true };
  } catch (error) {
    console.error("[Email] Failed to send risk critical:", error);
    return { success: false, error };
  }
}

// ==================== Generic Notification ====================

export async function sendNotificationEmail({
  to,
  subject,
  title,
  message,
  ctaText,
  ctaUrl,
}: {
  to: string;
  subject: string;
  title: string;
  message: string;
  ctaText?: string;
  ctaUrl?: string;
}) {
  try {
    await getResend().emails.send({
      from: `QualityHub <${fromEmail}>`,
      to,
      subject: `${subject} — QualityHub`,
      html: emailWrapper(
        title,
        `<p style="color: #616161; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
          ${message}
        </p>
        ${ctaText && ctaUrl ? ctaButton(ctaText, ctaUrl) : ""}`
      ),
    });
    return { success: true };
  } catch (error) {
    console.error("[Email] Failed to send notification:", error);
    return { success: false, error };
  }
}
