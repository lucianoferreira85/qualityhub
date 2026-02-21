"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, AlertTriangle, User, Calendar } from "lucide-react";
import { getStatusColor, getStatusLabel, getSeverityColor, getSeverityLabel, getOriginLabel, formatDate } from "@/lib/utils";

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

  useEffect(() => {
    fetch(`/api/tenants/${tenant.slug}/nonconformities?projectId=${projectId}`)
      .then((res) => res.json())
      .then((res) => setNcs(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/${tenant.slug}/projects/${projectId}`}>
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-title-1 text-foreground-primary">Não Conformidades</h1>
            <p className="text-body-1 text-foreground-secondary mt-1">
              NCs vinculadas a este projeto
            </p>
          </div>
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
            <AlertTriangle className="h-12 w-12 text-foreground-tertiary mb-4" />
            <p className="text-title-3 text-foreground-primary mb-1">
              {search ? "Nenhuma NC encontrada" : "Nenhuma não conformidade neste projeto"}
            </p>
            <p className="text-body-1 text-foreground-secondary">
              {search ? "Tente ajustar os termos de busca" : "Registre uma NC vinculada a este projeto"}
            </p>
          </CardContent>
        </Card>
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
                    <Badge variant={getSeverityColor(nc.severity)} className="flex-shrink-0">
                      {getSeverityLabel(nc.severity)}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-1.5 text-body-2 text-foreground-secondary">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>{getOriginLabel(nc.origin)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-stroke-secondary">
                    <Badge variant={getStatusColor(nc.status)}>
                      {getStatusLabel(nc.status)}
                    </Badge>
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
