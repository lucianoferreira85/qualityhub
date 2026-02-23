"use client";

import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Calendar, ArrowRight } from "lucide-react";

interface UpcomingReview {
  id: string;
  code: string;
  title: string;
  nextReviewDate: string;
  type: string;
}

interface UpcomingReviewsProps {
  data: UpcomingReview[];
  tenantSlug: string;
}

function UpcomingReviews({ data, tenantSlug }: UpcomingReviewsProps) {
  if (!data || data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-title-3 text-foreground-primary">Revisoes Pendentes</h2>
          <Link href={`/${tenantSlug}/documents`}>
            <span className="text-caption-1 text-brand hover:underline flex items-center gap-1">
              Ver docs <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.map((doc) => {
            const daysUntil = Math.ceil((new Date(doc.nextReviewDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            const isUrgent = daysUntil <= 7;
            return (
              <div
                key={doc.id}
                className={`flex items-center justify-between p-3 rounded-button border transition-colors ${
                  isUrgent ? "border-danger/30 bg-danger-bg/30" : "border-stroke-secondary hover:bg-surface-secondary"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-caption-1 text-foreground-tertiary font-mono">{doc.code}</span>
                  </div>
                  <p className="text-body-2 text-foreground-primary truncate mt-0.5">{doc.title}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
                  <Calendar className="h-3.5 w-3.5" />
                  <span className={`text-caption-1 ${isUrgent ? "text-danger-fg font-medium" : "text-foreground-tertiary"}`}>
                    {daysUntil <= 0 ? "Vencido" : `${daysUntil}d`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export { UpcomingReviews };
