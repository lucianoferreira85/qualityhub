"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTenant } from "@/hooks/use-tenant";
import { usePageTitle } from "@/hooks/use-page-title";
import { useViewPreference } from "@/hooks/use-view-preference";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CardSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Pagination } from "@/components/ui/pagination";
import { FilterBar } from "@/components/ui/filter-bar";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Plus, Cog, FolderKanban, User, TrendingUp } from "lucide-react";
import { getProcessStatusLabel } from "@/lib/utils";
import { exportToCSV, type CsvColumn } from "@/lib/export";
import { toast } from "sonner";

const PROCESS_STATUSES = [
  { value: "", label: "Todos os status" },
  { value: "active", label: "Ativo" },
  { value: "inactive", label: "Inativo" },
  { value: "draft", label: "Rascunho" },
];

const PROCESS_CATEGORIES = [
  { value: "", label: "Todas as categorias" },
  { value: "core", label: "Principal" },
  { value: "support", label: "Suporte" },
  { value: "management", label: "Gestão" },
];

const CATEGORY_LABELS: Record<string, string> = {
  core: "Principal",
  support: "Suporte",
  management: "Gestão",
};

const CSV_COLUMNS: CsvColumn<ProcessItem>[] = [
  { key: "code", label: "Código" },
  { key: "name", label: "Nome" },
  { key: "category", label: "Categoria", formatter: (_v, row) => CATEGORY_LABELS[row.category || ""] || row.category || "" },
  { key: "status", label: "Status", formatter: (_v, row) => getProcessStatusLabel(row.status) },
  { key: "responsible", label: "Responsável", formatter: (_v, row) => row.responsible?.name || "" },
];

interface ProcessItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: string;
  category: string | null;
  project?: { id: string; name: string };
  responsible?: { id: string; name: string } | null;
  _count?: { indicators: number };
}

const TABLE_COLUMNS: Column<ProcessItem>[] = [
  { key: "code", label: "Código", sortable: true, render: (p) => (
    <span className="text-foreground-tertiary font-mono">{p.code}</span>
  )},
  { key: "name", label: "Nome", sortable: true, render: (p) => (
    <span className="font-medium text-foreground-primary line-clamp-1">{p.name}</span>
  )},
  { key: "category", label: "Categoria", render: (p) => (
    <span className="text-foreground-secondary">{CATEGORY_LABELS[p.category || ""] || p.category || "—"}</span>
  )},
  { key: "status", label: "Status", render: (p) => <StatusBadge status={p.status} type="processStatus" /> },
  { key: "responsible", label: "Responsável", render: (p) => (
    <span className="text-foreground-secondary">{p.responsible?.name?.split(" ")[0] || "—"}</span>
  )},
  { key: "project", label: "Projeto", render: (p) => (
    <span className="text-foreground-secondary truncate">{p.project?.name || "—"}</span>
  )},
  { key: "indicators", label: "Indicadores", render: (p) => (
    <span className="text-foreground-secondary">{p._count?.indicators || 0}</span>
  )},
];

export default function ProcessesPage() {
  const { tenant, can } = useTenant();
  usePageTitle("Processos");
  const router = useRouter();
  const [processes, setProcesses] = useState<ProcessItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [view, setView] = useViewPreference("processes");

  const fetchProcesses = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    if (filterCategory) params.set("category", filterCategory);
    params.set("page", String(page));
    params.set("pageSize", "20");
    const qs = params.toString();

    fetch(`/api/tenants/${tenant.slug}/processes${qs ? `?${qs}` : ""}`)
      .then((res) => res.json())
      .then((res) => {
        setProcesses(res.data || []);
        if (res.totalPages !== undefined) {
          setTotalPages(res.totalPages);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenant.slug, filterStatus, filterCategory, page]);

  useEffect(() => {
    fetchProcesses();
  }, [fetchProcesses]);

  const filtered = processes.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.code.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.project?.name.toLowerCase().includes(q) ||
      false
    );
  });

  const hasActiveFilters = !!(filterStatus || filterCategory);

  const handleFilterChange = (key: string, value: string) => {
    if (key === "status") { setFilterStatus(value); setPage(1); }
    if (key === "category") { setFilterCategory(value); setPage(1); }
  };

  const clearFilters = () => {
    setFilterStatus("");
    setFilterCategory("");
    setPage(1);
  };

  const handleExport = () => {
    exportToCSV(filtered, CSV_COLUMNS, "processos");
    toast.success("CSV exportado com sucesso");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-1 text-foreground-primary">Processos</h1>
          <p className="text-body-1 text-foreground-secondary mt-1">
            Gerencie os processos da organização
          </p>
        </div>
        {can("process" as never, "create") && (
          <Link href={`/${tenant.slug}/processes/new`}>
            <Button>
              <Plus className="h-4 w-4" />
              Novo Processo
            </Button>
          </Link>
        )}
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por código, nome ou projeto..."
        filters={[
          { key: "status", options: PROCESS_STATUSES, value: filterStatus },
          { key: "category", options: PROCESS_CATEGORIES, value: filterCategory },
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
              icon={Cog}
              title={hasActiveFilters || search ? "Nenhum processo encontrado" : "Nenhum processo registrado"}
              description={hasActiveFilters || search
                ? "Tente ajustar os filtros ou termos de busca"
                : "Crie o primeiro processo para começar"}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((proc) => (
                <Link key={proc.id} href={`/${tenant.slug}/processes/${proc.id}`}>
                  <Card className="cursor-pointer hover:shadow-card-glow transition-shadow h-full">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="min-w-0">
                          <p className="text-caption-1 text-foreground-tertiary font-mono">{proc.code}</p>
                          <h3 className="text-body-1 font-medium text-foreground-primary mt-0.5 line-clamp-2">{proc.name}</h3>
                        </div>
                        <StatusBadge status={proc.status} type="processStatus" className="flex-shrink-0" />
                      </div>

                      <div className="space-y-2 mb-3">
                        {proc.project && (
                          <div className="flex items-center gap-1.5 text-body-2 text-foreground-secondary">
                            <FolderKanban className="h-3.5 w-3.5" />
                            <span className="truncate">{proc.project.name}</span>
                          </div>
                        )}
                        {proc.category && (
                          <div className="flex items-center gap-1.5 text-body-2 text-foreground-secondary">
                            <Cog className="h-3.5 w-3.5" />
                            <span>{CATEGORY_LABELS[proc.category] || proc.category}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-stroke-secondary">
                        <div className="flex items-center gap-3 text-caption-1 text-foreground-tertiary">
                          {proc.responsible && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {proc.responsible.name.split(" ")[0]}
                            </span>
                          )}
                        </div>
                        {proc._count && proc._count.indicators > 0 && (
                          <span className="flex items-center gap-1 text-caption-1 text-foreground-tertiary">
                            <TrendingUp className="h-3 w-3" />
                            {proc._count.indicators} indicador(es)
                          </span>
                        )}
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
          onRowClick={(p) => router.push(`/${tenant.slug}/processes/${p.id}`)}
          emptyMessage={hasActiveFilters || search ? "Nenhum processo encontrado" : "Nenhum processo registrado"}
          emptyDescription={hasActiveFilters || search
            ? "Tente ajustar os filtros ou termos de busca"
            : "Crie o primeiro processo para começar"}
          emptyIcon={Cog}
        />
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
