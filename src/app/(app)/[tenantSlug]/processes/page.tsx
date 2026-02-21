"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Cog, FolderKanban, User, TrendingUp, Filter } from "lucide-react";
import { getProcessStatusLabel, getProcessStatusColor } from "@/lib/utils";

const PROCESS_STATUSES = [
  { value: "", label: "Todos os status" },
  { value: "active", label: "Ativo" },
  { value: "inactive", label: "Inativo" },
  { value: "draft", label: "Rascunho" },
];

const PROCESS_CATEGORIES = [
  { value: "", label: "Todas as categorias" },
  { value: "core", label: "Principal" },
  { value: "support", label: "Suporte" },
  { value: "management", label: "Gestão" },
];

const CATEGORY_LABELS: Record<string, string> = {
  core: "Principal",
  support: "Suporte",
  management: "Gestão",
};

interface ProcessItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: string;
  category: string | null;
  project?: { id: string; name: string };
  responsible?: { id: string; name: string } | null;
  _count?: { indicators: number };
}

export default function ProcessesPage() {
  const { tenant, can } = useTenant();
  const [processes, setProcesses] = useState<ProcessItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const fetchProcesses = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    if (filterCategory) params.set("category", filterCategory);
    const qs = params.toString();

    fetch(`/api/tenants/${tenant.slug}/processes${qs ? `?${qs}` : ""}`)
      .then((res) => res.json())
      .then((res) => setProcesses(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenant.slug, filterStatus, filterCategory]);

  useEffect(() => {
    fetchProcesses();
  }, [fetchProcesses]);

  const filtered = processes.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.code.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.project?.name.toLowerCase().includes(q) ||
      false
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-1 text-foreground-primary">Processos</h1>
          <p className="text-body-1 text-foreground-secondary mt-1">
            Gerencie os processos da organização
          </p>
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

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Buscar por código, nome ou projeto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-foreground-tertiary flex-shrink-0" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-10 rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-2 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
          >
            {PROCESS_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-10 rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-2 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
          >
            {PROCESS_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          {(filterStatus || filterCategory) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setFilterStatus(""); setFilterCategory(""); }}
              className="text-foreground-tertiary"
            >
              Limpar
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-surface-tertiary rounded w-1/4" />
                  <div className="h-5 bg-surface-tertiary rounded w-3/4" />
                  <div className="h-4 bg-surface-tertiary rounded w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <Cog className="h-12 w-12 text-foreground-tertiary mb-4" />
            <p className="text-title-3 text-foreground-primary mb-1">
              {search || filterStatus || filterCategory
                ? "Nenhum processo encontrado"
                : "Nenhum processo registrado"}
            </p>
            <p className="text-body-1 text-foreground-secondary">
              {search || filterStatus || filterCategory
                ? "Tente ajustar os filtros ou termos de busca"
                : "Crie o primeiro processo para começar"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((proc) => (
            <Link key={proc.id} href={`/${tenant.slug}/processes/${proc.id}`}>
              <Card className="cursor-pointer hover:shadow-card-glow transition-shadow h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="text-caption-1 text-foreground-tertiary font-mono">
                        {proc.code}
                      </p>
                      <h3 className="text-body-1 font-medium text-foreground-primary mt-0.5 line-clamp-2">
                        {proc.name}
                      </h3>
                    </div>
                    <Badge variant={getProcessStatusColor(proc.status)} className="flex-shrink-0">
                      {getProcessStatusLabel(proc.status)}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-3">
                    {proc.project && (
                      <div className="flex items-center gap-1.5 text-body-2 text-foreground-secondary">
                        <FolderKanban className="h-3.5 w-3.5" />
                        <span className="truncate">{proc.project.name}</span>
                      </div>
                    )}
                    {proc.category && (
                      <div className="flex items-center gap-1.5 text-body-2 text-foreground-secondary">
                        <Cog className="h-3.5 w-3.5" />
                        <span>{CATEGORY_LABELS[proc.category] || proc.category}</span>
                      </div>
                    )}
                  </div>

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
