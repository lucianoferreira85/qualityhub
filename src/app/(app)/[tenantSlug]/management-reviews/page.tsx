"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTenant } from "@/hooks/use-tenant";
import { usePageTitle } from "@/hooks/use-page-title";
import { useViewPreference } from "@/hooks/use-view-preference";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { FilterBar } from "@/components/ui/filter-bar";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Plus, BookOpen, FolderKanban, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { exportToCSV, type CsvColumn } from "@/lib/export";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-info-bg text-info-fg",
  in_progress: "bg-warning-bg text-warning-fg",
  completed: "bg-success-bg text-success-fg",
  cancelled: "bg-gray-100 text-gray-800",
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Agendada",
  in_progress: "Em Andamento",
  completed: "Concluída",
  cancelled: "Cancelada",
};

const REVIEW_STATUSES = [
  { value: "", label: "Todos os status" },
  { value: "scheduled", label: "Agendada" },
  { value: "in_progress", label: "Em Andamento" },
  { value: "completed", label: "Concluída" },
  { value: "cancelled", label: "Cancelada" },
];

const CSV_COLUMNS: CsvColumn<ReviewItem>[] = [
  { key: "project", label: "Projeto", formatter: (_v, row) => row.project?.name || "" },
  { key: "scheduledDate", label: "Data Agendada", formatter: (_v, row) => row.scheduledDate ? formatDate(row.scheduledDate) : "" },
  { key: "status", label: "Status", formatter: (_v, row) => STATUS_LABELS[row.status] || row.status },
];

interface ReviewItem {
  id: string;
  scheduledDate: string;
  actualDate: string | null;
  status: string;
  minutes: string | null;
  decisions: unknown[];
  project: { id: string; name: string };
}

const TABLE_COLUMNS: Column<ReviewItem>[] = [
  { key: "title", label: "Análise", sortable: true, render: (r) => (
    <span className="font-medium text-foreground-primary">
      Análise Crítica — {formatDate(r.scheduledDate)}
    </span>
  )},
  { key: "project", label: "Projeto", render: (r) => (
    <span className="text-foreground-secondary truncate">{r.project.name}</span>
  )},
  { key: "status", label: "Status", render: (r) => (
    <Badge variant={STATUS_COLORS[r.status] || ""}>
      {STATUS_LABELS[r.status] || r.status}
    </Badge>
  )},
  { key: "scheduledDate", label: "Agendada", sortable: true, render: (r) => (
    <span className="text-foreground-secondary">{formatDate(r.scheduledDate)}</span>
  )},
  { key: "actualDate", label: "Realizada", render: (r) => (
    <span className="text-foreground-secondary">{r.actualDate ? formatDate(r.actualDate) : "—"}</span>
  )},
  { key: "decisions", label: "Decisões", render: (r) => (
    <span className="text-foreground-secondary">{(r.decisions as unknown[]).length}</span>
  )},
  { key: "minutes", label: "Ata", render: (r) => (
    <span className="text-foreground-secondary">{r.minutes ? "Sim" : "—"}</span>
  )},
];

export default function ManagementReviewsPage() {
  const { tenant, can } = useTenant();
  usePageTitle("Analise Critica");
  const router = useRouter();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [view, setView] = useViewPreference("management-reviews");

  const fetchReviews = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    params.set("page", String(page));
    params.set("pageSize", "20");
    const qs = params.toString();

    fetch(`/api/tenants/${tenant.slug}/management-reviews${qs ? `?${qs}` : ""}`)
      .then((res) => res.json())
      .then((res) => {
        setReviews(res.data || []);
        if (res.totalPages !== undefined) {
          setTotalPages(res.totalPages);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenant.slug, filterStatus, page]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const filtered = reviews.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.project.name.toLowerCase().includes(q) ||
      (STATUS_LABELS[r.status] || r.status).toLowerCase().includes(q) ||
      false
    );
  });

  const hasActiveFilters = !!filterStatus;

  const handleFilterChange = (key: string, value: string) => {
    if (key === "status") { setFilterStatus(value); setPage(1); }
  };

  const clearFilters = () => {
    setFilterStatus("");
    setPage(1);
  };

  const handleExport = () => {
    exportToCSV(filtered, CSV_COLUMNS, "analises-criticas");
    toast.success("CSV exportado com sucesso");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-1 text-foreground-primary">Análise Crítica da Direção</h1>
          <p className="text-body-1 text-foreground-secondary mt-1">
            Reuniões de análise crítica pela alta direção
          </p>
        </div>
        {can("managementReview", "create") && (
          <Link href={`/${tenant.slug}/management-reviews/new`}>
            <Button>
              <Plus className="h-4 w-4" />
              Nova Análise
            </Button>
          </Link>
        )}
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por projeto ou status..."
        filters={[
          { key: "status", options: REVIEW_STATUSES, value: filterStatus },
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
              icon={BookOpen}
              title={hasActiveFilters || search ? "Nenhuma análise crítica encontrada" : "Nenhuma análise crítica registrada"}
              description={hasActiveFilters || search
                ? "Tente ajustar os filtros ou termos de busca"
                : "Agende a primeira reunião de análise crítica"}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((review) => (
                <Link key={review.id} href={`/${tenant.slug}/management-reviews/${review.id}`}>
                  <Card className="cursor-pointer hover:shadow-card-glow transition-shadow h-full">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h3 className="text-body-1 font-medium text-foreground-primary">
                          Análise Crítica — {formatDate(review.scheduledDate)}
                        </h3>
                        <Badge variant={STATUS_COLORS[review.status] || ""} className="flex-shrink-0">
                          {STATUS_LABELS[review.status] || review.status}
                        </Badge>
                      </div>

                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-1.5 text-body-2 text-foreground-secondary">
                          <FolderKanban className="h-3.5 w-3.5" />
                          <span className="truncate">{review.project.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-body-2 text-foreground-secondary">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            Agendada: {formatDate(review.scheduledDate)}
                            {review.actualDate && ` | Realizada: ${formatDate(review.actualDate)}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-stroke-secondary">
                        <span className="text-caption-1 text-foreground-tertiary">
                          {(review.decisions as unknown[]).length} decisão(ões)
                        </span>
                        {review.minutes && (
                          <span className="text-caption-1 text-foreground-tertiary">
                            Ata registrada
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
          onRowClick={(r) => router.push(`/${tenant.slug}/management-reviews/${r.id}`)}
          emptyMessage={hasActiveFilters || search ? "Nenhuma análise crítica encontrada" : "Nenhuma análise crítica registrada"}
          emptyDescription={hasActiveFilters || search
            ? "Tente ajustar os filtros ou termos de busca"
            : "Agende a primeira reunião de análise crítica"}
          emptyIcon={BookOpen}
        />
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
