"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { ArrowLeft, Plus, Cog, User, TrendingUp } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  core: "Principal",
  support: "Suporte",
  management: "Gestão",
};

interface ProcessItem {
  id: string;
  code: string;
  name: string;
  status: string;
  category: string | null;
  responsible?: { id: string; name: string } | null;
  _count?: { indicators: number };
}

export default function ProjectProcessesPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { tenant, can } = useTenant();
  const [processes, setProcesses] = useState<ProcessItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`/api/tenants/${tenant.slug}/processes?projectId=${projectId}`)
      .then((res) => res.json())
      .then((res) => setProcesses(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenant.slug, projectId]);

  const filtered = processes.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.code.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
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
            <h1 className="text-title-1 text-foreground-primary">Processos</h1>
            <p className="text-body-1 text-foreground-secondary mt-1">
              Processos deste projeto
            </p>
          </div>
        </div>
        {can("process" as never, "create") && (
          <Link href={`/${tenant.slug}/processes/new`}>
            <Button>
              <Plus className="h-4 w-4" />
              Novo Processo
            </Button>
          </Link>
        )}
      </div>

      <Input
        placeholder="Buscar por código ou nome..."
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
          icon={Cog}
          title={search ? "Nenhum processo encontrado" : "Nenhum processo neste projeto"}
          description={search ? "Tente ajustar os termos de busca" : "Crie um processo vinculado a este projeto"}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((proc) => (
            <Link key={proc.id} href={`/${tenant.slug}/processes/${proc.id}`}>
              <Card className="cursor-pointer hover:shadow-card-glow transition-shadow h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="text-caption-1 text-foreground-tertiary font-mono">{proc.code}</p>
                      <h3 className="text-body-1 font-medium text-foreground-primary mt-0.5 line-clamp-2">
                        {proc.name}
                      </h3>
                    </div>
                    <StatusBadge status={proc.status} type="processStatus" className="flex-shrink-0" />
                  </div>

                  {proc.category && (
                    <div className="flex items-center gap-1.5 text-body-2 text-foreground-secondary mb-3">
                      <Cog className="h-3.5 w-3.5" />
                      <span>{CATEGORY_LABELS[proc.category] || proc.category}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-stroke-secondary">
                    <div className="flex items-center gap-3 text-caption-1 text-foreground-tertiary">
                      {proc.responsible && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {proc.responsible.name.split(" ")[0]}
                        </span>
                      )}
                    </div>
                    {proc._count && proc._count.indicators > 0 && (
                      <span className="flex items-center gap-1 text-caption-1 text-foreground-tertiary">
                        <TrendingUp className="h-3 w-3" />
                        {proc._count.indicators} indicador(es)
                      </span>
                    )}
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
