"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  CreditCard,
  Users,
  FolderKanban,
  Building2,
  BookOpen,
  Check,
  X,
} from "lucide-react";

const FEATURE_LABELS: Record<string, string> = {
  audits: "Auditorias",
  nonconformities: "Não Conformidades",
  actionPlans: "Planos de Ação",
  documents: "Documentos",
  indicators: "Indicadores",
  risks: "Gestão de Riscos",
  soa: "Declaração de Aplicabilidade",
  managementReview: "Análise Crítica",
  customReports: "Relatórios Personalizados",
  apiAccess: "Acesso via API",
};

interface UsageData {
  members: number;
  projects: number;
  clients: number;
}

export default function BillingPage() {
  const { tenant, plan } = useTenant();
  const [usage, setUsage] = useState<UsageData>({ members: 0, projects: 0, clients: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/tenants/${tenant.slug}/members`).then((r) => r.json()),
      fetch(`/api/tenants/${tenant.slug}/projects`).then((r) => r.json()),
      fetch(`/api/tenants/${tenant.slug}/clients`).then((r) => r.json()),
    ])
      .then(([memRes, projRes, cliRes]) => {
        setUsage({
          members: (memRes.data || []).length,
          projects: (projRes.data || []).length,
          clients: (cliRes.data || []).length,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenant.slug]);

  const planSlug = plan?.slug || "starter";
  const features = (plan?.features || {}) as Record<string, boolean>;

  const PLAN_LIMITS: Record<string, { users: number; projects: number; clients: number; standards: number; storage: string }> = {
    starter: { users: 3, projects: 3, clients: 3, standards: 1, storage: "2 GB" },
    professional: { users: 10, projects: 15, clients: 15, standards: 3, storage: "10 GB" },
    enterprise: { users: 999999, projects: 999999, clients: 999999, standards: 999999, storage: "Ilimitado" },
  };

  const limits = PLAN_LIMITS[planSlug] || PLAN_LIMITS.starter;
  const isUnlimited = (val: number) => val >= 999999;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/${tenant.slug}/settings`}>
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-title-1 text-foreground-primary">Faturamento</h1>
          <p className="text-body-1 text-foreground-secondary mt-1">
            Gerencie sua assinatura e veja o uso atual
          </p>
        </div>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-foreground-tertiary" />
              <h2 className="text-title-3 text-foreground-primary">Plano Atual</h2>
            </div>
            <Badge variant="bg-brand-light text-brand">
              {plan?.name || "Starter"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                icon: Users,
                label: "Usuários",
                current: usage.members,
                limit: limits.users,
                loading,
              },
              {
                icon: FolderKanban,
                label: "Projetos",
                current: usage.projects,
                limit: limits.projects,
                loading,
              },
              {
                icon: Building2,
                label: "Clientes",
                current: usage.clients,
                limit: limits.clients,
                loading,
              },
              {
                icon: BookOpen,
                label: "Normas",
                current: null,
                limit: limits.standards,
                loading: false,
              },
            ].map((item) => {
              const Icon = item.icon;
              const unlimited = isUnlimited(item.limit);
              const pct = !unlimited && item.current !== null && item.limit > 0
                ? (item.current / item.limit) * 100
                : 0;
              const isNearLimit = pct >= 80;

              return (
                <div key={item.label} className="text-center space-y-2">
                  <Icon className="h-5 w-5 text-foreground-tertiary mx-auto" />
                  <p className="text-caption-1 text-foreground-tertiary">{item.label}</p>
                  {item.loading ? (
                    <div className="h-5 w-12 bg-surface-tertiary rounded animate-pulse mx-auto" />
                  ) : (
                    <p className="text-body-1 font-medium text-foreground-primary">
                      {item.current !== null ? item.current : "—"} / {unlimited ? "∞" : item.limit}
                    </p>
                  )}
                  {!unlimited && item.current !== null && (
                    <div className="h-1.5 bg-surface-tertiary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isNearLimit ? "bg-danger-fg" : "bg-brand"
                        }`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <h2 className="text-title-3 text-foreground-primary">Funcionalidades do Plano</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.entries(FEATURE_LABELS).map(([key, label]) => {
              const enabled = features[key] === true;
              return (
                <div
                  key={key}
                  className={`flex items-center gap-2 p-2 rounded-card ${
                    enabled ? "" : "opacity-50"
                  }`}
                >
                  {enabled ? (
                    <Check className="h-4 w-4 text-success-fg flex-shrink-0" />
                  ) : (
                    <X className="h-4 w-4 text-foreground-tertiary flex-shrink-0" />
                  )}
                  <span className={`text-body-2 ${
                    enabled ? "text-foreground-primary" : "text-foreground-tertiary"
                  }`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Storage */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-body-2 text-foreground-secondary">Armazenamento</p>
              <p className="text-body-1 font-medium text-foreground-primary">
                {limits.storage}
              </p>
            </div>
            {planSlug !== "enterprise" && (
              <Link href={`/${tenant.slug}/settings/billing`}>
                <Button variant="outline" size="sm">
                  Fazer Upgrade
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
