"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTenant } from "@/hooks/use-tenant";
import { useViewPreference } from "@/hooks/use-view-preference";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { CardSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { FilterBar } from "@/components/ui/filter-bar";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Plus, FolderKanban, Building2, Users } from "lucide-react";
import { getStatusLabel, formatDate } from "@/lib/utils";
import { exportToCSV, type CsvColumn } from "@/lib/export";
import { toast } from "sonner";
import type { Project } from "@/types";

const PROJECT_STATUSES = [
  { value: "", label: "Todos os status" },
  { value: "planning", label: "Planejamento" },
  { value: "in_progress", label: "Em Andamento" },
  { value: "completed", label: "Concluído" },
  { value: "archived", label: "Arquivado" },
];

const CSV_COLUMNS: CsvColumn<Project>[] = [
  { key: "name", label: "Nome" },
  { key: "status", label: "Status", formatter: (_v, row) => getStatusLabel(row.status) },
  { key: "client", label: "Cliente", formatter: (_v, row) => row.client?.name || "" },
  { key: "startDate", label: "Início", formatter: (_v, row) => row.startDate ? formatDate(String(row.startDate)) : "" },
  { key: "endDate", label: "Fim", formatter: (_v, row) => row.endDate ? formatDate(String(row.endDate)) : "" },
];

const TABLE_COLUMNS: Column<Project>[] = [
  { key: "name", label: "Nome", sortable: true, render: (p) => (
    <span className="font-medium text-foreground-primary">{p.name}</span>
  )},
  { key: "client", label: "Cliente", render: (p) => (
    <span className="text-foreground-secondary">{p.client?.name || "—"}</span>
  )},
  { key: "status", label: "Status", render: (p) => <StatusBadge status={p.status} /> },
  { key: "standards", label: "Normas", render: (p) => {
    const standards = p.standards || [];
    if (standards.length === 0) return <span className="text-foreground-tertiary">—</span>;
    return (
      <div className="flex flex-wrap gap-1">
        {standards.slice(0, 2).map((ps) => (
          <span key={ps.id} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-brand-light text-brand">
            {ps.standard?.code || "—"}
          </span>
        ))}
        {standards.length > 2 && (
          <span className="text-caption-2 text-foreground-tertiary">+{standards.length - 2}</span>
        )}
      </div>
    );
  }},
  { key: "progress", label: "Progresso", sortable: true, render: (p) => (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 bg-surface-tertiary rounded-full">
        <div className="h-full bg-brand rounded-full" style={{ width: `${Number(p.progress)}%` }} />
      </div>
      <span className="text-caption-1 text-foreground-tertiary">{Number(p.progress)}%</span>
    </div>
  )},
  { key: "startDate", label: "Início", render: (p) => (
    <span className="text-foreground-secondary">{p.startDate ? formatDate(String(p.startDate)) : "—"}</span>
  )},
  { key: "endDate", label: "Término", render: (p) => (
    <span className="text-foreground-secondary">{p.endDate ? formatDate(String(p.endDate)) : "—"}</span>
  )},
];

export default function ProjectsPage() {
  const { tenant, can } = useTenant();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [view, setView] = useViewPreference("projects");

  const fetchProjects = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    params.set("page", String(page));
    params.set("pageSize", "20");
    const qs = params.toString();

    fetch(`/api/tenants/${tenant.slug}/projects${qs ? `?${qs}` : ""}`)
      .then((res) => res.json())
      .then((res) => {
        setProjects(res.data || []);
        if (res.totalPages !== undefined) {
          setTotalPages(res.totalPages);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenant.slug, filterStatus, page]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.client?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleFilterChange = (key: string, value: string) => {
    if (key === "status") { setFilterStatus(value); setPage(1); }
  };

  const clearFilters = () => {
    setFilterStatus("");
    setPage(1);
  };

  const handleExport = () => {
    exportToCSV(filtered, CSV_COLUMNS, "projetos");
    toast.success("CSV exportado com sucesso");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-1 text-foreground-primary">Projetos</h1>
          <p className="text-body-1 text-foreground-secondary mt-1">
            Gerencie seus projetos de conformidade
          </p>
        </div>
        {can("project", "create") && (
          <Link href={`/${tenant.slug}/projects/new`}>
            <Button>
              <Plus className="h-4 w-4" />
              Novo Projeto
            </Button>
          </Link>
        )}
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por projeto ou cliente..."
        filters={[
          { key: "status", options: PROJECT_STATUSES, value: filterStatus },
        ]}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
        hasActiveFilters={!!filterStatus}
        onExport={handleExport}
        viewToggle={{ view, onChange: setView }}
      />

      {view === "cards" ? (
        <>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="Nenhum projeto encontrado"
              description={search || filterStatus
                ? "Tente ajustar os filtros ou termos de busca"
                : "Crie seu primeiro projeto para começar"}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((project) => {
                const counts = (project as unknown as { _count?: Record<string, number> })._count || {};
                const standards = project.standards || [];

                return (
                  <Link
                    key={project.id}
                    href={`/${tenant.slug}/projects/${project.id}`}
                  >
                    <Card className="cursor-pointer hover:shadow-card-glow transition-all h-full">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-title-3 text-foreground-primary line-clamp-1">
                            {project.name}
                          </h3>
                          <StatusBadge status={project.status} className="flex-shrink-0 ml-2" />
                        </div>

                        {project.client && (
                          <p className="text-body-2 text-foreground-secondary flex items-center gap-1 mb-1">
                            <Building2 className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{project.client.name}</span>
                          </p>
                        )}

                        {project.description && (
                          <p className="text-body-2 text-foreground-tertiary line-clamp-2 mb-3">
                            {project.description}
                          </p>
                        )}

                        {standards.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {standards.map((ps) => (
                              <span
                                key={ps.id}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-brand-light text-brand"
                              >
                                {ps.standard?.code || "—"}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-stroke-secondary">
                          <div className="flex items-center gap-3">
                            <span className="text-caption-1 text-foreground-tertiary">
                              {Number(project.progress)}%
                            </span>
                            <div className="h-1.5 w-16 bg-surface-tertiary rounded-full">
                              <div
                                className="h-full bg-brand rounded-full transition-all"
                                style={{ width: `${Number(project.progress)}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-caption-1 text-foreground-tertiary">
                            {counts.members > 0 && (
                              <span className="inline-flex items-center gap-0.5">
                                <Users className="h-3 w-3" />
                                {counts.members}
                              </span>
                            )}
                            {counts.risks > 0 && (
                              <span className="inline-flex items-center gap-0.5">
                                <RiskIcon className="h-3 w-3" />
                                {counts.risks}
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
        </>
      ) : (
        <DataTable
          columns={TABLE_COLUMNS}
          data={filtered}
          loading={loading}
          onRowClick={(p) => router.push(`/${tenant.slug}/projects/${p.id}`)}
          emptyMessage="Nenhum projeto encontrado"
          emptyDescription={search || filterStatus
            ? "Tente ajustar os filtros ou termos de busca"
            : "Crie seu primeiro projeto para começar"}
          emptyIcon={FolderKanban}
        />
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

function RiskIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}
