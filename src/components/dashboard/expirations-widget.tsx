"use client";

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Timer, Calendar } from "lucide-react";

const EXPIRATION_TYPE_LABELS: Record<string, string> = {
  action: "Acao",
  audit: "Auditoria",
  review: "Revisao Doc.",
  risk_review: "Revisao Risco",
};

interface Expiration {
  type: string;
  id: string;
  title: string;
  dueDate: string;
  daysUntil: number;
  projectName?: string;
}

interface ExpirationsWidgetProps {
  data: Expiration[];
}

function ExpirationsWidget({ data }: ExpirationsWidgetProps) {
  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-warning-bg flex items-center justify-center">
            <Timer className="h-4 w-4 text-warning-fg" />
          </div>
          <h2 className="text-title-3 text-foreground-primary">Vencimentos Proximos (30 dias)</h2>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5">
          {data.map((exp) => {
            const isOverdue = exp.daysUntil < 0;
            const isUrgent = exp.daysUntil >= 0 && exp.daysUntil <= 7;
            return (
              <div
                key={`${exp.type}-${exp.id}`}
                className={`flex items-center gap-3 p-3 rounded-button border transition-all duration-120 ${
                  isOverdue
                    ? "border-danger/20 bg-danger-bg/40"
                    : isUrgent
                    ? "border-warning/20 bg-warning-bg/40"
                    : "border-stroke-secondary hover:bg-surface-tertiary"
                }`}
              >
                <Badge
                  variant={
                    exp.type === "action"
                      ? "bg-brand-light text-brand"
                      : exp.type === "audit"
                      ? "bg-info-bg text-info-fg"
                      : exp.type === "review"
                      ? "bg-warning-bg text-warning-fg"
                      : "bg-surface-tertiary text-foreground-secondary"
                  }
                  className="text-caption-2 w-28 justify-center flex-shrink-0"
                >
                  {EXPIRATION_TYPE_LABELS[exp.type] || exp.type}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-body-2 text-foreground-primary truncate">{exp.title}</p>
                  {exp.projectName && (
                    <p className="text-caption-2 text-foreground-tertiary truncate">{exp.projectName}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Calendar className="h-3.5 w-3.5" />
                  <span
                    className={`text-caption-1 font-medium tabular-nums ${
                      isOverdue ? "text-danger-fg" : isUrgent ? "text-warning-fg" : "text-foreground-tertiary"
                    }`}
                  >
                    {isOverdue
                      ? `${Math.abs(exp.daysUntil)}d atrasado`
                      : exp.daysUntil === 0
                      ? "Hoje"
                      : `${exp.daysUntil}d`}
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

export { ExpirationsWidget };
