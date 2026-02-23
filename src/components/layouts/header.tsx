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
    <header className="flex items-center justify-between h-14 px-4 bg-surface-primary border-b border-stroke-secondary gap-4">
      {/* Left side: hamburger (mobile) + breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {showHamburger && (
          <button
            onClick={onOpenSidebar}
            className="h-9 w-9 flex items-center justify-center rounded-button text-foreground-secondary hover:bg-surface-tertiary transition-colors flex-shrink-0 md:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <AutoBreadcrumb />
      </div>

      {/* Right side: search hint + notifications + user menu */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Search / Cmd+K hint */}
        <button
          onClick={onOpenCommandPalette}
          className="hidden sm:flex items-center gap-2 h-8 px-3 rounded-button border border-stroke-secondary text-foreground-tertiary hover:bg-surface-tertiary hover:text-foreground-secondary transition-colors text-caption-1"
          aria-label="Buscar"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Buscar...</span>
          <kbd className="ml-1 flex items-center gap-0.5 rounded border border-stroke-secondary bg-surface-tertiary px-1 py-0.5 text-[10px] font-medium">
            <span className="text-[11px]">&#8984;</span>K
          </kbd>
        </button>

        {/* Mobile search button */}
        <button
          onClick={onOpenCommandPalette}
          className="sm:hidden h-9 w-9 flex items-center justify-center rounded-button text-foreground-secondary hover:bg-surface-tertiary transition-colors"
          aria-label="Buscar"
        >
          <Search className="h-4 w-4" />
        </button>

        {/* Notifications */}
        <NotificationPopover />

        {/* User menu */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-2 h-9 px-2 rounded-button text-foreground-primary hover:bg-surface-tertiary transition-colors">
              <Avatar name={userName} size="sm" />
              <span className="text-body-2 hidden sm:block max-w-[120px] truncate">
                {userName}
              </span>
              <ChevronDown className="h-3 w-3 text-foreground-tertiary hidden sm:block" />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-50 w-52 bg-surface-primary border border-stroke-secondary rounded-card shadow-dialog animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 py-1"
              sideOffset={8}
              align="end"
            >
              {/* User info */}
              <div className="px-3 py-2.5 border-b border-stroke-secondary">
                <p className="text-body-2 font-medium text-foreground-primary truncate">
                  {userName}
                </p>
                <p className="text-caption-1 text-foreground-tertiary truncate">
                  {user?.email}
                </p>
              </div>

              <DropdownMenu.Item asChild>
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-3 py-2 text-body-2 text-foreground-secondary hover:bg-surface-tertiary transition-colors outline-none data-[highlighted]:bg-surface-tertiary"
                >
                  <User className="h-4 w-4" />
                  Meu Perfil
                </Link>
              </DropdownMenu.Item>

              <DropdownMenu.Item asChild>
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-2 w-full px-3 py-2 text-body-2 text-foreground-secondary hover:bg-surface-tertiary transition-colors outline-none cursor-pointer data-[highlighted]:bg-surface-tertiary"
                >
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  {isDark ? "Modo Claro" : "Modo Escuro"}
                </button>
              </DropdownMenu.Item>

              <DropdownMenu.Item asChild>
                <Link
                  href="/organizations"
                  className="flex items-center gap-2 px-3 py-2 text-body-2 text-foreground-secondary hover:bg-surface-tertiary transition-colors outline-none data-[highlighted]:bg-surface-tertiary"
                >
                  <Building2 className="h-4 w-4" />
                  Trocar empresa
                </Link>
              </DropdownMenu.Item>

              <DropdownMenu.Item asChild>
                <Link
                  href={`/${tenant.slug}/settings`}
                  className="flex items-center gap-2 px-3 py-2 text-body-2 text-foreground-secondary hover:bg-surface-tertiary transition-colors outline-none data-[highlighted]:bg-surface-tertiary"
                >
                  <Settings className="h-4 w-4" />
                  Configuracoes
                </Link>
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="my-1 h-px bg-stroke-secondary" />

              <DropdownMenu.Item asChild>
                <button
                  onClick={signOut}
                  className="flex items-center gap-2 w-full px-3 py-2 text-body-2 text-danger hover:bg-danger-bg transition-colors outline-none cursor-pointer data-[highlighted]:bg-danger-bg"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </button>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
