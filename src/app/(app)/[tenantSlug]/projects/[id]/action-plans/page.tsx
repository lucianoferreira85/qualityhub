"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardContent } from "@/components/ui/card";
import { CardSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, ClipboardCheck, User, Calendar, AlertTriangle, ShieldAlert } from "lucide-react";
import { formatDate } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  corrective: "Corretiva",
  preventive: "Preventiva",
  improvement: "Melhoria",
};

const TYPE_COLORS: Record<string, string> = {
  corrective: "bg-danger-bg text-danger-fg",
  preventive: "bg-info-bg text-info-fg",
  improvement: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
};

interface ApItem {
  id: string;
  code: string;
  title: string;
  status: string;
  type: string;
  dueDate: string | null;
  project?: { id: string; name: string };
  responsible?: { id: string; name: string } | null;
  nonconformity?: { id: string; code: string; title: string } | null;
  risk?: { id: string; code: string; title: string } | null;
}

export default function ProjectActionPlansPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { tenant, can } = useTenant();
  const [plans, setPlans] = useState<ApItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`/api/tenants/${tenant.slug}/action-plans?projectId=${projectId}`)
      .then((res) => res.json())
      .then((res) => setPlans(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenant.slug, projectId]);

  const filtered = plans.filter((ap) => {
    const q = search.toLowerCase();
    return (
      ap.code.toLowerCase().includes(q) ||
      ap.title.toLowerCase().includes(q) ||
      ap.nonconformity?.code.toLowerCase().includes(q) ||
      false
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/${tenant.slug}/projects/${projectId}`}>
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-title-1 text-foreground-primary">Planos de Ação</h1>
            <p className="text-body-1 text-foreground-secondary mt-1">
              Ações corretivas e preventivas deste projeto
            </p>
          </div>
        </div>
        {can("actionPlan", "create") && (
          <Link href={`/${tenant.slug}/action-plans/new`}>
            <Button>
              <Plus className="h-4 w-4" />
              Novo Plano
            </Button>
          </Link>
        )}
      </div>

      <Input
        placeholder="Buscar por código, título ou NC..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title={search ? "Nenhum plano encontrado" : "Nenhum plano de ação neste projeto"}
          description={search ? "Tente ajustar os termos de busca" : "Crie um plano de ação vinculado a este projeto"}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((ap) => (
            <Link key={ap.id} href={`/${tenant.slug}/action-plans/${ap.id}`}>
              <Card className="cursor-pointer hover:shadow-card-glow transition-shadow h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="text-caption-1 text-foreground-tertiary font-mono">{ap.code}</p>
                      <h3 className="text-body-1 font-medium text-foreground-primary mt-0.5 line-clamp-2">
                        {ap.title}
                      </h3>
                    </div>
                    <Badge variant={TYPE_COLORS[ap.type] || ""} className="flex-shrink-0">
                      {TYPE_LABELS[ap.type] || ap.type}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-3">
                    {ap.nonconformity && (
                      <div className="flex items-center gap-1.5 text-body-2 text-foreground-secondary">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span className="truncate">{ap.nonconformity.code} - {ap.nonconformity.title}</span>
                      </div>
                    )}
                    {ap.risk && (
                      <div className="flex items-center gap-1.5 text-body-2 text-foreground-secondary">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        <span className="truncate">{ap.risk.code} - {ap.risk.title}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-stroke-secondary">
                    <StatusBadge status={ap.status} />
                    <div className="flex items-center gap-3 text-caption-1 text-foreground-tertiary">
                      {ap.responsible && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {ap.responsible.name.split(" ")[0]}
                        </span>
                      )}
                      {ap.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(ap.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
