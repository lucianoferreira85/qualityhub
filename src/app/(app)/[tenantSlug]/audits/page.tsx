"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTenant } from "@/hooks/use-tenant";
import { useViewPreference } from "@/hooks/use-view-preference";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Pagination } from "@/components/ui/pagination";
import { FilterBar } from "@/components/ui/filter-bar";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Plus, Search, FolderKanban, User, Calendar, FileSearch } from "lucide-react";
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

const TABLE_COLUMNS: Column<AuditWithRelations>[] = [
  { key: "title", label: "Título", sortable: true, render: (a) => (
    <span className="font-medium text-foreground-primary line-clamp-1">{a.title}</span>
  )},
  { key: "type", label: "Tipo", render: (a) => (
    <Badge variant={AUDIT_TYPE_COLORS[a.type] || ""}>{getAuditTypeLabel(a.type)}</Badge>
  )},
  { key: "status", label: "Status", render: (a) => <StatusBadge status={a.status} /> },
  { key: "project", label: "Projeto", render: (a) => (
    <span className="text-foreground-secondary truncate">{a.project?.name || "—"}</span>
  )},
  { key: "leadAuditor", label: "Auditor", render: (a) => (
    <span className="text-foreground-secondary">{a.leadAuditor?.name?.split(" ")[0] || "—"}</span>
  )},
  { key: "startDate", label: "Período", render: (a) => (
    <span className="text-foreground-secondary">
      {formatDate(a.startDate)}
      {a.endDate && ` — ${formatDate(a.endDate)}`}
    </span>
  )},
  { key: "findings", label: "Constatações", render: (a) => (
    <span className="text-foreground-secondary">{a._count?.findings || 0}</span>
  )},
];

export default function AuditsPage() {
  const { tenant, can } = useTenant();
  const router = useRouter();
  const [audits, setAudits] = useState<AuditWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [view, setView] = useViewPreference("audits");

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

  const hasActiveFilters = !!(filterType || filterStatus);

  const handleFilterChange = (key: string, value: string) => {
    if (key === "type") { setFilterType(value); setPage(1); }
    if (key === "status") { setFilterStatus(value); setPage(1); }
  };

  const clearFilters = () => {
    setFilterType("");
    setFilterStatus("");
    setPage(1);
  };

  const handleExport = () => {
    exportToCSV(filtered, CSV_COLUMNS, "auditorias");
    toast.success("CSV exportado com sucesso");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-1 text-foreground-primary">Auditorias</h1>
          <p className="text-body-1 text-foreground-secondary mt-1">
            Gerencie as auditorias internas e externas
          </p>
        </div>
        {can("audit", "create") && (
          <Link href={`/${tenant.slug}/audits/new`}>
            <Button>
              <Plus className="h-4 w-4" />
              Nova Auditoria
            </Button>
          </Link>
        )}
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por título, projeto ou tipo..."
        filters={[
          { key: "type", options: AUDIT_TYPES, value: filterType },
          { key: "status", options: AUDIT_STATUSES, value: filterStatus },
        ]}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
        onExport={handleExport}
        viewToggle={{ view, onChange: setView }}
      />

      {view === "cards" ? (
        <>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Search}
              title={hasActiveFilters || search ? "Nenhuma auditoria encontrada" : "Nenhuma auditoria registrada"}
              description={hasActiveFilters || search
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
                        <h3 className="text-body-1 font-medium text-foreground-primary line-clamp-2">{audit.title}</h3>
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
        </>
      ) : (
        <DataTable
          columns={TABLE_COLUMNS}
          data={filtered}
          loading={loading}
          onRowClick={(a) => router.push(`/${tenant.slug}/audits/${a.id}`)}
          emptyMessage={hasActiveFilters || search ? "Nenhuma auditoria encontrada" : "Nenhuma auditoria registrada"}
          emptyDescription={hasActiveFilters || search
            ? "Tente ajustar os filtros ou termos de busca"
            : "Agende a primeira auditoria para começar"}
        />
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
