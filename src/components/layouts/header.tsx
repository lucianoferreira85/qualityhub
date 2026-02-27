"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useTenant } from "@/hooks/use-tenant";
import { useTheme } from "@/hooks/use-theme";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  ChevronDown,
  LogOut,
  Moon,
  Sun,
  Building2,
  Settings,
  Menu,
  Search,
  User,
} from "lucide-react";
import { AutoBreadcrumb } from "./auto-breadcrumb";
import { NotificationPopover } from "./notification-popover";
import { Avatar } from "@/components/ui/avatar";

interface HeaderProps {
  onOpenSidebar?: () => void;
  onOpenCommandPalette?: () => void;
  showHamburger?: boolean;
}

export function Header({ onOpenSidebar, onOpenCommandPalette, showHamburger }: HeaderProps) {
  const { user, signOut } = useAuth();
  const { tenant } = useTenant();
  const { isDark, toggleTheme } = useTheme();

  const userName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuario";

  return (
    <header className="header-refined flex items-center justify-between h-14 px-4 gap-4 flex-shrink-0">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {showHamburger && (
          <button
            onClick={onOpenSidebar}
            className="h-9 w-9 flex items-center justify-center rounded-button text-foreground-secondary hover:bg-surface-tertiary hover:text-foreground-primary transition-all duration-120 flex-shrink-0 md:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <AutoBreadcrumb />
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={onOpenCommandPalette}
          className="hidden sm:flex items-center gap-2 h-8 px-3 rounded-button bg-surface-secondary border border-stroke-secondary text-foreground-tertiary hover:bg-surface-tertiary hover:text-foreground-secondary hover:border-stroke-primary transition-all duration-150 text-caption-1"
          aria-label="Buscar"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Buscar...</span>
          <kbd className="ml-1.5 inline-flex items-center gap-0.5 rounded-badge border border-stroke-secondary bg-surface-primary px-1.5 py-0.5 text-[10px] font-medium text-foreground-tertiary">
            <span className="text-[11px]">&#8984;</span>K
          </kbd>
        </button>

        <button
          onClick={onOpenCommandPalette}
          className="sm:hidden h-9 w-9 flex items-center justify-center rounded-button text-foreground-secondary hover:bg-surface-tertiary transition-all duration-120"
          aria-label="Buscar"
        >
          <Search className="h-4 w-4" />
        </button>

        <NotificationPopover />

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-2 h-9 px-2 rounded-button text-foreground-primary hover:bg-surface-tertiary transition-all duration-120">
              <Avatar name={userName} size="sm" />
              <span className="text-body-2 hidden sm:block max-w-[120px] truncate">
                {userName}
              </span>
              <ChevronDown className="h-3 w-3 text-foreground-tertiary hidden sm:block" />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-50 w-56 bg-surface-elevated border border-stroke-secondary rounded-card shadow-dialog py-1 animate-fade-in-down"
              sideOffset={8}
              align="end"
            >
              <div className="px-3 py-2.5 border-b border-stroke-secondary">
                <p className="text-body-2 font-medium text-foreground-primary truncate">
                  {userName}
                </p>
                <p className="text-caption-1 text-foreground-tertiary truncate">
                  {user?.email}
                </p>
              </div>

              <div className="py-1">
                <DropdownMenu.Item asChild>
                  <Link
                    href="/profile"
                    className="flex items-center gap-2.5 px-3 py-2 text-body-2 text-foreground-secondary hover:bg-surface-tertiary hover:text-foreground-primary transition-all duration-120 outline-none data-[highlighted]:bg-surface-tertiary data-[highlighted]:text-foreground-primary rounded-sm mx-1"
                  >
                    <User className="h-4 w-4 text-foreground-tertiary" />
                    Meu Perfil
                  </Link>
                </DropdownMenu.Item>

                <DropdownMenu.Item asChild>
                  <button
                    onClick={toggleTheme}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-body-2 text-foreground-secondary hover:bg-surface-tertiary hover:text-foreground-primary transition-all duration-120 outline-none cursor-pointer data-[highlighted]:bg-surface-tertiary data-[highlighted]:text-foreground-primary rounded-sm mx-1"
                    style={{ width: "calc(100% - 8px)" }}
                  >
                    {isDark ? <Sun className="h-4 w-4 text-foreground-tertiary" /> : <Moon className="h-4 w-4 text-foreground-tertiary" />}
                    {isDark ? "Modo Claro" : "Modo Escuro"}
                  </button>
                </DropdownMenu.Item>

                <DropdownMenu.Item asChild>
                  <Link
                    href="/organizations"
                    className="flex items-center gap-2.5 px-3 py-2 text-body-2 text-foreground-secondary hover:bg-surface-tertiary hover:text-foreground-primary transition-all duration-120 outline-none data-[highlighted]:bg-surface-tertiary data-[highlighted]:text-foreground-primary rounded-sm mx-1"
                  >
                    <Building2 className="h-4 w-4 text-foreground-tertiary" />
                    Trocar empresa
                  </Link>
                </DropdownMenu.Item>

                <DropdownMenu.Item asChild>
                  <Link
                    href={`/${tenant.slug}/settings`}
                    className="flex items-center gap-2.5 px-3 py-2 text-body-2 text-foreground-secondary hover:bg-surface-tertiary hover:text-foreground-primary transition-all duration-120 outline-none data-[highlighted]:bg-surface-tertiary data-[highlighted]:text-foreground-primary rounded-sm mx-1"
                  >
                    <Settings className="h-4 w-4 text-foreground-tertiary" />
                    Configuracoes
                  </Link>
                </DropdownMenu.Item>
              </div>

              <DropdownMenu.Separator className="my-1 h-px bg-stroke-secondary" />

              <div className="py-1">
                <DropdownMenu.Item asChild>
                  <button
                    onClick={signOut}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-body-2 text-danger hover:bg-danger-bg transition-all duration-120 outline-none cursor-pointer data-[highlighted]:bg-danger-bg rounded-sm mx-1"
                    style={{ width: "calc(100% - 8px)" }}
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </button>
                </DropdownMenu.Item>
              </div>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
