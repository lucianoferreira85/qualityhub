import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY || "");
  }
  return _resend;
}

const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@qualityhub.com.br";

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
