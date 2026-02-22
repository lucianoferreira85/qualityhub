"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { useTenant } from "@/hooks/use-tenant";

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  projects: "Projetos",
  clients: "Clientes",
  nonconformities: "Nao Conformidades",
  "action-plans": "Planos de Acao",
  risks: "Riscos",
  audits: "Auditorias",
  documents: "Documentos",
  processes: "Processos",
  indicators: "Indicadores",
  "management-reviews": "Analise Critica",
  settings: "Configuracoes",
  notifications: "Notificacoes",
  new: "Novo",
  edit: "Editar",
  scope: "Escopo",
  soa: "Declaracao de Aplicabilidade",
  controls: "Controles",
  "gap-analysis": "Analise de Gap",
  findings: "Constatacoes",
  members: "Membros",
  general: "Geral",
  billing: "Faturamento",
  invitations: "Convites",
};

interface BreadcrumbSegment {
  label: string;
  href: string;
}

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

export function AutoBreadcrumb() {
  const pathname = usePathname();
  const { tenant } = useTenant();
  const basePath = `/${tenant.slug}`;

  const relativePath = pathname.startsWith(basePath)
    ? pathname.slice(basePath.length)
    : pathname;

  const segments = relativePath.split("/").filter(Boolean);

  if (segments.length === 0 || (segments.length === 1 && segments[0] === "dashboard")) {
    return null;
  }

  const breadcrumbs: BreadcrumbSegment[] = [];
  let accumulated = basePath;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    accumulated += `/${seg}`;

    if (isUuid(seg)) {
      breadcrumbs.push({ label: "Detalhes", href: accumulated });
    } else {
      const label = SEGMENT_LABELS[seg] || seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " ");
      breadcrumbs.push({ label, href: accumulated });
    }
  }

  const maxVisible = 4;
  let visible = breadcrumbs;

  if (breadcrumbs.length > maxVisible) {
    visible = [
      breadcrumbs[0],
      { label: "...", href: "" },
      ...breadcrumbs.slice(breadcrumbs.length - (maxVisible - 2)),
    ];
  }

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-1.5 text-caption-1">
        <li className="flex items-center gap-1.5">
          <Link
            href={`${basePath}/dashboard`}
            className="text-foreground-tertiary hover:text-foreground-secondary transition-colors"
            aria-label="Inicio"
          >
            <Home className="h-3.5 w-3.5" />
          </Link>
        </li>

        {visible.map((item, idx) => (
          <li key={idx} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-foreground-tertiary flex-shrink-0" />
            {idx === visible.length - 1 ? (
              <span className="text-foreground-primary font-medium truncate max-w-[200px]">
                {item.label}
              </span>
            ) : item.label === "..." ? (
              <span className="text-foreground-tertiary">...</span>
            ) : (
              <Link
                href={item.href}
                className="text-foreground-tertiary hover:text-foreground-secondary transition-colors truncate max-w-[150px]"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
