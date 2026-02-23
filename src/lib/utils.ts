import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const parsed = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

export function formatDateShort(date: string | Date): string {
  const parsed = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  })
    .format(parsed)
    .replace(".", "")
    .replace(" de ", " ");
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function getRiskLevel(probability: number, impact: number) {
  const score = probability * impact;
  if (score >= 17) return "very_high" as const;
  if (score >= 10) return "high" as const;
  if (score >= 5) return "medium" as const;
  return "low" as const;
}

export function getRiskLevelLabel(level: string): string {
  const labels: Record<string, string> = {
    very_low: "Muito Baixo",
    low: "Baixo",
    medium: "Médio",
    high: "Alto",
    very_high: "Muito Alto",
  };
  return labels[level] || level;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    open: "bg-danger-bg text-danger-fg",
    analyzing: "bg-warning-bg text-warning-fg",
    analysis: "bg-warning-bg text-warning-fg",
    action_defined: "bg-info-bg text-info-fg",
    planning: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    in_execution: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    verification: "bg-brand-light text-brand",
    effectiveness_check: "bg-brand-light text-brand",
    closed: "bg-success-bg text-success-fg",
    planned: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    archived: "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
    completed: "bg-success-bg text-success-fg",
    verified: "bg-brand-light text-brand",
    effective: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    ineffective: "bg-danger-bg text-danger-fg",
    draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    review: "bg-warning-bg text-warning-fg",
    in_review: "bg-warning-bg text-warning-fg",
    approved: "bg-success-bg text-success-fg",
    obsolete: "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
    identified: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    assessed: "bg-warning-bg text-warning-fg",
    treating: "bg-brand-light text-brand",
    monitored: "bg-success-bg text-success-fg",
    cancelled: "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
    scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    open: "Aberta",
    analyzing: "Em Análise",
    analysis: "Em Análise",
    action_defined: "Ação Definida",
    planning: "Planejamento",
    in_progress: "Em Andamento",
    in_execution: "Em Execução",
    verification: "Verificação",
    effectiveness_check: "Verificação de Eficácia",
    closed: "Fechada",
    planned: "Planejada",
    archived: "Arquivado",
    completed: "Concluída",
    verified: "Verificada",
    effective: "Eficaz",
    ineffective: "Ineficaz",
    draft: "Rascunho",
    review: "Em Revisão",
    in_review: "Em Revisão",
    approved: "Aprovado",
    obsolete: "Obsoleto",
    identified: "Identificado",
    assessed: "Avaliado",
    treating: "Em Tratamento",
    monitored: "Monitorado",
    cancelled: "Cancelada",
    scheduled: "Agendada",
  };
  return labels[status] || status;
}

export function generateCode(prefix: string, sequence: number): string {
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(sequence).padStart(3, "0")}`;
}

export function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    observation: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    minor: "bg-warning-bg text-warning-fg",
    major: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    critical: "bg-danger-bg text-danger-fg",
  };
  return colors[severity] || "bg-gray-100 text-gray-800";
}

export function getSeverityLabel(severity: string): string {
  const labels: Record<string, string> = {
    observation: "Observação",
    minor: "Menor",
    major: "Maior",
    critical: "Crítica",
  };
  return labels[severity] || severity;
}

export function getOriginLabel(origin: string): string {
  const labels: Record<string, string> = {
    audit: "Auditoria",
    customer_complaint: "Reclamação de Cliente",
    internal: "Interna",
    supplier: "Fornecedor",
    process: "Processo",
    management_review: "Análise Crítica",
  };
  return labels[origin] || origin;
}

export function getAuditTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    internal: "Interna",
    external: "Externa",
    supplier: "Fornecedor",
    certification: "Certificação",
  };
  return labels[type] || type;
}

export function getConclusionLabel(conclusion: string): string {
  const labels: Record<string, string> = {
    conforming: "Conforme",
    minor_nc: "NC Menor",
    major_nc: "NC Maior",
  };
  return labels[conclusion] || conclusion;
}

export function getConclusionColor(conclusion: string): string {
  const colors: Record<string, string> = {
    conforming: "bg-success-bg text-success-fg",
    minor_nc: "bg-warning-bg text-warning-fg",
    major_nc: "bg-danger-bg text-danger-fg",
  };
  return colors[conclusion] || "bg-gray-100 text-gray-800";
}

export function getClassificationLabel(classification: string): string {
  const labels: Record<string, string> = {
    conformity: "Conformidade",
    observation: "Observação",
    opportunity: "Oportunidade",
    minor_nc: "NC Menor",
    major_nc: "NC Maior",
  };
  return labels[classification] || classification;
}

export function getClassificationColor(classification: string): string {
  const colors: Record<string, string> = {
    conformity: "bg-success-bg text-success-fg",
    observation: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    opportunity: "bg-info-bg text-info-fg",
    minor_nc: "bg-warning-bg text-warning-fg",
    major_nc: "bg-danger-bg text-danger-fg",
  };
  return colors[classification] || "bg-gray-100 text-gray-800";
}

export function getDocumentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    policy: "Política",
    procedure: "Procedimento",
    work_instruction: "Instrução de Trabalho",
    form: "Formulário",
    record: "Registro",
    manual: "Manual",
  };
  return labels[type] || type;
}

export function getDocumentTypeColor(type: string): string {
  const colors: Record<string, string> = {
    policy: "bg-brand-light text-brand",
    procedure: "bg-info-bg text-info-fg",
    work_instruction: "bg-warning-bg text-warning-fg",
    form: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    record: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    manual: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  };
  return colors[type] || "bg-gray-100 text-gray-800";
}

export function getProcessStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: "Ativo",
    inactive: "Inativo",
    draft: "Rascunho",
  };
  return labels[status] || status;
}

export function getProcessStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: "bg-success-bg text-success-fg",
    inactive: "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
    draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

export function getFrequencyLabel(frequency: string): string {
  const labels: Record<string, string> = {
    daily: "Diário",
    weekly: "Semanal",
    monthly: "Mensal",
    quarterly: "Trimestral",
    yearly: "Anual",
  };
  return labels[frequency] || frequency;
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    tenant_admin: "Administrador",
    project_manager: "Gerente de Projetos",
    senior_consultant: "Consultor Sênior",
    junior_consultant: "Consultor Júnior",
    internal_auditor: "Auditor Interno",
    external_auditor: "Auditor Externo",
    client_viewer: "Visualizador (Cliente)",
  };
  return labels[role] || role;
}

export function getInvitationStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "Pendente",
    accepted: "Aceito",
    expired: "Expirado",
    revoked: "Revogado",
  };
  return labels[status] || status;
}

export function getInvitationStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: "bg-warning-bg text-warning-fg",
    accepted: "bg-success-bg text-success-fg",
    expired: "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
    revoked: "bg-danger-bg text-danger-fg",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}
