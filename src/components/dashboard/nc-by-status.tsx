"use client";

import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ArrowRight } from "lucide-react";

interface NcByStatusProps {
  data: { status: string; count: number }[];
  tenantSlug: string;
}

function NcByStatus({ data, tenantSlug }: NcByStatusProps) {
  if (data.length === 0) return null;

  const total = data.reduce((s, n) => s + n.count, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-title-3 text-foreground-primary">NCs por Status</h2>
          <Link href={`/${tenantSlug}/nonconformities`}>
            <span className="text-caption-1 text-brand hover:text-brand-hover flex items-center gap-1 font-medium transition-colors duration-120">
              Ver todas <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((nc) => {
            const pct = total > 0 ? Math.round((nc.count / total) * 100) : 0;
            return (
              <div key={nc.status} className="flex items-center gap-3">
                <StatusBadge status={nc.status} className="w-36 justify-center" />
                <div className="flex-1 h-5 bg-surface-tertiary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand rounded-full transition-all duration-400 ease-spring"
                    style={{ width: `${Math.max(pct, 4)}%` }}
                  />
                </div>
                <span className="text-body-2 text-foreground-primary font-semibold w-8 text-right tabular-nums">{nc.count}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export { NcByStatus };
