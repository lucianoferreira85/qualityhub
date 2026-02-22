"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { BarChart3, Target, CheckCircle2, AlertTriangle, ChevronDown, ChevronRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateGapAnalysisReport } from "@/lib/pdf-reports/gap-analysis-report";
import { MaturityRadar } from "@/components/charts/maturity-radar";

interface GapItem {
  id: string;
  code: string;
  title: string;
  type: "requirement" | "control";
  maturity: number;
  gap: number;
  domain: string;
}

interface DomainData {
  domain: string;
  avgMaturity: number;
  items: GapItem[];
}

interface StandardData {
  standardId: string;
  standardCode: string;
  standardName: string;
  avgMaturity: number;
  byDomain: DomainData[];
}

interface GapData {
  targetMaturity: number;
  overall: {
    totalItems: number;
    averageMaturity: number;
    compliantCount: number;
    gapPercentage: number;
  };
  byStandard: StandardData[];
  maturityDistribution: { level: number; label: string; count: number }[];
  topGaps: GapItem[];
}

const MATURITY_COLORS = [
  "bg-gray-300",
  "bg-danger",
  "bg-warning",
  "bg-brand",
  "bg-success",
];

const GAP_COLOR = (gap: number) => {
  if (gap === 0) return "text-success-fg bg-success-bg";
  if (gap === 1) return "text-warning-fg bg-warning-bg";
  return "text-danger-fg bg-danger-bg";
};

export default function GapAnalysisPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { tenant } = useTenant();
  const [data, setData] = useState<GapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState("");
  const [expandedStandards, setExpandedStandards] = useState<Set<string>>(new Set());

  const fetchData = useCallback(() => {
    Promise.all([
      fetch(`/api/tenants/${tenant.slug}/projects/${projectId}/gap-analysis`).then((r) => r.json()),
      fetch(`/api/tenants/${tenant.slug}/projects/${projectId}`).then((r) => r.json()),
    ])
      .then(([gapRes, projRes]) => {
        setData(gapRes.data);
        setProjectName(projRes.data?.name || "Projeto");
        // Auto-expand all standards
        if (gapRes.data?.byStandard) {
          setExpandedStandards(new Set(gapRes.data.byStandard.map((s: StandardData) => s.standardId)));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenant.slug, projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleStandard = (id: string) => {
    setExpandedStandards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Gather all domains across all standards for radar
  const allDomains = data?.byStandard?.flatMap((s) => s.byDomain) || [];

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: "Projetos", href: `/${tenant.slug}/projects` },
        { label: projectName, href: `/${tenant.slug}/projects/${projectId}` },
        { label: "Análise de Gaps" },
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-1 text-foreground-primary">Análise de Gaps</h1>
          <p className="text-body-1 text-foreground-secondary mt-1">
            Avaliação de maturidade e conformidade do projeto
          </p>
        </div>
        {data && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-body-2 text-foreground-secondary">
              <Target className="h-4 w-4" />
              Meta: <span className="font-semibold text-foreground-primary">{data.targetMaturity}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                generateGapAnalysisReport(
                  {
                    projectName: projectName,
                    targetMaturity: data.targetMaturity,
                    overall: data.overall,
                    byStandard: data.byStandard.map((s) => ({
                      standardCode: s.standardCode,
                      standardName: s.standardName,
                      avgMaturity: s.avgMaturity,
                      byDomain: s.byDomain,
                    })),
                    maturityDistribution: data.maturityDistribution,
                    topGaps: data.topGaps,
                  },
                  tenant.name
                )
              }
            >
              <Download className="h-4 w-4" /> Exportar PDF
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}><CardContent className="p-5"><div className="animate-pulse space-y-2"><div className="h-3 bg-surface-tertiary rounded w-1/2" /><div className="h-8 bg-surface-tertiary rounded w-2/3" /></div></CardContent></Card>
          ))}
        </div>
      ) : !data || data.overall.totalItems === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="h-12 w-12 text-foreground-tertiary mx-auto mb-4" />
            <h2 className="text-title-3 text-foreground-primary mb-2">Sem dados para análise</h2>
            <p className="text-body-1 text-foreground-secondary">
              Importe requisitos e controles no projeto para visualizar a análise de gaps.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-5">
                <p className="text-caption-1 text-foreground-tertiary mb-1">Total de Itens</p>
                <p className="text-title-lg text-foreground-primary font-semibold">{data.overall.totalItems}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-caption-1 text-foreground-tertiary mb-1">Maturidade Média</p>
                <p className="text-title-lg text-foreground-primary font-semibold">{data.overall.averageMaturity}</p>
                <div className="h-2 w-full bg-surface-tertiary rounded-full mt-2">
                  <div className="h-full bg-brand rounded-full" style={{ width: `${(data.overall.averageMaturity / 4) * 100}%` }} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-caption-1 text-foreground-tertiary mb-1">Conformes</p>
                <p className="text-title-lg text-success-fg font-semibold">
                  <CheckCircle2 className="h-5 w-5 inline mr-1" />
                  {data.overall.compliantCount}
                </p>
                <p className="text-caption-1 text-foreground-tertiary mt-1">
                  {Math.round(100 - data.overall.gapPercentage)}% do total
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-caption-1 text-foreground-tertiary mb-1">Gaps Críticos</p>
                <p className="text-title-lg text-danger-fg font-semibold">
                  <AlertTriangle className="h-5 w-5 inline mr-1" />
                  {data.topGaps.filter((g) => g.gap >= 2).length}
                </p>
                <p className="text-caption-1 text-foreground-tertiary mt-1">
                  gap &ge; 2 níveis
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Maturity Distribution */}
            <Card>
              <CardHeader>
                <h2 className="text-title-3 text-foreground-primary">Distribuição de Maturidade</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.maturityDistribution.map((level) => {
                    const pct = data.overall.totalItems > 0
                      ? Math.round((level.count / data.overall.totalItems) * 100)
                      : 0;
                    return (
                      <div key={level.level} className="flex items-center gap-3">
                        <span className="text-body-2 text-foreground-secondary w-28 flex-shrink-0">
                          {level.level} - {level.label}
                        </span>
                        <div className="flex-1 h-6 bg-surface-tertiary rounded-full overflow-hidden">
                          <div
                            className={`h-full ${MATURITY_COLORS[level.level]} rounded-full transition-all flex items-center justify-end pr-2`}
                            style={{ width: `${Math.max(pct, 6)}%` }}
                          >
                            <span className="text-caption-2 font-medium text-white">{level.count}</span>
                          </div>
                        </div>
                        <span className="text-caption-1 text-foreground-tertiary w-10 text-right">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Radar Chart */}
            <Card>
              <CardHeader>
                <h2 className="text-title-3 text-foreground-primary">Radar de Maturidade por Domínio</h2>
              </CardHeader>
              <CardContent>
                <MaturityRadar data={allDomains} targetMaturity={data.targetMaturity} />
              </CardContent>
            </Card>
          </div>

          {/* Standards Sections */}
          {data.byStandard.map((std) => (
            <Card key={std.standardId}>
              <CardHeader
                className="cursor-pointer hover:bg-surface-secondary transition-colors"
                onClick={() => toggleStandard(std.standardId)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {expandedStandards.has(std.standardId) ? (
                      <ChevronDown className="h-5 w-5 text-foreground-tertiary" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-foreground-tertiary" />
                    )}
                    <div>
                      <h2 className="text-title-3 text-foreground-primary">
                        {std.standardCode} - {std.standardName}
                      </h2>
                    </div>
                  </div>
                  <Badge variant={
                    std.avgMaturity >= data.targetMaturity ? "bg-success-bg text-success-fg" :
                    std.avgMaturity >= data.targetMaturity - 1 ? "bg-warning-bg text-warning-fg" :
                    "bg-danger-bg text-danger-fg"
                  }>
                    Média: {Math.round(std.avgMaturity * 100) / 100}
                  </Badge>
                </div>
              </CardHeader>
              {expandedStandards.has(std.standardId) && (
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-stroke-secondary">
                          <th className="text-left text-caption-1 text-foreground-tertiary font-medium py-2 pr-4">Código</th>
                          <th className="text-left text-caption-1 text-foreground-tertiary font-medium py-2 pr-4">Título</th>
                          <th className="text-left text-caption-1 text-foreground-tertiary font-medium py-2 pr-4">Tipo</th>
                          <th className="text-center text-caption-1 text-foreground-tertiary font-medium py-2 px-2">Atual</th>
                          <th className="text-center text-caption-1 text-foreground-tertiary font-medium py-2 px-2">Meta</th>
                          <th className="text-center text-caption-1 text-foreground-tertiary font-medium py-2 px-2">Gap</th>
                        </tr>
                      </thead>
                      <tbody>
                        {std.byDomain.map((domain) => (
                          <>
                            <tr key={`domain-${domain.domain}`} className="bg-surface-secondary">
                              <td colSpan={4} className="text-body-2 font-medium text-foreground-primary py-2 px-2">
                                Domínio: {domain.domain}
                              </td>
                              <td className="text-center text-caption-1 text-foreground-tertiary py-2">
                                {data.targetMaturity}
                              </td>
                              <td className="text-center">
                                <Badge variant={
                                  domain.avgMaturity >= data.targetMaturity ? "bg-success-bg text-success-fg" : "bg-warning-bg text-warning-fg"
                                } className="text-caption-2">
                                  Média: {Math.round(domain.avgMaturity * 10) / 10}
                                </Badge>
                              </td>
                            </tr>
                            {domain.items.map((item) => (
                              <tr key={item.id} className="border-b border-stroke-secondary hover:bg-surface-secondary transition-colors">
                                <td className="text-body-2 text-foreground-secondary py-2 pr-4 font-mono">{item.code}</td>
                                <td className="text-body-2 text-foreground-primary py-2 pr-4 max-w-md truncate">{item.title}</td>
                                <td className="text-caption-1 text-foreground-tertiary py-2 pr-4">
                                  {item.type === "requirement" ? "Req" : "Ctrl"}
                                </td>
                                <td className="text-center py-2">
                                  <div className="flex items-center justify-center gap-1">
                                    <div className={`h-2 rounded-full ${MATURITY_COLORS[item.maturity]}`} style={{ width: `${Math.max((item.maturity / 4) * 40, 8)}px` }} />
                                    <span className="text-body-2 font-medium text-foreground-primary">{item.maturity}</span>
                                  </div>
                                </td>
                                <td className="text-center text-body-2 text-foreground-tertiary py-2">{data.targetMaturity}</td>
                                <td className="text-center py-2">
                                  <Badge variant={GAP_COLOR(item.gap)} className="text-caption-2 min-w-[32px]">
                                    {item.gap}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}

          {/* Top Gaps */}
          {data.topGaps.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-title-3 text-foreground-primary">Maiores Gaps</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.topGaps.map((item, idx) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-button border border-stroke-secondary">
                      <span className="text-caption-1 text-foreground-tertiary w-6 text-center font-mono">{idx + 1}</span>
                      <span className="text-body-2 text-foreground-secondary font-mono w-20">{item.code}</span>
                      <span className="text-body-2 text-foreground-primary flex-1 truncate">{item.title}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-caption-1 text-foreground-tertiary">
                          {item.maturity} → {data.targetMaturity}
                        </span>
                        <Badge variant={GAP_COLOR(item.gap)} className="text-caption-2 min-w-[32px]">
                          Gap: {item.gap}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
