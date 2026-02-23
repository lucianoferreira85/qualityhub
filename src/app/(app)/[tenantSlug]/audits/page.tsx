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
import { Plus, Search, FolderKanban, User, Calendar, FileSearch, Filter, Download } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { getStatusLabel, getAuditTypeLabel, formatDate } from "@/lib/utils";
import { exportToCSV, type CsvColumn } from "@/lib/export";
import { toast } from "sonner";
import type { Audit } from "@/types";

const AUDIT_TYPES = [
  { value: "", label: "Todos os tipos" },
  { value: "internal", label: "Interna" },
  { value: "external", label: "Externa" },
  { value: "supplier", label: "Fornecedor" },
  { value: "certification", label: "Certificação" },
];

const AUDIT_STATUSES = [
  { value: "", label: "Todos os status" },
  { value: "planned", label: "Planejada" },
  { value: "in_progress", label: "Em Andamento" },
  { value: "completed", label: "Concluída" },
  { value: "cancelled", label: "Cancelada" },
];

const AUDIT_TYPE_COLORS: Record<string, string> = {
  internal: "bg-info-bg text-info-fg",
  external: "bg-brand-light text-brand",
  supplier: "bg-warning-bg text-warning-fg",
  certification: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
};

const CSV_COLUMNS: CsvColumn<AuditWithRelations>[] = [
  { key: "code", label: "Código" },
  { key: "title", label: "Título" },
  { key: "type", label: "Tipo", formatter: (v) => getAuditTypeLabel(String(v ?? "")) },
  { key: "status", label: "Status", formatter: (v) => getStatusLabel(String(v ?? "")) },
  { key: "startDate", label: "Início", formatter: (v) => v ? formatDate(String(v)) : "" },
  { key: "endDate", label: "Fim", formatter: (v) => v ? formatDate(String(v)) : "" },
  { key: "leadAuditor", label: "Auditor Líder", formatter: (_v, row) => row.leadAuditor?.name || "" },
];

interface AuditWithRelations extends Omit<Audit, "leadAuditor"> {
  project?: { id: string; name: string };
  leadAuditor?: { id: string; name: string } | null;
  _count?: { findings: number };
}

export default function AuditsPage() {
  const { tenant, can } = useTenant();
  const [audits, setAudits] = useState<AuditWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchAudits = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterType) params.set("type", filterType);
    if (filterStatus) params.set("status", filterStatus);
    params.set("page", String(page));
    params.set("pageSize", "20");
    const qs = params.toString();

    fetch(`/api/tenants/${tenant.slug}/audits${qs ? `?${qs}` : ""}`)
      .then((res) => res.json())
      .then((res) => {
        setAudits(res.data || []);
        if (res.totalPages !== undefined) {
          setTotalPages(res.totalPages);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenant.slug, filterType, filterStatus, page]);

  useEffect(() => {
    fetchAudits();
  }, [fetchAudits]);

  const filtered = audits.filter((a) => {
    const q = search.toLowerCase();
    return (
      a.title.toLowerCase().includes(q) ||
      a.project?.name.toLowerCase().includes(q) ||
      getAuditTypeLabel(a.type).toLowerCase().includes(q) ||
      false
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-1 text-foreground-primary">Auditorias</h1>
          <p className="text-body-1 text-foreground-secondary mt-1">
            Gerencie as auditorias internas e externas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              exportToCSV(filtered, CSV_COLUMNS, "auditorias");
              toast.success("CSV exportado com sucesso");
            }}
            disabled={filtered.length === 0}
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
          {can("audit", "create") && (
            <Link href={`/${tenant.slug}/audits/new`}>
              <Button>
                <Plus className="h-4 w-4" />
                Nova Auditoria
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Buscar por título, projeto ou tipo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-foreground-tertiary flex-shrink-0" />
          <Select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
            options={AUDIT_TYPES}
          />
          <Select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            options={AUDIT_STATUSES}
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
          icon={Search}
          title={search || filterType || filterStatus
            ? "Nenhuma auditoria encontrada"
            : "Nenhuma auditoria registrada"}
          description={search || filterType || filterStatus
            ? "Tente ajustar os filtros ou termos de busca"
            : "Agende a primeira auditoria para começar"}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((audit) => (
            <Link key={audit.id} href={`/${tenant.slug}/audits/${audit.id}`}>
              <Card className="cursor-pointer hover:shadow-card-glow transition-shadow h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-body-1 font-medium text-foreground-primary line-clamp-2">
                      {audit.title}
                    </h3>
                    <Badge variant={AUDIT_TYPE_COLORS[audit.type] || ""} className="flex-shrink-0">
                      {getAuditTypeLabel(audit.type)}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-3">
                    {audit.project && (
                      <div className="flex items-center gap-1.5 text-body-2 text-foreground-secondary">
                        <FolderKanban className="h-3.5 w-3.5" />
                        <span className="truncate">{audit.project.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-body-2 text-foreground-secondary">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {formatDate(audit.startDate)}
                        {audit.endDate && ` — ${formatDate(audit.endDate)}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-stroke-secondary">
                    <StatusBadge status={audit.status} />
                    <div className="flex items-center gap-3 text-caption-1 text-foreground-tertiary">
                      {audit.leadAuditor && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {audit.leadAuditor.name.split(" ")[0]}
                        </span>
                      )}
                      {audit._count && audit._count.findings > 0 && (
                        <span className="flex items-center gap-1">
                          <FileSearch className="h-3 w-3" />
                          {audit._count.findings}
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
