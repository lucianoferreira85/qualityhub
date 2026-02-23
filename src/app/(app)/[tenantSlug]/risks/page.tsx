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
import { StatusBadge } from "@/components/ui/status-badge";
import { ShieldAlert, FolderKanban, User, Filter, Plus, Download } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { getRiskLevelLabel, getStatusLabel } from "@/lib/utils";
import { exportToCSV, type CsvColumn } from "@/lib/export";
import { toast } from "sonner";

const CSV_COLUMNS: CsvColumn<RiskItem>[] = [
  { key: "code", label: "Código" },
  { key: "title", label: "Título" },
  { key: "category", label: "Categoria", formatter: (v) => {
    const labels: Record<string, string> = { strategic: "Estratégico", operational: "Operacional", compliance: "Conformidade", financial: "Financeiro", technology: "Tecnologia", legal: "Legal" };
    return labels[String(v)] || String(v);
  }},
  { key: "riskLevel", label: "Nível", formatter: (v) => getRiskLevelLabel(String(v)) },
  { key: "status", label: "Status", formatter: (v) => getStatusLabel(String(v)) },
  { key: "project", label: "Projeto", formatter: (_v, row) => row.project?.name || "" },
];

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
  const { tenant, can } = useTenant();
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-1 text-foreground-primary">Riscos</h1>
          <p className="text-body-1 text-foreground-secondary mt-1">
            Visão consolidada dos riscos de todos os projetos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              exportToCSV(filtered, CSV_COLUMNS, "riscos");
              toast.success("CSV exportado com sucesso");
            }}
            disabled={filtered.length === 0}
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
          {can("risk", "create") && (
            <Link href={`/${tenant.slug}/risks/new`}>
              <Button size="sm">
                <Plus className="h-4 w-4" />
                Novo Risco
              </Button>
            </Link>
          )}
        </div>
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
          <Select
            value={filterLevel}
            onChange={(e) => { setFilterLevel(e.target.value); setPage(1); }}
            options={RISK_LEVELS}
          />
          <Select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            options={RISK_STATUSES}
          />
          <Select
            value={filterCategory}
            onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
            options={RISK_CATEGORIES}
          />
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
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title={
            search || filterLevel || filterStatus || filterCategory
              ? "Nenhum risco encontrado"
              : "Nenhum risco registrado"
          }
          description={
            search || filterLevel || filterStatus || filterCategory
              ? "Tente ajustar os filtros ou termos de busca"
              : "Registre riscos nos projetos para visualizá-los aqui"
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((risk) => (
            <Link
              key={risk.id}
              href={`/${tenant.slug}/risks/${risk.id}`}
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
                    <StatusBadge status={risk.status} type="status" />
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
