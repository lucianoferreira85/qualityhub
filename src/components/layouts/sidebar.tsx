"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  FolderKanban,
  Building2,
  AlertTriangle,
  ClipboardCheck,
  ShieldAlert,
  Search as SearchIcon,
  TrendingUp,
  Cog,
  BookOpen,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTenant } from "@/hooks/use-tenant";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  resource?: string;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Visao Geral",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Gestao",
    items: [
      { label: "Projetos", href: "/projects", icon: FolderKanban, resource: "project" },
      { label: "Clientes", href: "/clients", icon: Building2, resource: "client" },
    ],
  },
  {
    title: "Conformidade",
    items: [
      { label: "Nao Conformidades", href: "/nonconformities", icon: AlertTriangle, resource: "nonconformity" },
      { label: "Planos de Acao", href: "/action-plans", icon: ClipboardCheck, resource: "actionPlan" },
      { label: "Riscos", href: "/risks", icon: ShieldAlert, resource: "risk" },
    ],
  },
  {
    title: "Monitoramento",
    items: [
      { label: "Auditorias", href: "/audits", icon: SearchIcon, resource: "audit" },
      { label: "Indicadores", href: "/indicators", icon: TrendingUp, resource: "indicator" },
      { label: "Processos", href: "/processes", icon: Cog, resource: "process" },
      { label: "Analise Critica", href: "/management-reviews", icon: BookOpen, resource: "managementReview" },
      { label: "Documentos", href: "/documents", icon: FileText, resource: "document" },
    ],
  },
];

export interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobile?: boolean;
  onClose?: () => void;
}

export function Sidebar({ collapsed, onToggle, mobile, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { tenant, isAdmin, can } = useTenant();
  const basePath = `/${tenant.slug}`;

  const filteredSections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      if (!item.resource) return true;
      return can(item.resource as never, "read");
    }),
  })).filter((section) => section.items.length > 0);

  function handleLinkClick() {
    if (mobile && onClose) {
      onClose();
    }
  }

  const sidebarContent = (
    <aside
      className={cn(
        "flex flex-col bg-surface-primary border-r border-stroke-secondary h-full transition-all duration-200",
        mobile ? "w-[280px]" : collapsed ? "w-[48px]" : "w-[250px]"
      )}
    >
      {/* Header: Logo + Tenant Name */}
      <div
        className={cn(
          "flex items-center h-14 border-b border-stroke-secondary px-3 flex-shrink-0",
          collapsed && !mobile ? "justify-center" : "gap-3"
        )}
      >
        <div className="h-8 w-8 rounded-lg gradient-brand flex items-center justify-center flex-shrink-0">
          <Shield className="h-4 w-4 text-white" />
        </div>
        {(!collapsed || mobile) && (
          <span className="text-title-3 text-foreground-primary truncate flex-1">
            {tenant.name}
          </span>
        )}
        {mobile && (
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-button text-foreground-tertiary hover:bg-surface-tertiary transition-colors"
            aria-label="Fechar menu"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {!mobile && !collapsed && (
          <button
            onClick={onToggle}
            className="h-7 w-7 flex items-center justify-center rounded-button text-foreground-tertiary hover:bg-surface-tertiary transition-colors flex-shrink-0"
            aria-label="Recolher menu"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2" aria-label="Menu principal">
        {filteredSections.map((section, sIdx) => (
          <div key={section.title} className={cn(sIdx > 0 && "mt-2")}>
            {/* Section header */}
            {(!collapsed || mobile) && (
              <div className="px-4 py-1.5">
                <span className="text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider">
                  {section.title}
                </span>
              </div>
            )}
            {collapsed && !mobile && sIdx > 0 && (
              <hr className="mx-2 my-1 border-stroke-secondary" />
            )}

            {/* Section items */}
            {section.items.map((item) => {
              const fullHref = `${basePath}${item.href}`;
              const isActive = pathname === fullHref || pathname.startsWith(`${fullHref}/`);

              return (
                <Link
                  key={item.href}
                  href={fullHref}
                  onClick={handleLinkClick}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 mx-2 px-3 py-2 rounded-button text-body-2 transition-colors group",
                    isActive
                      ? "bg-brand-light text-brand font-medium"
                      : "text-foreground-secondary hover:bg-surface-tertiary hover:text-foreground-primary",
                    collapsed && !mobile && "justify-center px-0"
                  )}
                  title={collapsed && !mobile ? item.label : undefined}
                >
                  <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
                  {(!collapsed || mobile) && (
                    <span className="truncate flex-1">{item.label}</span>
                  )}
                  {(!collapsed || mobile) && item.badge !== undefined && item.badge > 0 && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-danger text-[10px] font-medium text-white px-1.5">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer: Settings */}
      {isAdmin && (
        <div className="border-t border-stroke-secondary py-2 flex-shrink-0">
          <Link
            href={`${basePath}/settings`}
            onClick={handleLinkClick}
            aria-current={pathname.startsWith(`${basePath}/settings`) ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 mx-2 px-3 py-2 rounded-button text-body-2 transition-colors",
              pathname.startsWith(`${basePath}/settings`)
                ? "bg-brand-light text-brand font-medium"
                : "text-foreground-secondary hover:bg-surface-tertiary hover:text-foreground-primary",
              collapsed && !mobile && "justify-center px-0"
            )}
            title={collapsed && !mobile ? "Configuracoes" : undefined}
          >
            <Settings className="h-[18px] w-[18px] flex-shrink-0" />
            {(!collapsed || mobile) && <span>Configuracoes</span>}
          </Link>
        </div>
      )}

      {/* Collapse toggle (desktop only) */}
      {!mobile && collapsed && (
        <button
          onClick={onToggle}
          className="flex items-center justify-center h-10 border-t border-stroke-secondary text-foreground-tertiary hover:text-foreground-primary transition-colors flex-shrink-0"
          aria-label="Expandir menu"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </aside>
  );

  if (mobile) {
    return sidebarContent;
  }

  return sidebarContent;
}
