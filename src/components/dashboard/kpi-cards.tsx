"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface KpiStat {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  href: string;
}

interface KpiCardsProps {
  stats: KpiStat[];
  loading: boolean;
}

function KpiCards({ stats, loading }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {stats.map((stat) => (
        <Link key={stat.label} href={stat.href}>
          <Card className="cursor-pointer group kpi-accent-border hover:shadow-card-glow hover:border-brand/20 transition-all duration-200 h-full overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-body-2 text-foreground-secondary font-medium">{stat.label}</p>
                <div className={`h-10 w-10 rounded-lg ${stat.bgColor} flex items-center justify-center transition-all duration-200 group-hover:scale-110 group-hover:shadow-sm`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
              <p className="text-title-lg text-foreground-primary tracking-tight-2">
                {loading ? (
                  <span className="inline-block h-7 w-12 rounded-badge bg-surface-tertiary bg-shimmer bg-[length:200%_100%] animate-shimmer" />
                ) : (
                  stat.value
                )}
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export { KpiCards };
export type { KpiStat };
