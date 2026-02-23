"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import {
  CreditCard,
  Users,
  FolderKanban,
  Building2,
  BookOpen,
  Check,
  X,
  ExternalLink,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

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

interface SubscriptionData {
  id: string;
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
  plan: { id: string; name: string; slug: string; price: number };
}

const PLAN_PRICES: Record<string, { monthly: string; label: string }> = {
  starter: { monthly: "R$ 197", label: "Starter" },
  professional: { monthly: "R$ 497", label: "Professional" },
  enterprise: { monthly: "R$ 997", label: "Enterprise" },
};

const SUB_STATUS_LABELS: Record<string, string> = {
  trialing: "Em teste",
  active: "Ativa",
  past_due: "Pagamento pendente",
  cancelled: "Cancelada",
  canceled: "Cancelada",
  unpaid: "Não paga",
};

const SUB_STATUS_COLORS: Record<string, string> = {
  trialing: "bg-info-bg text-info-fg",
  active: "bg-success-bg text-success-fg",
  past_due: "bg-warning-bg text-warning-fg",
  cancelled: "bg-gray-200 text-gray-500",
  canceled: "bg-gray-200 text-gray-500",
  unpaid: "bg-danger-bg text-danger-fg",
};

export default function BillingPage() {
  const { tenant, plan } = useTenant();
  const searchParams = useSearchParams();
  const [usage, setUsage] = useState<UsageData>({ members: 0, projects: 0, clients: 0 });
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loadingSub, setLoadingSub] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);

  useEffect(() => {
    const status = searchParams.get("status");
    if (status === "success") {
      toast.success("Assinatura realizada com sucesso!");
    } else if (status === "cancelled") {
      toast.error("Checkout cancelado");
    }
  }, [searchParams]);

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

    fetch(`/api/tenants/${tenant.slug}/billing`)
      .then((r) => r.json())
      .then((res) => setSubscription(res.data || null))
      .catch(() => {})
      .finally(() => setLoadingSub(false));
  }, [tenant.slug]);

  const handleCheckout = async (planSlug: string) => {
    setCheckingOut(true);
    setSelectedPlan(planSlug);
    try {
      const res = await fetch(`/api/tenants/${tenant.slug}/billing/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSlug }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao iniciar checkout");
      }
      const data = await res.json();
      if (data.data?.url) {
        window.location.href = data.data.url;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao iniciar checkout";
      toast.error(message);
    } finally {
      setCheckingOut(false);
      setSelectedPlan("");
    }
  };

  const handlePortal = async () => {
    setOpeningPortal(true);
    try {
      const res = await fetch(`/api/tenants/${tenant.slug}/billing/portal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao abrir portal");
      }
      const data = await res.json();
      if (data.data?.url) {
        window.location.href = data.data.url;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao abrir portal";
      toast.error(message);
    } finally {
      setOpeningPortal(false);
    }
  };

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
      <Breadcrumb items={[
        { label: "Configurações", href: `/${tenant.slug}/settings` },
        { label: "Faturamento" },
      ]} />

      <div>
        <h1 className="text-title-1 text-foreground-primary">Faturamento</h1>
        <p className="text-body-1 text-foreground-secondary mt-1">
          Gerencie sua assinatura e veja o uso atual
        </p>
      </div>

      {/* Trial Banner */}
      {tenant.status === "trial" && (
        <Card className="border-brand bg-brand-light/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-brand flex-shrink-0" />
              <div className="flex-1">
                <p className="text-body-1 font-medium text-foreground-primary">
                  Você está no período de teste gratuito
                </p>
                <p className="text-body-2 text-foreground-secondary mt-0.5">
                  Seu trial inclui acesso ao plano Professional. Escolha um plano abaixo para continuar após o período de teste.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription Card */}
      {!loadingSub && subscription && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-foreground-tertiary" />
                <h2 className="text-title-3 text-foreground-primary">Assinatura</h2>
              </div>
              <Badge variant={SUB_STATUS_COLORS[subscription.status] || ""}>
                {SUB_STATUS_LABELS[subscription.status] || subscription.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-body-2 text-foreground-secondary">Plano</span>
              <span className="text-body-1 font-medium text-foreground-primary">
                {subscription.plan.name}
              </span>
            </div>
            {subscription.currentPeriodStart && subscription.currentPeriodEnd && (
              <div className="flex items-center justify-between">
                <span className="text-body-2 text-foreground-secondary">Período</span>
                <span className="text-body-2 text-foreground-primary">
                  {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                </span>
              </div>
            )}
            {subscription.cancelAtPeriodEnd && (
              <div className="bg-warning-bg text-warning-fg text-body-2 p-3 rounded-button">
                Sua assinatura será cancelada ao final do período atual.
              </div>
            )}
            {subscription.stripeCustomerId && (
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePortal}
                  loading={openingPortal}
                >
                  <ExternalLink className="h-4 w-4" />
                  Gerenciar Assinatura
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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

      {/* Upgrade Plans */}
      {planSlug !== "enterprise" && (
        <Card>
          <CardHeader>
            <h2 className="text-title-3 text-foreground-primary">Fazer Upgrade</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(["starter", "professional", "enterprise"] as const).map((slug) => {
                const p = PLAN_PRICES[slug];
                const isCurrent = slug === planSlug;
                return (
                  <div
                    key={slug}
                    className={`border rounded-card p-4 text-center space-y-3 ${
                      isCurrent
                        ? "border-brand bg-brand-light/30"
                        : "border-stroke-secondary hover:border-brand/50 transition-colors"
                    }`}
                  >
                    <p className="text-title-3 text-foreground-primary">{p.label}</p>
                    <p className="text-title-1 text-foreground-primary font-bold">
                      {p.monthly}
                      <span className="text-body-2 font-normal text-foreground-secondary">/mês</span>
                    </p>
                    {isCurrent ? (
                      <Badge variant="bg-brand-light text-brand">Plano atual</Badge>
                    ) : (
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => handleCheckout(slug)}
                        loading={checkingOut && selectedPlan === slug}
                        disabled={checkingOut}
                      >
                        Selecionar
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
