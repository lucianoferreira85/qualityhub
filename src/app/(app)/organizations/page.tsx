"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Shield, Plus, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getInitials } from "@/lib/utils";

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  role: string;
  logo: string | null;
}

export default function TenantSelectorPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    fetch("/api/user/tenants")
      .then((res) => res.json())
      .then((res) => {
        setTenants(res.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-tertiary">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-tertiary p-4">
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl gradient-brand flex items-center justify-center mb-4">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-title-1 text-foreground-primary">
            Selecione uma empresa
          </h1>
          <p className="text-body-1 text-foreground-secondary mt-1">
            Escolha a empresa que deseja acessar
          </p>
        </div>

        <div className="space-y-3">
          {tenants.map((tenant) => (
            <Link key={tenant.id} href={`/${tenant.slug}/dashboard`}>
              <Card className="cursor-pointer hover:shadow-card-glow transition-all">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="h-12 w-12 rounded-xl gradient-brand flex items-center justify-center flex-shrink-0">
                    <span className="text-body-1 text-white font-medium">
                      {getInitials(tenant.name)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-title-3 text-foreground-primary truncate">
                      {tenant.name}
                    </p>
                    <p className="text-caption-1 text-foreground-tertiary">
                      {tenant.role.replace("_", " ")}
                    </p>
                  </div>
                  <Building2 className="h-5 w-5 text-foreground-tertiary flex-shrink-0" />
                </CardContent>
              </Card>
            </Link>
          ))}

          {tenants.length === 0 && (
            <div className="text-center py-8">
              <p className="text-body-1 text-foreground-secondary mb-4">
                Você ainda não faz parte de nenhuma empresa.
              </p>
            </div>
          )}

          <Link href="/onboarding">
            <Button variant="outline" className="w-full mt-4">
              <Plus className="h-4 w-4" />
              Criar nova empresa
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
