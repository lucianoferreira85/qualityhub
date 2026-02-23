"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Home } from "lucide-react";
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
  activity: "Atividade",
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
  context: "Contexto",
  "interested-parties": "Partes Interessadas",
  objectives: "Objetivos",
  policies: "Politicas",
  competences: "Competencias",
  awareness: "Conscientizacao",
  "communication-plan": "Comunicacao",
  improvements: "Melhorias",
  incidents: "Incidentes",
  assets: "Ativos",
  suppliers: "Fornecedores",
  changes: "Mudancas",
  requirements: "Requisitos",
};

const ENTITY_API_MAP: Record<string, string> = {
  projects: "name",
  nonconformities: "code",
  "action-plans": "title",
  risks: "title",
  audits: "title",
  documents: "title",
  processes: "name",
  indicators: "name",
  clients: "name",
  "management-reviews": "title",
};

const MAX_CACHE_ENTRIES = 50;

interface BreadcrumbSegment {
  label: string;
  href: string;
  isEntity?: boolean;
  entityKey?: string;
}

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

export function AutoBreadcrumb() {
  const pathname = usePathname();
  const { tenant } = useTenant();
  const basePath = `/${tenant.slug}`;
  const [entityNames, setEntityNames] = useState<Record<string, string>>({});
  const cacheKeysRef = useRef<string[]>([]);

  const setCachedName = useCallback((key: string, name: string) => {
    setEntityNames((prev) => {
      const next = { ...prev, [key]: name };
      const keys = cacheKeysRef.current;
      const idx = keys.indexOf(key);
      if (idx !== -1) keys.splice(idx, 1);
      keys.push(key);
      while (keys.length > MAX_CACHE_ENTRIES) {
        const oldest = keys.shift()!;
        delete next[oldest];
      }
      return next;
    });
  }, []);

  const relativePath = pathname.startsWith(basePath)
    ? pathname.slice(basePath.length)
    : pathname;

  const segments = relativePath.split("/").filter(Boolean);

  useEffect(() => {
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (!isUuid(seg)) continue;

      const entityType = segments[i - 1];
      if (!entityType || !ENTITY_API_MAP[entityType]) continue;

      const cacheKey = `${entityType}:${seg}`;
      if (entityNames[cacheKey]) continue;

      const field = ENTITY_API_MAP[entityType];
      fetch(`/api/tenants/${tenant.slug}/${entityType}/${seg}`)
        .then((res) => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then((json) => {
          const name = json?.data?.[field];
          if (name) setCachedName(cacheKey, name);
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, tenant.slug]);

  if (segments.length === 0 || (segments.length === 1 && segments[0] === "dashboard")) {
    return null;
  }

  const breadcrumbs: BreadcrumbSegment[] = [];
  let accumulated = basePath;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    accumulated += `/${seg}`;

    if (isUuid(seg)) {
      const entityType = segments[i - 1];
      const cacheKey = `${entityType}:${seg}`;
      const resolvedName = entityNames[cacheKey];
      breadcrumbs.push({
        label: resolvedName || "Detalhes",
        href: accumulated,
        isEntity: true,
        entityKey: cacheKey,
      });
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

  const lastBreadcrumb = breadcrumbs[breadcrumbs.length - 1];
  const parentHref = breadcrumbs.length >= 2 ? breadcrumbs[breadcrumbs.length - 2].href : `${basePath}/dashboard`;

  return (
    <nav aria-label="Breadcrumb">
      {/* Mobile: back arrow + last segment */}
      <div className="flex items-center gap-1.5 sm:hidden text-caption-1">
        <Link
          href={parentHref}
          className="text-foreground-tertiary hover:text-foreground-secondary transition-colors"
          aria-label="Voltar"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <span className="text-foreground-primary font-medium truncate max-w-[250px]">
          {lastBreadcrumb.label}
        </span>
      </div>

      {/* Desktop: full breadcrumb */}
      <ol className="hidden sm:flex items-center gap-1.5 text-caption-1">
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
