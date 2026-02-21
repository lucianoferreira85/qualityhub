"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, BookOpen, FolderKanban, Calendar } from "lucide-react";
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
  completed: "Concluida",
  cancelled: "Cancelada",
};

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

  useEffect(() => {
    fetch(`/api/tenants/${tenant.slug}/management-reviews`)
      .then((res) => res.json())
      .then((res) => setReviews(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenant.slug]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-1 text-foreground-primary">Analise Critica da Direcao</h1>
          <p className="text-body-1 text-foreground-secondary mt-1">
            Reunioes de analise critica pela alta direcao
          </p>
        </div>
        {can("managementReview", "create") && (
          <Link href={`/${tenant.slug}/management-reviews/new`}>
            <Button>
              <Plus className="h-4 w-4" />
              Nova Analise
            </Button>
          </Link>
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
              Nenhuma analise critica registrada
            </p>
            <p className="text-body-1 text-foreground-secondary">
              Agende a primeira reuniao de analise critica
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
                      Analise Critica — {formatDate(review.scheduledDate)}
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
                      {(review.decisions as unknown[]).length} decisao(oes)
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
