"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, BookOpen, FolderKanban, Calendar, Filter } from "lucide-react";
import { formatDate } from "@/lib/utils";

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

interface ReviewItem {
  id: string;
  scheduledDate: string;
  actualDate: string | null;
  status: string;
  minutes: string | null;
  decisions: unknown[];
  project: { id: string; name: string };
}

export default function ManagementReviewsPage() {
  const { tenant, can } = useTenant();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");

  const fetchReviews = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    const qs = params.toString();

    fetch(`/api/tenants/${tenant.slug}/management-reviews${qs ? `?${qs}` : ""}`)
      .then((res) => res.json())
      .then((res) => setReviews(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenant.slug, filterStatus]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

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

      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-foreground-tertiary flex-shrink-0" />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-10 rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-2 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
        >
          {REVIEW_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        {filterStatus && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilterStatus("")}
            className="text-foreground-tertiary"
          >
            Limpar
          </Button>
        )}
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
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <BookOpen className="h-12 w-12 text-foreground-tertiary mb-4" />
            <p className="text-title-3 text-foreground-primary mb-1">
              {filterStatus
                ? "Nenhuma análise crítica encontrada"
                : "Nenhuma análise crítica registrada"}
            </p>
            <p className="text-body-1 text-foreground-secondary">
              {filterStatus
                ? "Tente ajustar o filtro de status"
                : "Agende a primeira reunião de análise crítica"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((review) => (
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
    </div>
  );
}
