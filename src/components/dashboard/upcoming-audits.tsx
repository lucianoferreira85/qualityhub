"use client";

import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Calendar, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface UpcomingAudit {
  id: string;
  title: string;
  type: string;
  startDate: string;
  endDate: string | null;
}

interface UpcomingAuditsProps {
  data: UpcomingAudit[];
  tenantSlug: string;
}

function UpcomingAudits({ data, tenantSlug }: UpcomingAuditsProps) {
  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-title-3 text-foreground-primary">Proximas Auditorias</h2>
          <Link href={`/${tenantSlug}/audits`}>
            <span className="text-caption-1 text-brand hover:underline flex items-center gap-1">
              Ver todas <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.map((audit) => (
            <Link
              key={audit.id}
              href={`/${tenantSlug}/audits/${audit.id}`}
              className="flex items-center justify-between p-3 rounded-button border border-stroke-secondary hover:bg-surface-secondary transition-colors"
            >
              <div>
                <p className="text-body-1 font-medium text-foreground-primary">{audit.title}</p>
                <p className="text-caption-1 text-foreground-tertiary">
                  {audit.type === "internal" ? "Interna" : audit.type === "external" ? "Externa" : audit.type}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-body-2 text-foreground-secondary">
                <Calendar className="h-3.5 w-3.5" />
                <span>{formatDate(audit.startDate)}</span>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export { UpcomingAudits };
