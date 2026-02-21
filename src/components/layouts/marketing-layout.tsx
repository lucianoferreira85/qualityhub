"use client";

import Link from "next/link";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

export function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-primary">
      <nav className="flex items-center justify-between h-16 px-6 lg:px-12 border-b border-stroke-secondary">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl gradient-brand flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <span className="text-title-2 text-foreground-primary">QualityHub</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/pricing"
            className="text-body-1 text-foreground-secondary hover:text-foreground-primary transition-colors"
          >
            Preços
          </Link>
          <Link href="/login">
            <Button variant="ghost">Entrar</Button>
          </Link>
          <Link href="/signup">
            <Button>Começar grátis</Button>
          </Link>
        </div>

        <div className="md:hidden">
          <Link href="/login">
            <Button size="sm">Entrar</Button>
          </Link>
        </div>
      </nav>

      {children}

      <footer className="border-t border-stroke-secondary py-8 px-6 lg:px-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg gradient-brand flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="text-body-1 text-foreground-secondary">
              QualityHub &copy; {new Date().getFullYear()}
            </span>
          </div>
          <div className="flex items-center gap-6 text-body-2 text-foreground-tertiary">
            <Link href="/privacy" className="hover:text-foreground-secondary transition-colors">
              Privacidade
            </Link>
            <Link href="/terms" className="hover:text-foreground-secondary transition-colors">
              Termos de uso
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
