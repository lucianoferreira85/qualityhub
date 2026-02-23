"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import { usePageTitle } from "@/hooks/use-page-title";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CardSkeleton } from "@/components/ui/skeleton";
import {
  FolderKanban,
  AlertTriangle,
  ClipboardCheck,
  FileText,
  TrendingUp,
  Shield,
  Plus,
  BarChart3,
  Target,
} from "lucide-react";
import { TrendLineChart } from "@/components/charts/trend-line-chart";
import { ProjectComparisonBar } from "@/components/charts/project-comparison-bar";
import { CertificationReadiness } from "@/components/charts/certification-readiness";
import {
  KpiCards,
  OverdueAlerts,
  RiskDistribution,
  NcByStatus,
  ComplianceOverview,
  ProjectsOverview,
  UpcomingAudits,
  UpcomingReviews,
  RecentNcs,
  PendingActions,
  ExpirationsWidget,
  MaturityHeatmap,
} from "@/components/dashboard";
import type { KpiStat } from "@/components/dashboard";

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
  overdueRiskReviews: number;
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

interface AnalyticsData {
  trends: {
    month: string;
    risks: number;
    ncs: number;
    actions: number;
    incidents: number;
  }[];
  projectComparison: {
    id: string;
    name: string;
    compliance: number;
    avgMaturity: number;
    openNCs: number;
    pendingActions: number;
  }[];
  maturityHeatmap: {
    domain: string;
    projectName: string;
    avgMaturity: number;
  }[];
  certificationReadiness: {
    projectId: string;
    projectName: string;
    requirementCompliance: number;
    controlCompliance: number;
    openNCs: number;
    pendingActions: number;
    overdueItems: number;
    readinessScore: number;
  }[];
  expirations: {
    type: string;
    id: string;
    title: string;
    dueDate: string;
    daysUntil: number;
    projectName?: string;
  }[];
}

const PERIOD_OPTIONS = [
  { value: "3m", label: "3 meses" },
  { value: "6m", label: "6 meses" },
  { value: "12m", label: "12 meses" },
];

export default function DashboardPage() {
  const { tenant, can } = useTenant();
  usePageTitle("Dashboard");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [period, setPeriod] = useState("6m");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDashboard = useCallback(() => {
    fetch(`/api/tenants/${tenant.slug}/dashboard`)
      .then((res) => res.json())
      .then((res) => {
        setData(res.data);
        setLastUpdated(new Date());
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenant.slug]);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 60000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const fetchAnalytics = useCallback(
    (p: string) => {
      setAnalyticsLoading(true);
      fetch(`/api/tenants/${tenant.slug}/dashboard/analytics?period=${p}`)
        .then((res) => res.json())
        .then((res) => setAnalytics(res.data))
        .catch(() => {})
        .finally(() => setAnalyticsLoading(false));
    },
    [tenant.slug]
  );

  useEffect(() => {
    fetchAnalytics(period);
  }, [period, fetchAnalytics]);

  const stats: KpiStat[] = [
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-1 text-foreground-primary">Dashboard</h1>
          <p className="text-body-1 text-foreground-secondary mt-1">
            Visao geral do Sistema de Gestao da Qualidade
            {lastUpdated && (
              <span className="text-caption-1 text-foreground-tertiary ml-2">
                &middot; Atualizado {lastUpdated.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-surface-secondary rounded-button border border-stroke-secondary p-0.5">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={`px-3 py-1.5 text-caption-1 rounded-button transition-colors ${
                  period === opt.value
                    ? "bg-brand text-white font-medium"
                    : "text-foreground-secondary hover:text-foreground-primary"
                }`}
              >
                {opt.label}
              </button>
            ))}
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
      </div>

      <OverdueAlerts
        overdueActions={data?.overdueActions ?? 0}
        overdueRiskReviews={data?.overdueRiskReviews ?? 0}
        tenantSlug={tenant.slug}
      />

      <KpiCards stats={stats} loading={loading} />

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : data && (data.totalProjects > 0 || data.totalAudits > 0) ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <RiskDistribution data={data.riskDistribution} />
            <NcByStatus data={data.ncByStatus} tenantSlug={tenant.slug} />
            <ComplianceOverview data={data.complianceOverview} />
            <ProjectsOverview data={data.projectProgress} tenantSlug={tenant.slug} />
            <UpcomingAudits data={data.upcomingAudits} tenantSlug={tenant.slug} />
            <UpcomingReviews data={data.upcomingReviews} tenantSlug={tenant.slug} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <RecentNcs data={data.recentNcs} tenantSlug={tenant.slug} />
            <PendingActions data={data.recentActions} tenantSlug={tenant.slug} />
          </div>

          {analyticsLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <CardSkeleton key={`analytics-skel-${i}`} />
              ))}
            </div>
          ) : analytics && (
            <>
              {analytics.trends.length > 0 && (
                <Card>
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <BarChart3 className="h-5 w-5 text-brand" />
                      <h2 className="text-title-3 text-foreground-primary">
                        Tendencias ({PERIOD_OPTIONS.find((o) => o.value === period)?.label})
                      </h2>
                    </div>
                    <TrendLineChart data={analytics.trends} />
                  </div>
                </Card>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {analytics.projectComparison.length > 1 && (
                  <Card>
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <BarChart3 className="h-5 w-5 text-brand" />
                        <h2 className="text-title-3 text-foreground-primary">
                          Comparativo de Projetos
                        </h2>
                      </div>
                      <ProjectComparisonBar data={analytics.projectComparison} />
                    </div>
                  </Card>
                )}
                <MaturityHeatmap data={analytics.maturityHeatmap} />
              </div>

              {analytics.certificationReadiness.length > 0 && (
                <Card>
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Target className="h-5 w-5 text-brand" />
                      <h2 className="text-title-3 text-foreground-primary">
                        Prontidao para Certificacao
                      </h2>
                    </div>
                    <CertificationReadiness data={analytics.certificationReadiness} />
                  </div>
                </Card>
              )}

              <ExpirationsWidget data={analytics.expirations} />
            </>
          )}
        </>
      ) : (
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
