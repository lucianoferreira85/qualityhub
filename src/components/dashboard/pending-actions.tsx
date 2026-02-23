"use client";

import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ArrowRight, User, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface RecentAction {
  id: string;
  title: string;
  status: string;
  dueDate: string | null;
  responsible: { id: string; name: string } | null;
}

interface PendingActionsProps {
  data: RecentAction[];
  tenantSlug: string;
}

function PendingActions({ data, tenantSlug }: PendingActionsProps) {
  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-title-3 text-foreground-primary">Acoes Pendentes</h2>
          <Link href={`/${tenantSlug}/action-plans`}>
            <span className="text-caption-1 text-brand hover:underline flex items-center gap-1">
              Ver todas <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {data.map((ap) => {
            const isOverdue = ap.dueDate && new Date(ap.dueDate) < new Date();
            return (
              <Link
                key={ap.id}
                href={`/${tenantSlug}/action-plans/${ap.id}`}
                className="flex items-center gap-3 p-2.5 rounded-button hover:bg-surface-secondary transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-body-2 text-foreground-primary truncate">{ap.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <StatusBadge status={ap.status} className="text-caption-2" />
                    {ap.responsible && (
                      <span className="text-caption-1 text-foreground-tertiary flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {ap.responsible.name.split(" ")[0]}
                      </span>
                    )}
                  </div>
                </div>
                {ap.dueDate && (
                  <span
                    className={`text-caption-1 flex items-center gap-1 flex-shrink-0 ${
                      isOverdue ? "text-danger-fg font-medium" : "text-foreground-tertiary"
                    }`}
                  >
                    <Calendar className="h-3 w-3" />
                    {formatDate(ap.dueDate)}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export { PendingActions };
