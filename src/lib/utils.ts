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

export function getRiskLevel(probability: number, impact: number): string {
  const score = probability * impact;
  if (score >= 17) return "critical";
  if (score >= 10) return "high";
  if (score >= 5) return "medium";
  return "low";
}

export function getRiskLevelLabel(level: string): string {
  const labels: Record<string, string> = {
    low: "Baixo",
    medium: "Médio",
    high: "Alto",
    critical: "Crítico",
  };
  return labels[level] || level;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    open: "bg-danger-bg text-danger-fg",
    analyzing: "bg-warning-bg text-warning-fg",
    action_defined: "bg-info-bg text-info-fg",
    in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    verification: "bg-brand-light text-brand",
    closed: "bg-success-bg text-success-fg",
    planned: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    completed: "bg-success-bg text-success-fg",
    verified: "bg-brand-light text-brand",
    effective: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    ineffective: "bg-danger-bg text-danger-fg",
    draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    review: "bg-warning-bg text-warning-fg",
    approved: "bg-success-bg text-success-fg",
    obsolete: "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
    identified: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    assessed: "bg-warning-bg text-warning-fg",
    treating: "bg-brand-light text-brand",
    monitored: "bg-success-bg text-success-fg",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    open: "Aberta",
    analyzing: "Em Análise",
    action_defined: "Ação Definida",
    in_progress: "Em Andamento",
    verification: "Verificação",
    closed: "Fechada",
    planned: "Planejada",
    completed: "Concluída",
    verified: "Verificada",
    effective: "Eficaz",
    ineffective: "Ineficaz",
    draft: "Rascunho",
    review: "Em Revisão",
    approved: "Aprovado",
    obsolete: "Obsoleto",
    identified: "Identificado",
    assessed: "Avaliado",
    treating: "Em Tratamento",
    monitored: "Monitorado",
  };
  return labels[status] || status;
}

export function generateCode(prefix: string, sequence: number): string {
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(sequence).padStart(3, "0")}`;
}
