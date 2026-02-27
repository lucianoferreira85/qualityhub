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
        "flex flex-col h-full sidebar-gradient transition-all duration-250 ease-spring relative",
        "shadow-sidebar",
        mobile ? "w-[280px]" : collapsed ? "w-[56px]" : "w-[260px]"
      )}
    >
      <div
        className={cn(
          "flex items-center h-14 px-3 flex-shrink-0",
          "border-b border-sidebar-border",
          collapsed && !mobile ? "justify-center" : "gap-3"
        )}
      >
        <div className="h-8 w-8 rounded-lg gradient-brand flex items-center justify-center flex-shrink-0 shadow-sidebar-glow">
          <Shield className="h-4 w-4 text-white" />
        </div>
        {(!collapsed || mobile) && (
          <span className="text-title-3 text-sidebar-fg-active truncate flex-1 tracking-tight-1">
            {tenant.name}
          </span>
        )}
        {mobile && (
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-button text-sidebar-fg-muted hover:text-sidebar-fg-active hover:bg-sidebar-hover transition-all duration-120"
            aria-label="Fechar menu"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {!mobile && !collapsed && (
          <button
            onClick={onToggle}
            className="h-7 w-7 flex items-center justify-center rounded-button text-sidebar-fg-muted hover:text-sidebar-fg-active hover:bg-sidebar-hover transition-all duration-120 flex-shrink-0"
            aria-label="Recolher menu"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2" aria-label="Menu principal">
        {filteredSections.map((section, sIdx) => (
          <div key={section.title} className={cn(sIdx > 0 && "mt-4")}>
            {(!collapsed || mobile) && (
              <div className="px-2 pb-1.5">
                <span className="sidebar-section-title">
                  {section.title}
                </span>
              </div>
            )}
            {collapsed && !mobile && sIdx > 0 && (
              <hr className="mx-1.5 my-2 sidebar-divider" />
            )}

            <div className="space-y-0.5">
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
                      "sidebar-nav-item flex items-center gap-2.5 px-2.5 py-[7px] rounded-button text-body-2",
                      isActive && "sidebar-nav-item-active font-medium",
                      collapsed && !mobile && "justify-center px-0"
                    )}
                    title={collapsed && !mobile ? item.label : undefined}
                  >
                    <item.icon
                      className={cn(
                        "h-[18px] w-[18px] flex-shrink-0 sidebar-icon",
                        isActive && "!text-sidebar-accent"
                      )}
                    />
                    {(!collapsed || mobile) && (
                      <span className="truncate flex-1">{item.label}</span>
                    )}
                    {(!collapsed || mobile) && item.badge !== undefined && item.badge > 0 && (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-danger text-[10px] font-semibold text-white px-1.5">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {isAdmin && (
        <div className="border-t border-sidebar-border py-2 px-2 flex-shrink-0">
          <Link
            href={`${basePath}/settings`}
            onClick={handleLinkClick}
            aria-current={pathname.startsWith(`${basePath}/settings`) ? "page" : undefined}
            className={cn(
              "sidebar-nav-item flex items-center gap-2.5 px-2.5 py-[7px] rounded-button text-body-2",
              pathname.startsWith(`${basePath}/settings`) && "sidebar-nav-item-active font-medium",
              collapsed && !mobile && "justify-center px-0"
            )}
            title={collapsed && !mobile ? "Configuracoes" : undefined}
          >
            <Settings className={cn(
              "h-[18px] w-[18px] flex-shrink-0 sidebar-icon",
              pathname.startsWith(`${basePath}/settings`) && "!text-sidebar-accent"
            )} />
            {(!collapsed || mobile) && <span>Configuracoes</span>}
          </Link>
        </div>
      )}

      {!mobile && collapsed && (
        <button
          onClick={onToggle}
          className="flex items-center justify-center h-10 border-t border-sidebar-border text-sidebar-fg-muted hover:text-sidebar-fg-active hover:bg-sidebar-hover transition-all duration-120 flex-shrink-0"
          aria-label="Expandir menu"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </aside>
  );

  return sidebarContent;
}
