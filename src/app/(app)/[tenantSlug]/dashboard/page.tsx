"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FolderKanban,
  AlertTriangle,
  ClipboardCheck,
  FileText,
  TrendingUp,
  Shield,
  Calendar,
  User,
  Plus,
  ArrowRight,
  Clock,
} from "lucide-react";
import {
  getStatusColor,
  getStatusLabel,
  getSeverityColor,
  getSeverityLabel,
  formatDate,
} from "@/lib/utils";

interface DashboardData {
  totalProjects: number;
  totalAudits: number;
  openNonconformities: number;
  pendingActions: number;
  totalDocuments: number;
  riskDistribution: { level: string; count: number }[];
  ncByStatus: { status: string; count: number }[];
  actionEffectiveness: number;
  projectProgress: {
    id: string;
    name: string;
    status: string;
    controls: number;
    requirements: number;
    risks: number;
    ncs: number;
    total: number;
    targetMaturity: number;
  }[];
  recentNcs: {
    id: string;
    code: string;
    title: string;
    severity: string;
    status: string;
    createdAt: string;
  }[];
  recentActions: {
    id: string;
    title: string;
    status: string;
    dueDate: string | null;
    responsible: { id: string; name: string } | null;
  }[];
  upcomingAudits: {
    id: string;
    title: string;
    type: string;
    startDate: string;
    endDate: string | null;
  }[];
  overdueActions: number;
  complianceOverview: {
    avgRequirementMaturity: number;
    avgControlMaturity: number;
    totalRequirements: number;
    totalControls: number;
    compliancePercentage: number;
  };
  upcomingReviews: {
    id: string;
    code: string;
    title: string;
    nextReviewDate: string;
    type: string;
  }[];
}

const RISK_LEVEL_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  critical: { label: "Critico", color: "text-white", bg: "bg-danger" },
  high: { label: "Alto", color: "text-danger-fg", bg: "bg-danger-bg" },
  medium: { label: "Medio", color: "text-warning-fg", bg: "bg-warning-bg" },
  low: { label: "Baixo", color: "text-success-fg", bg: "bg-success-bg" },
  very_low: { label: "Muito Baixo", color: "text-foreground-tertiary", bg: "bg-surface-tertiary" },
};

export default function DashboardPage() {
  const { tenant, can } = useTenant();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tenants/${tenant.slug}/dashboard`)
      .then((res) => res.json())
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenant.slug]);

  const stats = [
    {
      label: "Projetos Ativos",
      value: data?.totalProjects ?? 0,
      icon: FolderKanban,
      color: "text-brand",
      bgColor: "bg-brand-light",
      href: `/${tenant.slug}/projects`,
    },
    {
      label: "Auditorias",
      value: data?.totalAudits ?? 0,
      icon: Shield,
      color: "text-info",
      bgColor: "bg-brand-muted",
      href: `/${tenant.slug}/audits`,
    },
    {
      label: "NCs Abertas",
      value: data?.openNonconformities ?? 0,
      icon: AlertTriangle,
      color: "text-warning",
      bgColor: "bg-warning-bg",
      href: `/${tenant.slug}/nonconformities`,
    },
    {
      label: "Acoes Pendentes",
      value: data?.pendingActions ?? 0,
      icon: ClipboardCheck,
      color: "text-danger",
      bgColor: "bg-danger-bg",
      href: `/${tenant.slug}/action-plans`,
    },
    {
      label: "Documentos",
      value: data?.totalDocuments ?? 0,
      icon: FileText,
      color: "text-accent",
      bgColor: "bg-success-bg",
      href: `/${tenant.slug}/documents`,
    },
    {
      label: "Eficacia das Acoes",
      value: data?.actionEffectiveness
        ? `${Math.round(data.actionEffectiveness)}%`
        : "N/A",
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success-bg",
      href: `/${tenant.slug}/action-plans`,
    },
  ];

  // Overdue alert
  const hasOverdue = (data?.overdueActions ?? 0) > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-1 text-foreground-primary">Dashboard</h1>
          <p className="text-body-1 text-foreground-secondary mt-1">
            Visao geral do Sistema de Gestao da Qualidade
          </p>
        </div>
        {can("project", "create") && (
          <Link href={`/${tenant.slug}/projects/new`}>
            <Button>
              <Plus className="h-4 w-4" />
              Novo Projeto
            </Button>
          </Link>
        )}
      </div>

      {/* Overdue alert */}
      {hasOverdue && (
        <div className="flex items-center gap-3 bg-danger-bg border border-danger/20 rounded-card p-4">
          <Clock className="h-5 w-5 text-danger-fg flex-shrink-0" />
          <div className="flex-1">
            <p className="text-body-1 font-medium text-danger-fg">
              {data!.overdueActions} acao(oes) com prazo vencido
            </p>
            <p className="text-body-2 text-danger-fg/80">
              Verifique os planos de acao pendentes
            </p>
          </div>
          <Link href={`/${tenant.slug}/action-plans`}>
            <Button variant="outline" size="sm" className="border-danger/30 text-danger-fg hover:bg-danger-bg">
              Ver acoes
            </Button>
          </Link>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="cursor-pointer hover:shadow-card-glow transition-all h-full">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-body-2 text-foreground-secondary">
                    {stat.label}
                  </p>
                  <div
                    className={`h-10 w-10 rounded-button ${stat.bgColor} flex items-center justify-center`}
                  >
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
                <p className="text-title-lg text-foreground-primary">
                  {loading ? (
                    <span className="inline-block h-7 w-12 bg-surface-tertiary rounded animate-pulse" />
                  ) : (
                    stat.value
                  )}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-surface-tertiary rounded w-1/3" />
                  <div className="h-20 bg-surface-tertiary rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data && (data.totalProjects > 0 || data.totalAudits > 0) ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Risk Distribution */}
            {data.riskDistribution.length > 0 && (
              <Card>
                <CardHeader>
                  <h2 className="text-title-3 text-foreground-primary">
                    Distribuicao de Riscos
                  </h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(() => {
                      const totalRisks = data.riskDistribution.reduce((s, r) => s + r.count, 0);
                      const orderedLevels = ["critical", "high", "medium", "low", "very_low"];
                      const sorted = [...data.riskDistribution].sort(
                        (a, b) => orderedLevels.indexOf(a.level) - orderedLevels.indexOf(b.level)
                      );
                      return sorted.map((r) => {
                        const cfg = RISK_LEVEL_CONFIG[r.level] || RISK_LEVEL_CONFIG.low;
                        const pct = totalRisks > 0 ? Math.round((r.count / totalRisks) * 100) : 0;
                        return (
                          <div key={r.level} className="flex items-center gap-3">
                            <span className="text-body-2 text-foreground-secondary w-24 flex-shrink-0">
                              {cfg.label}
                            </span>
                            <div className="flex-1 h-6 bg-surface-tertiary rounded-full overflow-hidden">
                              <div
                                className={`h-full ${cfg.bg} rounded-full transition-all flex items-center justify-end pr-2`}
                                style={{ width: `${Math.max(pct, 8)}%` }}
                              >
                                <span className={`text-caption-2 font-medium ${cfg.color}`}>
                                  {r.count}
                                </span>
                              </div>
                            </div>
                            <span className="text-caption-1 text-foreground-tertiary w-10 text-right">
                              {pct}%
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* NCs by Status */}
            {data.ncByStatus.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h2 className="text-title-3 text-foreground-primary">
                      NCs por Status
                    </h2>
                    <Link href={`/${tenant.slug}/nonconformities`}>
                      <span className="text-caption-1 text-brand hover:underline flex items-center gap-1">
                        Ver todas <ArrowRight className="h-3 w-3" />
                      </span>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2.5">
                    {data.ncByStatus.map((nc) => {
                      const total = data.ncByStatus.reduce((s, n) => s + n.count, 0);
                      const pct = total > 0 ? Math.round((nc.count / total) * 100) : 0;
                      return (
                        <div key={nc.status} className="flex items-center gap-3">
                          <Badge variant={getStatusColor(nc.status)} className="w-36 justify-center">
                            {getStatusLabel(nc.status)}
                          </Badge>
                          <div className="flex-1 h-5 bg-surface-tertiary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand rounded-full transition-all"
                              style={{ width: `${Math.max(pct, 4)}%` }}
                            />
                          </div>
                          <span className="text-body-2 text-foreground-primary font-medium w-8 text-right">
                            {nc.count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Compliance Overview */}
            {data.complianceOverview && (data.complianceOverview.totalRequirements > 0 || data.complianceOverview.totalControls > 0) && (
              <Card>
                <CardHeader>
                  <h2 className="text-title-3 text-foreground-primary">
                    Compliance
                  </h2>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-shrink-0">
                      <div className={`h-16 w-16 rounded-full flex items-center justify-center ${
                        data.complianceOverview.compliancePercentage >= 70 ? "bg-success-bg" :
                        data.complianceOverview.compliancePercentage >= 40 ? "bg-warning-bg" :
                        "bg-danger-bg"
                      }`}>
                        <span className={`text-title-lg font-semibold ${
                          data.complianceOverview.compliancePercentage >= 70 ? "text-success-fg" :
                          data.complianceOverview.compliancePercentage >= 40 ? "text-warning-fg" :
                          "text-danger-fg"
                        }`}>
                          {data.complianceOverview.compliancePercentage}%
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-body-2 text-foreground-secondary">
                        Itens com maturidade &ge; 3
                      </p>
                      <p className="text-caption-1 text-foreground-tertiary mt-0.5">
                        {data.complianceOverview.totalRequirements} requisitos + {data.complianceOverview.totalControls} controles
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-body-2 text-foreground-secondary">Requisitos</span>
                        <span className="text-body-2 font-medium text-foreground-primary">{data.complianceOverview.avgRequirementMaturity}/4</span>
                      </div>
                      <div className="h-2 bg-surface-tertiary rounded-full overflow-hidden">
                        <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${(data.complianceOverview.avgRequirementMaturity / 4) * 100}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-body-2 text-foreground-secondary">Controles</span>
                        <span className="text-body-2 font-medium text-foreground-primary">{data.complianceOverview.avgControlMaturity}/4</span>
                      </div>
                      <div className="h-2 bg-surface-tertiary rounded-full overflow-hidden">
                        <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${(data.complianceOverview.avgControlMaturity / 4) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Projects Overview */}
            {data.projectProgress.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h2 className="text-title-3 text-foreground-primary">
                      Projetos
                    </h2>
                    <Link href={`/${tenant.slug}/projects`}>
                      <span className="text-caption-1 text-brand hover:underline flex items-center gap-1">
                        Ver todos <ArrowRight className="h-3 w-3" />
                      </span>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.projectProgress.map((p) => (
                      <Link
                        key={p.id}
                        href={`/${tenant.slug}/projects/${p.id}`}
                        className="block p-3 rounded-button border border-stroke-secondary hover:bg-surface-secondary transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-body-1 font-medium text-foreground-primary truncate">
                            {p.name}
                          </p>
                          <Badge variant={getStatusColor(p.status)}>
                            {getStatusLabel(p.status)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-caption-1 text-foreground-tertiary">
                          <span>{p.controls} controle{p.controls !== 1 ? "s" : ""}</span>
                          <span>{p.requirements} requisito{p.requirements !== 1 ? "s" : ""}</span>
                          <span>{p.risks} risco{p.risks !== 1 ? "s" : ""}</span>
                          {p.ncs > 0 && (
                            <span className="text-warning">{p.ncs} NC{p.ncs !== 1 ? "s" : ""}</span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upcoming Audits */}
            {data.upcomingAudits.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h2 className="text-title-3 text-foreground-primary">
                      Proximas Auditorias
                    </h2>
                    <Link href={`/${tenant.slug}/audits`}>
                      <span className="text-caption-1 text-brand hover:underline flex items-center gap-1">
                        Ver todas <ArrowRight className="h-3 w-3" />
                      </span>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.upcomingAudits.map((audit) => (
                      <Link
                        key={audit.id}
                        href={`/${tenant.slug}/audits/${audit.id}`}
                        className="flex items-center justify-between p-3 rounded-button border border-stroke-secondary hover:bg-surface-secondary transition-colors"
                      >
                        <div>
                          <p className="text-body-1 font-medium text-foreground-primary">
                            {audit.title}
                          </p>
                          <p className="text-caption-1 text-foreground-tertiary">
                            {audit.type === "internal" ? "Interna" : audit.type === "external" ? "Externa" : audit.type}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 text-body-2 text-foreground-secondary">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{formatDate(audit.startDate)}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            {/* Upcoming Reviews */}
            {data.upcomingReviews && data.upcomingReviews.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h2 className="text-title-3 text-foreground-primary">
                      Revisoes Pendentes
                    </h2>
                    <Link href={`/${tenant.slug}/documents`}>
                      <span className="text-caption-1 text-brand hover:underline flex items-center gap-1">
                        Ver docs <ArrowRight className="h-3 w-3" />
                      </span>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.upcomingReviews.map((doc) => {
                      const daysUntil = Math.ceil((new Date(doc.nextReviewDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                      const isUrgent = daysUntil <= 7;
                      return (
                        <div
                          key={doc.id}
                          className={`flex items-center justify-between p-3 rounded-button border transition-colors ${
                            isUrgent ? "border-danger/30 bg-danger-bg/30" : "border-stroke-secondary hover:bg-surface-secondary"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-caption-1 text-foreground-tertiary font-mono">{doc.code}</span>
                            </div>
                            <p className="text-body-2 text-foreground-primary truncate mt-0.5">{doc.title}</p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
                            <Calendar className="h-3.5 w-3.5" />
                            <span className={`text-caption-1 ${isUrgent ? "text-danger-fg font-medium" : "text-foreground-tertiary"}`}>
                              {daysUntil <= 0 ? "Vencido" : `${daysUntil}d`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Recent Activity Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Recent NCs */}
            {data.recentNcs.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h2 className="text-title-3 text-foreground-primary">
                      NCs Recentes
                    </h2>
                    <Link href={`/${tenant.slug}/nonconformities`}>
                      <span className="text-caption-1 text-brand hover:underline flex items-center gap-1">
                        Ver todas <ArrowRight className="h-3 w-3" />
                      </span>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {data.recentNcs.map((nc) => (
                      <Link
                        key={nc.id}
                        href={`/${tenant.slug}/nonconformities/${nc.id}`}
                        className="flex items-center gap-3 p-2.5 rounded-button hover:bg-surface-secondary transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-caption-1 text-foreground-tertiary font-mono">
                              {nc.code}
                            </span>
                            <Badge variant={getSeverityColor(nc.severity)} className="text-caption-2">
                              {getSeverityLabel(nc.severity)}
                            </Badge>
                          </div>
                          <p className="text-body-2 text-foreground-primary truncate mt-0.5">
                            {nc.title}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <Badge variant={getStatusColor(nc.status)} className="text-caption-2">
                            {getStatusLabel(nc.status)}
                          </Badge>
                          <span className="text-caption-2 text-foreground-tertiary">
                            {formatDate(nc.createdAt)}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pending Actions */}
            {data.recentActions.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h2 className="text-title-3 text-foreground-primary">
                      Acoes Pendentes
                    </h2>
                    <Link href={`/${tenant.slug}/action-plans`}>
                      <span className="text-caption-1 text-brand hover:underline flex items-center gap-1">
                        Ver todas <ArrowRight className="h-3 w-3" />
                      </span>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {data.recentActions.map((ap) => {
                      const isOverdue = ap.dueDate && new Date(ap.dueDate) < new Date();
                      return (
                        <Link
                          key={ap.id}
                          href={`/${tenant.slug}/action-plans/${ap.id}`}
                          className="flex items-center gap-3 p-2.5 rounded-button hover:bg-surface-secondary transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-body-2 text-foreground-primary truncate">
                              {ap.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant={getStatusColor(ap.status)} className="text-caption-2">
                                {getStatusLabel(ap.status)}
                              </Badge>
                              {ap.responsible && (
                                <span className="text-caption-1 text-foreground-tertiary flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {ap.responsible.name.split(" ")[0]}
                                </span>
                              )}
                            </div>
                          </div>
                          {ap.dueDate && (
                            <span
                              className={`text-caption-1 flex items-center gap-1 flex-shrink-0 ${
                                isOverdue ? "text-danger-fg font-medium" : "text-foreground-tertiary"
                              }`}
                            >
                              <Calendar className="h-3 w-3" />
                              {formatDate(ap.dueDate)}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      ) : (
        /* Empty state for new tenants */
        <Card>
          <CardContent className="py-12 text-center">
            <FolderKanban className="h-12 w-12 text-foreground-tertiary mx-auto mb-4" />
            <h2 className="text-title-3 text-foreground-primary mb-2">
              Comece aqui
            </h2>
            <p className="text-body-1 text-foreground-secondary mb-6 max-w-md mx-auto">
              Crie seu primeiro projeto para comecar a gerenciar requisitos,
              riscos, auditorias, nao conformidades e planos de acao.
            </p>
            {can("project", "create") && (
              <Link href={`/${tenant.slug}/projects/new`}>
                <Button>
                  <Plus className="h-4 w-4" />
                  Criar Primeiro Projeto
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
