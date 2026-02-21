"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/layouts/app-shell";
import {
  TenantProvider,
  createTenantContextValue,
  type TenantContextValue,
} from "@/contexts/tenant-context";

export default function TenantLayout({ children }: { children: ReactNode }) {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tenantCtx, setTenantCtx] = useState<TenantContextValue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    fetch(`/api/tenants/${tenantSlug}`)
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 403 || res.status === 404) {
            router.push("/organizations");
            return;
          }
          throw new Error("Erro ao carregar empresa");
        }
        const data = await res.json();
        const ctx = createTenantContextValue(
          data.data.tenant,
          data.data.membership,
          data.data.plan
        );
        setTenantCtx(ctx);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [tenantSlug, user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-tertiary">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  if (error || !tenantCtx) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-tertiary">
        <div className="text-center">
          <p className="text-title-3 text-foreground-primary mb-2">
            Erro ao carregar
          </p>
          <p className="text-body-1 text-foreground-secondary">
            {error || "Empresa não encontrada"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <TenantProvider value={tenantCtx}>
      <AppShell>{children}</AppShell>
    </TenantProvider>
  );
}
