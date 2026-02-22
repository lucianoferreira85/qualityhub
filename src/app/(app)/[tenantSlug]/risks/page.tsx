"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, FolderKanban, User, Filter } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { getRiskLevelLabel, getStatusLabel, getStatusColor } from "@/lib/utils";

const RISK_LEVELS = [
  { value: "", label: "Todos os níveis" },
  { value: "critical", label: "Crítico" },
  { value: "high", label: "Alto" },
  { value: "medium", label: "Médio" },
  { value: "low", label: "Baixo" },
];

const RISK_STATUSES = [
  { value: "", label: "Todos os status" },
  { value: "identified", label: "Identificado" },
  { value: "assessed", label: "Avaliado" },
  { value: "treating", label: "Em Tratamento" },
  { value: "monitored", label: "Monitorado" },
  { value: "closed", label: "Fechado" },
];

const RISK_CATEGORIES = [
  { value: "", label: "Todas as categorias" },
  { value: "strategic", label: "Estratégico" },
  { value: "operational", label: "Operacional" },
  { value: "compliance", label: "Conformidade" },
  { value: "financial", label: "Financeiro" },
  { value: "technology", label: "Tecnologia" },
  { value: "legal", label: "Legal" },
];

const LEVEL_COLORS: Record<string, string> = {
  critical: "bg-danger-bg text-danger-fg",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  medium: "bg-warning-bg text-warning-fg",
  low: "bg-success-bg text-success-fg",
};

const CATEGORY_LABELS: Record<string, string> = {
  strategic: "Estratégico",
  operational: "Operacional",
  compliance: "Conformidade",
  financial: "Financeiro",
  technology: "Tecnologia",
  legal: "Legal",
};

interface RiskItem {
  id: string;
  code: string;
  title: string;
  category: string;
  probability: number;
  impact: number;
  riskLevel: string;
  status: string;
  project?: { id: string; name: string };
  responsible?: { id: string; name: string } | null;
  _count?: { treatments: number };
}

export default function RisksPage() {
  const { tenant } = useTenant();
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchRisks = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterLevel) params.set("riskLevel", filterLevel);
    if (filterStatus) params.set("status", filterStatus);
    if (filterCategory) params.set("category", filterCategory);
    params.set("page", String(page));
    params.set("pageSize", "20");
    const qs = params.toString();

    fetch(`/api/tenants/${tenant.slug}/risks${qs ? `?${qs}` : ""}`)
      .then((res) => res.json())
      .then((res) => {
        setRisks(res.data || []);
        if (res.totalPages !== undefined) {
          setTotalPages(res.totalPages);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenant.slug, filterLevel, filterStatus, filterCategory, page]);

  useEffect(() => {
    fetchRisks();
  }, [fetchRisks]);

  const filtered = risks.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.code.toLowerCase().includes(q) ||
      r.title.toLowerCase().includes(q) ||
      r.project?.name.toLowerCase().includes(q) ||
      false
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-title-1 text-foreground-primary">Riscos</h1>
        <p className="text-body-1 text-foreground-secondary mt-1">
          Visão consolidada dos riscos de todos os projetos
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Buscar por código, título ou projeto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-foreground-tertiary flex-shrink-0" />
          <select
            value={filterLevel}
            onChange={(e) => { setFilterLevel(e.target.value); setPage(1); }}
            className="h-10 rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-2 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
          >
            {RISK_LEVELS.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="h-10 rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-2 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
          >
            {RISK_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select
            value={filterCategory}
            onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
            className="h-10 rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-2 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
          >
            {RISK_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          {(filterLevel || filterStatus || filterCategory) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setFilterLevel(""); setFilterStatus(""); setFilterCategory(""); setPage(1); }}
              className="text-foreground-tertiary"
            >
              Limpar
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-surface-tertiary rounded w-1/4" />
                  <div className="h-5 bg-surface-tertiary rounded w-3/4" />
                  <div className="h-4 bg-surface-tertiary rounded w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <ShieldAlert className="h-12 w-12 text-foreground-tertiary mb-4" />
            <p className="text-title-3 text-foreground-primary mb-1">
              {search || filterLevel || filterStatus || filterCategory
                ? "Nenhum risco encontrado"
                : "Nenhum risco registrado"}
            </p>
            <p className="text-body-1 text-foreground-secondary">
              {search || filterLevel || filterStatus || filterCategory
                ? "Tente ajustar os filtros ou termos de busca"
                : "Registre riscos nos projetos para visualizá-los aqui"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((risk) => (
            <Link
              key={risk.id}
              href={`/${tenant.slug}/projects/${risk.project?.id}/risks`}
            >
              <Card className="cursor-pointer hover:shadow-card-glow transition-shadow h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="text-caption-1 text-foreground-tertiary font-mono">
                        {risk.code}
                      </p>
                      <h3 className="text-body-1 font-medium text-foreground-primary mt-0.5 line-clamp-2">
                        {risk.title}
                      </h3>
                    </div>
                    <Badge variant={LEVEL_COLORS[risk.riskLevel] || ""} className="flex-shrink-0">
                      {getRiskLevelLabel(risk.riskLevel)}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-3">
                    {risk.project && (
                      <div className="flex items-center gap-1.5 text-body-2 text-foreground-secondary">
                        <FolderKanban className="h-3.5 w-3.5" />
                        <span className="truncate">{risk.project.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-body-2 text-foreground-secondary">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      <span>{CATEGORY_LABELS[risk.category] || risk.category}</span>
                      <span className="text-foreground-tertiary">
                        ({risk.probability}×{risk.impact})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-stroke-secondary">
                    <Badge variant={getStatusColor(risk.status)}>
                      {getStatusLabel(risk.status)}
                    </Badge>
                    <div className="flex items-center gap-3 text-caption-1 text-foreground-tertiary">
                      {risk.responsible && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {risk.responsible.name.split(" ")[0]}
                        </span>
                      )}
                      {risk._count && risk._count.treatments > 0 && (
                        <span>{risk._count.treatments} tratamento(s)</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
