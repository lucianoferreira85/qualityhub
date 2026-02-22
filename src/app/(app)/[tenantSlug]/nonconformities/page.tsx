"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, AlertTriangle, FolderKanban, User, Calendar, Filter } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { getStatusColor, getStatusLabel, getSeverityColor, getSeverityLabel, getOriginLabel, formatDate } from "@/lib/utils";
import type { Nonconformity } from "@/types";

const NC_ORIGINS = [
  { value: "", label: "Todas as origens" },
  { value: "internal", label: "Interna" },
  { value: "audit", label: "Auditoria" },
  { value: "customer_complaint", label: "Reclamação de Cliente" },
  { value: "supplier", label: "Fornecedor" },
  { value: "process", label: "Processo" },
  { value: "management_review", label: "Análise Crítica" },
];

const NC_SEVERITIES = [
  { value: "", label: "Todas as severidades" },
  { value: "observation", label: "Observação" },
  { value: "minor", label: "Menor" },
  { value: "major", label: "Maior" },
  { value: "critical", label: "Crítica" },
];

const NC_STATUSES = [
  { value: "", label: "Todos os status" },
  { value: "open", label: "Aberta" },
  { value: "analysis", label: "Em Análise" },
  { value: "action_defined", label: "Ação Definida" },
  { value: "in_execution", label: "Em Execução" },
  { value: "effectiveness_check", label: "Verificação de Eficácia" },
  { value: "closed", label: "Fechada" },
];

interface NcWithRelations extends Omit<Nonconformity, "responsible"> {
  project?: { id: string; name: string };
  responsible?: { id: string; name: string } | null;
  _count?: { actionPlans: number };
}

export default function NonconformitiesPage() {
  const { tenant, can } = useTenant();
  const [ncs, setNcs] = useState<NcWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterOrigin, setFilterOrigin] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchNcs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterOrigin) params.set("origin", filterOrigin);
    if (filterSeverity) params.set("severity", filterSeverity);
    if (filterStatus) params.set("status", filterStatus);
    params.set("page", String(page));
    params.set("pageSize", "20");
    const qs = params.toString();

    fetch(`/api/tenants/${tenant.slug}/nonconformities${qs ? `?${qs}` : ""}`)
      .then((res) => res.json())
      .then((res) => {
        setNcs(res.data || []);
        if (res.totalPages !== undefined) {
          setTotalPages(res.totalPages);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenant.slug, filterOrigin, filterSeverity, filterStatus, page]);

  useEffect(() => {
    fetchNcs();
  }, [fetchNcs]);

  const filtered = ncs.filter((nc) => {
    const q = search.toLowerCase();
    return (
      nc.code.toLowerCase().includes(q) ||
      nc.title.toLowerCase().includes(q) ||
      nc.project?.name.toLowerCase().includes(q) ||
      false
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-1 text-foreground-primary">
            Não Conformidades
          </h1>
          <p className="text-body-1 text-foreground-secondary mt-1">
            Gerencie as não conformidades identificadas
          </p>
        </div>
        {can("nonconformity", "create") && (
          <Link href={`/${tenant.slug}/nonconformities/new`}>
            <Button>
              <Plus className="h-4 w-4" />
              Nova NC
            </Button>
          </Link>
        )}
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
            value={filterOrigin}
            onChange={(e) => { setFilterOrigin(e.target.value); setPage(1); }}
            className="h-10 rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-2 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
          >
            {NC_ORIGINS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            value={filterSeverity}
            onChange={(e) => { setFilterSeverity(e.target.value); setPage(1); }}
            className="h-10 rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-2 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
          >
            {NC_SEVERITIES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="h-10 rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-2 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
          >
            {NC_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          {(filterOrigin || filterSeverity || filterStatus) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setFilterOrigin(""); setFilterSeverity(""); setFilterStatus(""); setPage(1); }}
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
            <AlertTriangle className="h-12 w-12 text-foreground-tertiary mb-4" />
            <p className="text-title-3 text-foreground-primary mb-1">
              {search || filterOrigin || filterSeverity || filterStatus
                ? "Nenhuma NC encontrada"
                : "Nenhuma não conformidade registrada"}
            </p>
            <p className="text-body-1 text-foreground-secondary">
              {search || filterOrigin || filterSeverity || filterStatus
                ? "Tente ajustar os filtros ou termos de busca"
                : "Registre a primeira não conformidade para começar"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((nc) => (
            <Link
              key={nc.id}
              href={`/${tenant.slug}/nonconformities/${nc.id}`}
            >
              <Card className="cursor-pointer hover:shadow-card-glow transition-shadow h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="text-caption-1 text-foreground-tertiary font-mono">
                        {nc.code}
                      </p>
                      <h3 className="text-body-1 font-medium text-foreground-primary mt-0.5 line-clamp-2">
                        {nc.title}
                      </h3>
                    </div>
                    <Badge variant={getSeverityColor(nc.severity)} className="flex-shrink-0">
                      {getSeverityLabel(nc.severity)}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-3">
                    {nc.project && (
                      <div className="flex items-center gap-1.5 text-body-2 text-foreground-secondary">
                        <FolderKanban className="h-3.5 w-3.5" />
                        <span className="truncate">{nc.project.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-body-2 text-foreground-secondary">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>{getOriginLabel(nc.origin)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-stroke-secondary">
                    <Badge variant={getStatusColor(nc.status)}>
                      {getStatusLabel(nc.status)}
                    </Badge>
                    <div className="flex items-center gap-3 text-caption-1 text-foreground-tertiary">
                      {nc.responsible && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {nc.responsible.name.split(" ")[0]}
                        </span>
                      )}
                      {nc.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(nc.dueDate)}
                        </span>
                      )}
                      {nc._count && nc._count.actionPlans > 0 && (
                        <span>{nc._count.actionPlans} ação(ões)</span>
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
