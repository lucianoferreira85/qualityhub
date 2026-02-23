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
          <Card className="cursor-pointer hover:shadow-card-glow transition-all h-full">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-body-2 text-foreground-secondary">{stat.label}</p>
                <div className={`h-10 w-10 rounded-button ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
              <p className="text-title-lg text-foreground-primary">
                {loading ? (
                  <span className="inline-block h-7 w-12 bg-surface-tertiary rounded animate-pulse" />
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
