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
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Plus, AlertTriangle, User, Calendar } from "lucide-react";
import { getOriginLabel, formatDate } from "@/lib/utils";

interface NcItem {
  id: string;
  code: string;
  title: string;
  status: string;
  severity: string;
  origin: string;
  dueDate: string | null;
  project?: { id: string; name: string };
  responsible?: { id: string; name: string } | null;
  _count?: { actionPlans: number };
}

export default function ProjectNonconformitiesPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { tenant, can } = useTenant();
  const [ncs, setNcs] = useState<NcItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [projectName, setProjectName] = useState("");

  useEffect(() => {
    fetch(`/api/tenants/${tenant.slug}/nonconformities?projectId=${projectId}`)
      .then((res) => res.json())
      .then((res) => setNcs(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));

    fetch(`/api/tenants/${tenant.slug}/projects/${projectId}`)
      .then((res) => res.json())
      .then((res) => setProjectName(res.data?.name || ""))
      .catch(() => {});
  }, [tenant.slug, projectId]);

  const filtered = ncs.filter((nc) => {
    const q = search.toLowerCase();
    return (
      nc.code.toLowerCase().includes(q) ||
      nc.title.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: "Projetos", href: `/${tenant.slug}/projects` },
        { label: projectName, href: `/${tenant.slug}/projects/${projectId}` },
        { label: "Não Conformidades" },
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-1 text-foreground-primary">Não Conformidades</h1>
          <p className="text-body-1 text-foreground-secondary mt-1">
            NCs vinculadas a este projeto
          </p>
        </div>
        {can("nonconformity", "create") && (
          <Link href={`/${tenant.slug}/nonconformities/new`}>
            <Button>
              <Plus className="h-4 w-4" />
              Nova NC
            </Button>
          </Link>
        )}
      </div>

      <Input
        placeholder="Buscar por código ou título..."
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
          icon={AlertTriangle}
          title={search ? "Nenhuma NC encontrada" : "Nenhuma não conformidade neste projeto"}
          description={search ? "Tente ajustar os termos de busca" : "Registre uma NC vinculada a este projeto"}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((nc) => (
            <Link key={nc.id} href={`/${tenant.slug}/nonconformities/${nc.id}`}>
              <Card className="cursor-pointer hover:shadow-card-glow transition-shadow h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="text-caption-1 text-foreground-tertiary font-mono">{nc.code}</p>
                      <h3 className="text-body-1 font-medium text-foreground-primary mt-0.5 line-clamp-2">
                        {nc.title}
                      </h3>
                    </div>
                    <StatusBadge status={nc.severity} type="severity" className="flex-shrink-0" />
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-1.5 text-body-2 text-foreground-secondary">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>{getOriginLabel(nc.origin)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-stroke-secondary">
                    <StatusBadge status={nc.status} />
                    <div className="flex items-center gap-3 text-caption-1 text-foreground-tertiary">
                      {nc.responsible && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {nc.responsible.name.split(" ")[0]}
                        </span>
                      )}
                      {nc.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(nc.dueDate)}
                        </span>
                      )}
                      {nc._count && nc._count.actionPlans > 0 && (
                        <span>{nc._count.actionPlans} ação(ões)</span>
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
