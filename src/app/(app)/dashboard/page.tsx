"use client";

import {
  Shield,
  AlertTriangle,
  ClipboardCheck,
  FileText,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

const stats = [
  {
    label: "Auditorias Planejadas",
    value: "0",
    icon: ClipboardCheck,
    color: "text-brand",
    bgColor: "bg-brand-light",
  },
  {
    label: "NCs Abertas",
    value: "0",
    icon: AlertTriangle,
    color: "text-warning",
    bgColor: "bg-warning-bg",
  },
  {
    label: "Ações Pendentes",
    value: "0",
    icon: AlertCircle,
    color: "text-danger",
    bgColor: "bg-danger-bg",
  },
  {
    label: "Documentos",
    value: "0",
    icon: FileText,
    color: "text-accent",
    bgColor: "bg-success-bg",
  },
  {
    label: "Indicadores",
    value: "0",
    icon: TrendingUp,
    color: "text-info",
    bgColor: "bg-info-bg",
  },
  {
    label: "Riscos Ativos",
    value: "0",
    icon: Shield,
    color: "text-foreground-secondary",
    bgColor: "bg-surface-tertiary",
  },
];

export default function DashboardPage() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-title-1 text-foreground-primary">Dashboard</h1>
        <p className="text-body-1 text-foreground-secondary mt-1">
          Visão geral do Sistema de Gestão da Qualidade
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <p className="text-body-2 text-foreground-secondary">
                  {stat.label}
                </p>
                <div
                  className={`h-10 w-10 rounded-button ${stat.bgColor} flex items-center justify-center`}
                >
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-title-lg text-foreground-primary">
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-title-3 text-foreground-primary">
            Bem-vindo ao QualityHub
          </h2>
        </CardHeader>
        <CardContent>
          <p className="text-body-1 text-foreground-secondary">
            Configure seu banco de dados Supabase e comece a gerenciar
            auditorias, não-conformidades, ações corretivas, documentos,
            indicadores e riscos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
