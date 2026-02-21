"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Search,
  Users,
  CreditCard,
  Calendar,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  cnpj: string | null;
  trialEndsAt: string | null;
  createdAt: string;
  subscription: {
    id: string;
    status: string;
    currentPeriodEnd: string | null;
    plan: { id: string; name: string; slug: string };
  } | null;
  _count: { members: number };
}

function getTenantStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: "bg-success-bg text-success-fg",
    trial: "bg-warning-bg text-warning-fg",
    suspended: "bg-danger-bg text-danger-fg",
    cancelled: "bg-gray-200 text-gray-500",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

function getTenantStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: "Ativo",
    trial: "Trial",
    suspended: "Suspenso",
    cancelled: "Cancelado",
  };
  return labels[status] || status;
}

function getSubStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: "bg-success-bg text-success-fg",
    trialing: "bg-warning-bg text-warning-fg",
    past_due: "bg-danger-bg text-danger-fg",
    canceled: "bg-gray-200 text-gray-500",
    unpaid: "bg-danger-bg text-danger-fg",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

function getSubStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: "Ativa",
    trialing: "Trial",
    past_due: "Vencida",
    canceled: "Cancelada",
    unpaid: "Não Paga",
  };
  return labels[status] || status;
}

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/tenants")
      .then((res) => res.json())
      .then((res) => setTenants(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase()) ||
      (t.cnpj && t.cnpj.includes(search))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-title-1 text-foreground-primary">Tenants</h1>
        <p className="text-body-1 text-foreground-secondary mt-1">
          Gerenciar empresas da plataforma
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-tertiary" />
        <Input
          placeholder="Buscar por nome, slug ou CNPJ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-surface-primary rounded-card animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-8 w-8 text-foreground-tertiary mx-auto mb-2" />
            <p className="text-body-2 text-foreground-secondary">
              {search ? "Nenhum tenant encontrado" : "Nenhum tenant cadastrado"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => (
            <Card key={t.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-brand-light flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-6 w-6 text-brand" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-body-1 font-medium text-foreground-primary truncate">
                        {t.name}
                      </h3>
                      <Badge variant={getTenantStatusColor(t.status)}>
                        {getTenantStatusLabel(t.status)}
                      </Badge>
                    </div>
                    <p className="text-caption-1 text-foreground-tertiary font-mono">
                      /{t.slug}
                      {t.cnpj && <span className="ml-3 font-sans">{t.cnpj}</span>}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 mt-3">
                      <div className="flex items-center gap-1.5 text-caption-1 text-foreground-secondary">
                        <Users className="h-3.5 w-3.5" />
                        <span>{t._count.members} membro{t._count.members !== 1 ? "s" : ""}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-caption-1 text-foreground-secondary">
                        <CreditCard className="h-3.5 w-3.5" />
                        <span>{t.subscription?.plan?.name || "Sem plano"}</span>
                        {t.subscription && (
                          <Badge variant={getSubStatusColor(t.subscription.status)}>
                            {getSubStatusLabel(t.subscription.status)}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-caption-1 text-foreground-tertiary">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Criado em {formatDate(t.createdAt)}</span>
                      </div>

                      {t.status === "trial" && t.trialEndsAt && (
                        <span className="text-caption-1 text-warning">
                          Trial expira em {formatDate(t.trialEndsAt)}
                        </span>
                      )}

                      {t.subscription?.currentPeriodEnd && (
                        <span className="text-caption-1 text-foreground-tertiary">
                          Renova em {formatDate(t.subscription.currentPeriodEnd)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-caption-1 text-foreground-tertiary text-center">
        {filtered.length} de {tenants.length} tenant{tenants.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
