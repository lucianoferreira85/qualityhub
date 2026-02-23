"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CardSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { Plus, ClipboardCheck, FolderKanban, User, Calendar, AlertTriangle, ShieldAlert, Filter, Download } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { getStatusLabel, formatDate } from "@/lib/utils";
import { exportToCSV, type CsvColumn } from "@/lib/export";
import { toast } from "sonner";
import type { ActionPlan } from "@/types";

const ACTION_TYPES = [
  { value: "", label: "Todos os tipos" },
  { value: "corrective", label: "Corretiva" },
  { value: "preventive", label: "Preventiva" },
  { value: "improvement", label: "Melhoria" },
];

const ACTION_STATUSES = [
  { value: "", label: "Todos os status" },
  { value: "planned", label: "Planejada" },
  { value: "in_progress", label: "Em Execução" },
  { value: "completed", label: "Concluída" },
  { value: "verified", label: "Verificada" },
  { value: "effective", label: "Eficaz" },
  { value: "ineffective", label: "Ineficaz" },
];

const TYPE_LABELS: Record<string, string> = {
  corrective: "Corretiva",
  preventive: "Preventiva",
  improvement: "Melhoria",
};

const TYPE_COLORS: Record<string, string> = {
  corrective: "bg-danger-bg text-danger-fg",
  preventive: "bg-info-bg text-info-fg",
  improvement: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
};

const CSV_COLUMNS: CsvColumn<ApWithRelations>[] = [
  { key: "code", label: "Código" },
  { key: "title", label: "Título" },
  { key: "type", label: "Tipo", formatter: (v) => TYPE_LABELS[String(v ?? "")] || String(v ?? "") },
  { key: "status", label: "Status", formatter: (v) => getStatusLabel(String(v ?? "")) },
  { key: "responsible", label: "Responsável", formatter: (_v, row) => row.responsible?.name || "" },
  { key: "dueDate", label: "Prazo", formatter: (v) => v ? formatDate(String(v)) : "" },
];

interface ApWithRelations extends Omit<ActionPlan, "responsible" | "nonconformity" | "risk"> {
  project?: { id: string; name: string };
  responsible?: { id: string; name: string } | null;
  nonconformity?: { id: string; code: string; title: string } | null;
  risk?: { id: string; code: string; title: string } | null;
}

export default function ActionPlansPage() {
  const { tenant, can } = useTenant();
  const [plans, setPlans] = useState<ApWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPlans = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterType) params.set("type", filterType);
    if (filterStatus) params.set("status", filterStatus);
    params.set("page", String(page));
    params.set("pageSize", "20");
    const qs = params.toString();

    fetch(`/api/tenants/${tenant.slug}/action-plans${qs ? `?${qs}` : ""}`)
      .then((res) => res.json())
      .then((res) => {
        setPlans(res.data || []);
        if (res.totalPages !== undefined) {
          setTotalPages(res.totalPages);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenant.slug, filterType, filterStatus, page]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const filtered = plans.filter((ap) => {
    const q = search.toLowerCase();
    return (
      ap.code.toLowerCase().includes(q) ||
      ap.title.toLowerCase().includes(q) ||
      ap.project?.name.toLowerCase().includes(q) ||
      ap.nonconformity?.code.toLowerCase().includes(q) ||
      false
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-1 text-foreground-primary">
            Planos de Ação
          </h1>
          <p className="text-body-1 text-foreground-secondary mt-1">
            Acompanhe os planos de ação corretiva e preventiva
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              exportToCSV(filtered, CSV_COLUMNS, "planos-de-acao");
              toast.success("CSV exportado com sucesso");
            }}
            disabled={filtered.length === 0}
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
          {can("actionPlan", "create") && (
            <Link href={`/${tenant.slug}/action-plans/new`}>
              <Button>
                <Plus className="h-4 w-4" />
                Novo Plano
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Buscar por código, título, projeto ou NC..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-foreground-tertiary flex-shrink-0" />
          <Select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
            options={ACTION_TYPES}
          />
          <Select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            options={ACTION_STATUSES}
          />
          {(filterType || filterStatus) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setFilterType(""); setFilterStatus(""); setPage(1); }}
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
          icon={ClipboardCheck}
          title={search || filterType || filterStatus
            ? "Nenhum plano encontrado"
            : "Nenhum plano de ação registrado"}
          description={search || filterType || filterStatus
            ? "Tente ajustar os filtros ou termos de busca"
            : "Crie o primeiro plano de ação para começar"}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((ap) => (
            <Link key={ap.id} href={`/${tenant.slug}/action-plans/${ap.id}`}>
              <Card className="cursor-pointer hover:shadow-card-glow transition-shadow h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="text-caption-1 text-foreground-tertiary font-mono">
                        {ap.code}
                      </p>
                      <h3 className="text-body-1 font-medium text-foreground-primary mt-0.5 line-clamp-2">
                        {ap.title}
                      </h3>
                    </div>
                    <Badge variant={TYPE_COLORS[ap.type] || ""} className="flex-shrink-0">
                      {TYPE_LABELS[ap.type] || ap.type}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-3">
                    {ap.project && (
                      <div className="flex items-center gap-1.5 text-body-2 text-foreground-secondary">
                        <FolderKanban className="h-3.5 w-3.5" />
                        <span className="truncate">{ap.project.name}</span>
                      </div>
                    )}
                    {ap.nonconformity && (
                      <div className="flex items-center gap-1.5 text-body-2 text-foreground-secondary">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span className="truncate">{ap.nonconformity.code} - {ap.nonconformity.title}</span>
                      </div>
                    )}
                    {ap.risk && (
                      <div className="flex items-center gap-1.5 text-body-2 text-foreground-secondary">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        <span className="truncate">{ap.risk.code} - {ap.risk.title}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-stroke-secondary">
                    <StatusBadge status={ap.status} />
                    <div className="flex items-center gap-3 text-caption-1 text-foreground-tertiary">
                      {ap.responsible && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {ap.responsible.name.split(" ")[0]}
                        </span>
                      )}
                      {ap.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(ap.dueDate)}
                        </span>
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
