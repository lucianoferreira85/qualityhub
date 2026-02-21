"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  BookOpen,
  Shield,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Tenants", href: "/admin/tenants", icon: Building2 },
  { label: "Planos", href: "/admin/plans", icon: CreditCard },
  { label: "Normas", href: "/admin/standards", icon: BookOpen },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    fetch("/api/user")
      .then((res) => res.json())
      .then((data) => {
        if (data.data?.isSuperAdmin) {
          setAuthorized(true);
        } else {
          router.push("/organizations");
        }
      })
      .catch(() => router.push("/organizations"))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  if (authLoading || loading || !authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-tertiary">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-tertiary">
      <aside className="w-[250px] bg-surface-primary border-r border-stroke-secondary flex flex-col">
        <div className="flex items-center gap-3 h-14 px-4 border-b border-stroke-secondary">
          <div className="h-8 w-8 rounded-lg bg-danger flex items-center justify-center">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <span className="text-title-3 text-foreground-primary">
            Super Admin
          </span>
        </div>

        <nav className="flex-1 py-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 mx-2 px-3 py-2.5 rounded-button text-body-1 transition-colors",
                  isActive
                    ? "bg-danger-bg text-danger font-medium"
                    : "text-foreground-secondary hover:bg-surface-tertiary"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-stroke-secondary p-2">
          <Link
            href="/organizations"
            className="flex items-center gap-3 px-3 py-2.5 rounded-button text-body-1 text-foreground-secondary hover:bg-surface-tertiary transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Voltar ao app
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
