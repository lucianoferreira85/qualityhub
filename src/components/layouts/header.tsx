"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useTenant } from "@/hooks/use-tenant";
import { useTheme } from "@/hooks/use-theme";
import {
  Bell,
  ChevronDown,
  LogOut,
  Moon,
  Sun,
  User as UserIcon,
  Building2,
} from "lucide-react";
import { getInitials } from "@/lib/utils";

export function Header() {
  const { user, signOut } = useAuth();
  const { tenant } = useTenant();
  const { isDark, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuário";

  return (
    <header className="flex items-center justify-between h-14 px-4 bg-surface-primary border-b border-stroke-secondary">
      <div className="flex items-center gap-2 text-body-1 text-foreground-secondary">
        <Building2 className="h-4 w-4" />
        <span>{tenant.name}</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="h-9 w-9 flex items-center justify-center rounded-button text-foreground-secondary hover:bg-surface-tertiary transition-colors"
          aria-label="Alternar tema"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <Link
          href={`/${tenant.slug}/notifications`}
          className="h-9 w-9 flex items-center justify-center rounded-button text-foreground-secondary hover:bg-surface-tertiary transition-colors relative"
          aria-label="Notificações"
        >
          <Bell className="h-4 w-4" />
        </Link>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 h-9 px-2 rounded-button text-foreground-primary hover:bg-surface-tertiary transition-colors"
          >
            <div className="h-7 w-7 rounded-full gradient-brand flex items-center justify-center">
              <span className="text-caption-2 text-white font-medium">
                {getInitials(userName)}
              </span>
            </div>
            <span className="text-body-2 hidden sm:block">{userName}</span>
            <ChevronDown className="h-3 w-3 text-foreground-tertiary" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-surface-primary border border-stroke-secondary rounded-button shadow-card-hover z-50 py-1">
              <div className="px-3 py-2 border-b border-stroke-secondary">
                <p className="text-body-2 font-medium text-foreground-primary truncate">
                  {userName}
                </p>
                <p className="text-caption-1 text-foreground-tertiary truncate">
                  {user?.email}
                </p>
              </div>

              <Link
                href="/organizations"
                className="flex items-center gap-2 px-3 py-2 text-body-2 text-foreground-secondary hover:bg-surface-tertiary transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                <Building2 className="h-4 w-4" />
                Trocar empresa
              </Link>

              <Link
                href={`/${tenant.slug}/settings`}
                className="flex items-center gap-2 px-3 py-2 text-body-2 text-foreground-secondary hover:bg-surface-tertiary transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                <UserIcon className="h-4 w-4" />
                Configurações
              </Link>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  signOut();
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-body-2 text-danger hover:bg-danger-bg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
