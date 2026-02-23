"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { CardSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Plus, TrendingUp, FolderKanban, Target, ArrowUp, ArrowDown, Minus, Filter, Download } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { getFrequencyLabel } from "@/lib/utils";
import { exportToCSV, type CsvColumn } from "@/lib/export";
import { toast } from "sonner";
import type { Indicator, IndicatorMeasurement } from "@/types";

interface IndicatorWithRelations extends Omit<Indicator, "measurements"> {
  project?: { id: string; name: string } | null;
  measurements?: IndicatorMeasurement[];
}

function getPerformance(value: number, target: number, upperLimit: number | null, lowerLimit: number | null) {
  if (upperLimit !== null && value > upperLimit) return "danger";
  if (lowerLimit !== null && value < lowerLimit) return "danger";
  const pct = target > 0 ? (value / target) * 100 : 0;
  if (pct >= 95) return "success";
  if (pct >= 80) return "warning";
  return "danger";
}

const CSV_COLUMNS: CsvColumn<IndicatorWithRelations>[] = [
  { key: "name", label: "Nome" },
  { key: "unit", label: "Unidade" },
  { key: "frequency", label: "Frequência", formatter: (v) => getFrequencyLabel(String(v ?? "")) },
  { key: "target", label: "Meta" },
  {
    key: "measurements",
    label: "Último Valor",
    formatter: (_v, row) => {
      const m = row.measurements;
      return m && m.length > 0 ? String(m[0].value) : "";
    },
  },
];

const FREQUENCIES = [
  { value: "", label: "Todas as frequências" },
  { value: "daily", label: "Diário" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" },
  { value: "quarterly", label: "Trimestral" },
  { value: "yearly", label: "Anual" },
];

const PERF_COLORS: Record<string, string> = {
  success: "bg-success-bg text-success-fg",
  warning: "bg-warning-bg text-warning-fg",
  danger: "bg-danger-bg text-danger-fg",
};

export default function IndicatorsPage() {
  const { tenant, can } = useTenant();
  const [indicators, setIndicators] = useState<IndicatorWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterFrequency, setFilterFrequency] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchIndicators = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterFrequency) params.set("frequency", filterFrequency);
    params.set("page", String(page));
    params.set("pageSize", "20");
    const qs = params.toString();

    fetch(`/api/tenants/${tenant.slug}/indicators${qs ? `?${qs}` : ""}`)
      .then((res) => res.json())
      .then((res) => {
        setIndicators(res.data || []);
        if (res.totalPages !== undefined) {
          setTotalPages(res.totalPages);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenant.slug, filterFrequency, page]);

  useEffect(() => {
    fetchIndicators();
  }, [fetchIndicators]);

  const filtered = indicators.filter((ind) => {
    const q = search.toLowerCase();
    return (
      ind.name.toLowerCase().includes(q) ||
      ind.project?.name.toLowerCase().includes(q) ||
      ind.unit.toLowerCase().includes(q) ||
      false
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-1 text-foreground-primary">Indicadores</h1>
          <p className="text-body-1 text-foreground-secondary mt-1">
            Acompanhe os indicadores de desempenho do SGQ
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              exportToCSV(filtered, CSV_COLUMNS, "indicadores");
              toast.success("CSV exportado com sucesso");
            }}
            disabled={filtered.length === 0}
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
          {can("indicator", "create") && (
            <Link href={`/${tenant.slug}/indicators/new`}>
              <Button>
                <Plus className="h-4 w-4" />
                Novo Indicador
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Buscar por nome, projeto ou unidade..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-foreground-tertiary flex-shrink-0" />
          <Select
            value={filterFrequency}
            onChange={(e) => { setFilterFrequency(e.target.value); setPage(1); }}
            options={FREQUENCIES}
          />
          {filterFrequency && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setFilterFrequency(""); setPage(1); }}
              className="text-foreground-tertiary"
            >
              Limpar
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title={search || filterFrequency ? "Nenhum indicador encontrado" : "Nenhum indicador configurado"}
          description={search || filterFrequency ? "Tente ajustar os filtros ou termos de busca" : "Configure indicadores para monitorar o desempenho"}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ind) => {
            const latest = ind.measurements && ind.measurements.length > 0
              ? ind.measurements[0]
              : null;
            const prev = ind.measurements && ind.measurements.length > 1
              ? ind.measurements[1]
              : null;
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
                          {latestVal !== null ? latestVal.toLocaleString("pt-BR") : "—"}
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

                    {/* Progress bar */}
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
                          {perf === "success" ? "Na meta" : perf === "warning" ? "Atenção" : "Fora da meta"}
                        </Badge>
                      ) : (
                        <Badge variant="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                          Sem medição
                        </Badge>
                      )}
                      <div className="flex items-center gap-2 text-caption-1 text-foreground-tertiary">
                        {ind.project && (
                          <span className="flex items-center gap-1">
                            <FolderKanban className="h-3 w-3" />
                            {ind.project.name}
                          </span>
                        )}
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

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
