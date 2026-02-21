"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Building2, Users, TrendingUp, CreditCard } from "lucide-react";

interface AdminStats {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  totalUsers: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((res) => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    {
      label: "Tenants Ativos",
      value: stats?.activeTenants ?? 0,
      icon: Building2,
      color: "text-brand",
      bgColor: "bg-brand-light",
    },
    {
      label: "Em Trial",
      value: stats?.trialTenants ?? 0,
      icon: TrendingUp,
      color: "text-warning",
      bgColor: "bg-warning-bg",
    },
    {
      label: "Total Tenants",
      value: stats?.totalTenants ?? 0,
      icon: CreditCard,
      color: "text-success",
      bgColor: "bg-success-bg",
    },
    {
      label: "Total Usuários",
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: "text-info",
      bgColor: "bg-brand-muted",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-title-1 text-foreground-primary">
          Dashboard SaaS
        </h1>
        <p className="text-body-1 text-foreground-secondary mt-1">
          Visão geral da plataforma QualityHub
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <p className="text-body-2 text-foreground-secondary">
                  {card.label}
                </p>
                <div className={`h-10 w-10 rounded-button ${card.bgColor} flex items-center justify-center`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-title-lg text-foreground-primary">
                {loading ? (
                  <span className="inline-block h-7 w-12 bg-surface-tertiary rounded animate-pulse" />
                ) : (
                  card.value
                )}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
