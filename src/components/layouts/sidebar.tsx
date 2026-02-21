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
  FileText,
  TrendingUp,
  Cog,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTenant } from "@/hooks/use-tenant";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  resource?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projetos", href: "/projects", icon: FolderKanban, resource: "project" },
  { label: "Clientes", href: "/clients", icon: Building2, resource: "client" },
  { label: "Não Conformidades", href: "/nonconformities", icon: AlertTriangle, resource: "nonconformity" },
  { label: "Planos de Ação", href: "/action-plans", icon: ClipboardCheck, resource: "actionPlan" },
  { label: "Riscos", href: "/risks", icon: ShieldAlert, resource: "risk" },
  { label: "Auditorias", href: "/audits", icon: SearchIcon, resource: "audit" },
  { label: "Documentos", href: "/documents", icon: FileText, resource: "document" },
  { label: "Processos", href: "/processes", icon: Cog, resource: "process" },
  { label: "Indicadores", href: "/indicators", icon: TrendingUp, resource: "indicator" },
  { label: "Análise Crítica", href: "/management-reviews", icon: BookOpen, resource: "managementReview" },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { tenant, isAdmin, can } = useTenant();
  const basePath = `/${tenant.slug}`;

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.resource) return true;
    return can(item.resource as never, "read");
  });

  return (
    <aside
      className={cn(
        "flex flex-col bg-surface-primary border-r border-stroke-secondary transition-all duration-200 h-full",
        collapsed ? "w-[48px]" : "w-[250px]"
      )}
    >
      <div
        className={cn(
          "flex items-center h-14 border-b border-stroke-secondary px-3",
          collapsed ? "justify-center" : "gap-3"
        )}
      >
        <div className="h-8 w-8 rounded-lg gradient-brand flex items-center justify-center flex-shrink-0">
          <Shield className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <span className="text-title-3 text-foreground-primary truncate">
            {tenant.name}
          </span>
        )}
      </div>

      <nav className="flex-1 py-2 overflow-y-auto">
        {visibleItems.map((item) => {
          const fullHref = `${basePath}${item.href}`;
          const isActive =
            pathname === fullHref || pathname.startsWith(`${fullHref}/`);

          return (
            <Link
              key={item.href}
              href={fullHref}
              className={cn(
                "flex items-center gap-3 mx-2 px-3 py-2.5 rounded-button text-body-1 transition-colors",
                isActive
                  ? "bg-brand-light text-brand font-medium"
                  : "text-foreground-secondary hover:bg-surface-tertiary hover:text-foreground-primary",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {isAdmin && (
        <div className="border-t border-stroke-secondary py-2">
          <Link
            href={`${basePath}/settings`}
            className={cn(
              "flex items-center gap-3 mx-2 px-3 py-2.5 rounded-button text-body-1 transition-colors",
              pathname.startsWith(`${basePath}/settings`)
                ? "bg-brand-light text-brand font-medium"
                : "text-foreground-secondary hover:bg-surface-tertiary hover:text-foreground-primary",
              collapsed && "justify-center px-0"
            )}
            title={collapsed ? "Configurações" : undefined}
          >
            <Settings className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>Configurações</span>}
          </Link>
        </div>
      )}

      <button
        onClick={onToggle}
        className="flex items-center justify-center h-10 border-t border-stroke-secondary text-foreground-tertiary hover:text-foreground-primary transition-colors"
        aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>
    </aside>
  );
}
