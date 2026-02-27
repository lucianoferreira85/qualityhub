"use client";

import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface RecentNc {
  id: string;
  code: string;
  title: string;
  severity: string;
  status: string;
  createdAt: string;
}

interface RecentNcsProps {
  data: RecentNc[];
  tenantSlug: string;
}

function RecentNcs({ data, tenantSlug }: RecentNcsProps) {
  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-title-3 text-foreground-primary">NCs Recentes</h2>
          <Link href={`/${tenantSlug}/nonconformities`}>
            <span className="text-caption-1 text-brand hover:text-brand-hover flex items-center gap-1 font-medium transition-colors duration-120">
              Ver todas <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-0.5">
          {data.map((nc) => (
            <Link
              key={nc.id}
              href={`/${tenantSlug}/nonconformities/${nc.id}`}
              className="flex items-center gap-3 p-2.5 rounded-button hover:bg-surface-tertiary transition-all duration-120 group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-caption-1 text-foreground-tertiary font-mono">{nc.code}</span>
                  <StatusBadge status={nc.severity} type="severity" className="text-caption-2" />
                </div>
                <p className="text-body-2 text-foreground-primary truncate mt-0.5 group-hover:text-brand transition-colors duration-120">{nc.title}</p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <StatusBadge status={nc.status} className="text-caption-2" />
                <span className="text-caption-2 text-foreground-tertiary">{formatDate(nc.createdAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export { RecentNcs };
