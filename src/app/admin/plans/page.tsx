"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Users,
  FolderKanban,
  Building2,
  BookOpen,
  HardDrive,
  Check,
  X,
} from "lucide-react";

const FEATURE_LABELS: Record<string, string> = {
  audits: "Auditorias",
  nonconformities: "Nao Conformidades",
  actionPlans: "Planos de Acao",
  documents: "Documentos",
  indicators: "Indicadores",
  risks: "Gestao de Riscos",
  soa: "Declaracao de Aplicabilidade",
  managementReview: "Analise Critica",
  customReports: "Relatorios Personalizados",
  apiAccess: "Acesso via API",
};

interface Plan {
  id: string;
  name: string;
  slug: string;
  price: string;
  maxUsers: number;
  maxProjects: number;
  maxStandards: number;
  maxStorage: number;
  maxClients: number;
  features: Record<string, boolean>;
  isActive: boolean;
  _count: { subscriptions: number };
}

function formatStorage(mb: number): string {
  if (mb >= 999999) return "Ilimitado";
  if (mb >= 1024) return `${(mb / 1024).toFixed(0)} GB`;
  return `${mb} MB`;
}

function formatLimit(val: number): string {
  return val >= 999999 ? "Ilimitado" : String(val);
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/plans")
      .then((res) => res.json())
      .then((res) => setPlans(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-title-1 text-foreground-primary">Planos</h1>
        <p className="text-body-1 text-foreground-secondary mt-1">
          Planos disponíveis na plataforma
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-80 bg-surface-primary rounded-card animate-pulse" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="h-8 w-8 text-foreground-tertiary mx-auto mb-2" />
            <p className="text-body-2 text-foreground-secondary">
              Nenhum plano cadastrado
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <Card key={plan.id} className={!plan.isActive ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-title-3 text-foreground-primary">{plan.name}</h2>
                    <p className="text-caption-1 text-foreground-tertiary font-mono">
                      {plan.slug}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-title-2 text-foreground-primary">
                      R$ {Number(plan.price).toFixed(2).replace(".", ",")}
                    </p>
                    <p className="text-caption-1 text-foreground-tertiary">/mes</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={plan.isActive ? "bg-success-bg text-success-fg" : "bg-gray-200 text-gray-500"}>
                    {plan.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                  <Badge variant="bg-brand-light text-brand">
                    {plan._count.subscriptions} assinante{plan._count.subscriptions !== 1 ? "s" : ""}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-caption-1 font-medium text-foreground-tertiary uppercase tracking-wide">
                    Limites
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: Users, label: "Usuarios", value: formatLimit(plan.maxUsers) },
                      { icon: FolderKanban, label: "Projetos", value: formatLimit(plan.maxProjects) },
                      { icon: Building2, label: "Clientes", value: formatLimit(plan.maxClients) },
                      { icon: BookOpen, label: "Normas", value: formatLimit(plan.maxStandards) },
                      { icon: HardDrive, label: "Storage", value: formatStorage(plan.maxStorage) },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.label} className="flex items-center gap-2 p-2 rounded-card bg-surface-tertiary">
                          <Icon className="h-4 w-4 text-foreground-tertiary flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-caption-1 text-foreground-tertiary">{item.label}</p>
                            <p className="text-body-2 font-medium text-foreground-primary">{item.value}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-caption-1 font-medium text-foreground-tertiary uppercase tracking-wide">
                    Funcionalidades
                  </h3>
                  <div className="space-y-1">
                    {Object.entries(FEATURE_LABELS).map(([key, label]) => {
                      const enabled = plan.features?.[key] === true;
                      return (
                        <div
                          key={key}
                          className={`flex items-center gap-2 text-body-2 ${
                            enabled ? "text-foreground-primary" : "text-foreground-tertiary opacity-50"
                          }`}
                        >
                          {enabled ? (
                            <Check className="h-3.5 w-3.5 text-success-fg flex-shrink-0" />
                          ) : (
                            <X className="h-3.5 w-3.5 flex-shrink-0" />
                          )}
                          {label}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
