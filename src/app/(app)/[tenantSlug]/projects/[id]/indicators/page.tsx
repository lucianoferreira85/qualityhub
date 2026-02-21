"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, TrendingUp, Target, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { getFrequencyLabel } from "@/lib/utils";

interface Measurement {
  id: string;
  value: string | number;
  period: string;
}

interface IndicatorItem {
  id: string;
  name: string;
  unit: string;
  frequency: string;
  target: string | number;
  lowerLimit: string | number | null;
  upperLimit: string | number | null;
  project?: { id: string; name: string } | null;
  measurements?: Measurement[];
}

function getPerformance(value: number, target: number, upperLimit: number | null, lowerLimit: number | null) {
  if (upperLimit !== null && value > upperLimit) return "danger";
  if (lowerLimit !== null && value < lowerLimit) return "danger";
  const pct = target > 0 ? (value / target) * 100 : 0;
  if (pct >= 95) return "success";
  if (pct >= 80) return "warning";
  return "danger";
}

const PERF_COLORS: Record<string, string> = {
  success: "bg-success-bg text-success-fg",
  warning: "bg-warning-bg text-warning-fg",
  danger: "bg-danger-bg text-danger-fg",
};

export default function ProjectIndicatorsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { tenant, can } = useTenant();
  const [indicators, setIndicators] = useState<IndicatorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`/api/tenants/${tenant.slug}/indicators`)
      .then((res) => res.json())
      .then((res) => {
        const all = res.data || [];
        setIndicators(all.filter((ind: IndicatorItem) => ind.project?.id === projectId));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenant.slug, projectId]);

  const filtered = indicators.filter((ind) => {
    const q = search.toLowerCase();
    return (
      ind.name.toLowerCase().includes(q) ||
      ind.unit.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/${tenant.slug}/projects/${projectId}`}>
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-title-1 text-foreground-primary">Indicadores</h1>
            <p className="text-body-1 text-foreground-secondary mt-1">
              KPIs e metricas de desempenho do projeto
            </p>
          </div>
        </div>
        {can("indicator", "create") && (
          <Link href={`/${tenant.slug}/indicators/new`}>
            <Button>
              <Plus className="h-4 w-4" />
              Novo Indicador
            </Button>
          </Link>
        )}
      </div>

      <Input
        placeholder="Buscar por nome ou unidade..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-surface-tertiary rounded w-2/3" />
                  <div className="h-8 bg-surface-tertiary rounded w-1/3" />
                  <div className="h-4 bg-surface-tertiary rounded w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <TrendingUp className="h-12 w-12 text-foreground-tertiary mb-4" />
            <p className="text-title-3 text-foreground-primary mb-1">
              {search ? "Nenhum indicador encontrado" : "Nenhum indicador neste projeto"}
            </p>
            <p className="text-body-1 text-foreground-secondary">
              {search ? "Tente ajustar os termos de busca" : "Configure indicadores para monitorar o projeto"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ind) => {
            const latest = ind.measurements && ind.measurements.length > 0 ? ind.measurements[0] : null;
            const prev = ind.measurements && ind.measurements.length > 1 ? ind.measurements[1] : null;
            const latestVal = latest ? Number(latest.value) : null;
            const prevVal = prev ? Number(prev.value) : null;
            const targetNum = Number(ind.target);
            const perf = latestVal !== null
              ? getPerformance(latestVal, targetNum, ind.upperLimit ? Number(ind.upperLimit) : null, ind.lowerLimit ? Number(ind.lowerLimit) : null)
              : null;
            const trend = latestVal !== null && prevVal !== null
              ? latestVal > prevVal ? "up" : latestVal < prevVal ? "down" : "stable"
              : null;

            return (
              <Link key={ind.id} href={`/${tenant.slug}/indicators/${ind.id}`}>
                <Card className="cursor-pointer hover:shadow-card-glow transition-shadow h-full">
                  <CardContent className="p-5">
                    <div className="mb-3">
                      <h3 className="text-body-1 font-medium text-foreground-primary line-clamp-2">
                        {ind.name}
                      </h3>
                      <p className="text-caption-1 text-foreground-tertiary mt-0.5">
                        {getFrequencyLabel(ind.frequency)} &middot; {ind.unit}
                      </p>
                    </div>

                    <div className="flex items-end gap-3 mb-3">
                      <div>
                        <p className="text-caption-1 text-foreground-tertiary">Atual</p>
                        <p className="text-title-2 font-semibold text-foreground-primary">
                          {latestVal !== null ? latestVal.toLocaleString("pt-BR") : "\u2014"}
                        </p>
                      </div>
                      <div>
                        <p className="text-caption-1 text-foreground-tertiary">Meta</p>
                        <p className="text-body-1 text-foreground-secondary">
                          {targetNum.toLocaleString("pt-BR")} {ind.unit}
                        </p>
                      </div>
                      {trend && (
                        <div className="ml-auto">
                          {trend === "up" && <ArrowUp className="h-5 w-5 text-success-fg" />}
                          {trend === "down" && <ArrowDown className="h-5 w-5 text-danger-fg" />}
                          {trend === "stable" && <Minus className="h-5 w-5 text-foreground-tertiary" />}
                        </div>
                      )}
                    </div>

                    {latestVal !== null && targetNum > 0 && (
                      <div className="mb-3">
                        <div className="h-2 bg-surface-tertiary rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              perf === "success"
                                ? "bg-success-fg"
                                : perf === "warning"
                                ? "bg-warning-fg"
                                : "bg-danger-fg"
                            }`}
                            style={{ width: `${Math.min((latestVal / targetNum) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-stroke-secondary">
                      {perf ? (
                        <Badge variant={PERF_COLORS[perf]}>
                          {perf === "success" ? "Na meta" : perf === "warning" ? "Atencao" : "Fora da meta"}
                        </Badge>
                      ) : (
                        <Badge variant="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                          Sem medicao
                        </Badge>
                      )}
                      <div className="flex items-center gap-2 text-caption-1 text-foreground-tertiary">
                        {ind.measurements && ind.measurements.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {ind.measurements.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
