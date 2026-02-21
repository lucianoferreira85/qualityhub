"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Search, User, Calendar, FileSearch } from "lucide-react";
import { getStatusColor, getStatusLabel, getAuditTypeLabel, formatDate } from "@/lib/utils";

const AUDIT_TYPE_COLORS: Record<string, string> = {
  internal: "bg-info-bg text-info-fg",
  external: "bg-brand-light text-brand",
  supplier: "bg-warning-bg text-warning-fg",
  certification: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
};

interface AuditItem {
  id: string;
  title: string;
  status: string;
  type: string;
  startDate: string;
  endDate: string | null;
  project?: { id: string; name: string };
  leadAuditor?: { id: string; name: string } | null;
  _count?: { findings: number };
}

export default function ProjectAuditsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { tenant, can } = useTenant();
  const [audits, setAudits] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`/api/tenants/${tenant.slug}/audits`)
      .then((res) => res.json())
      .then((res) => {
        const all = res.data || [];
        setAudits(all.filter((a: AuditItem) => a.project?.id === projectId));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenant.slug, projectId]);

  const filtered = audits.filter((a) => {
    const q = search.toLowerCase();
    return (
      a.title.toLowerCase().includes(q) ||
      getAuditTypeLabel(a.type).toLowerCase().includes(q)
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
            <h1 className="text-title-1 text-foreground-primary">Auditorias</h1>
            <p className="text-body-1 text-foreground-secondary mt-1">
              Auditorias vinculadas a este projeto
            </p>
          </div>
        </div>
        {can("audit", "create") && (
          <Link href={`/${tenant.slug}/audits/new`}>
            <Button>
              <Plus className="h-4 w-4" />
              Nova Auditoria
            </Button>
          </Link>
        )}
      </div>

      <Input
        placeholder="Buscar por titulo ou tipo..."
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
            <Search className="h-12 w-12 text-foreground-tertiary mb-4" />
            <p className="text-title-3 text-foreground-primary mb-1">
              {search ? "Nenhuma auditoria encontrada" : "Nenhuma auditoria neste projeto"}
            </p>
            <p className="text-body-1 text-foreground-secondary">
              {search ? "Tente ajustar os termos de busca" : "Agende uma auditoria para este projeto"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((audit) => (
            <Link key={audit.id} href={`/${tenant.slug}/audits/${audit.id}`}>
              <Card className="cursor-pointer hover:shadow-card-glow transition-shadow h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-body-1 font-medium text-foreground-primary line-clamp-2">
                      {audit.title}
                    </h3>
                    <Badge variant={AUDIT_TYPE_COLORS[audit.type] || ""} className="flex-shrink-0">
                      {getAuditTypeLabel(audit.type)}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-1.5 text-body-2 text-foreground-secondary">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {formatDate(audit.startDate)}
                        {audit.endDate && ` — ${formatDate(audit.endDate)}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-stroke-secondary">
                    <Badge variant={getStatusColor(audit.status)}>
                      {getStatusLabel(audit.status)}
                    </Badge>
                    <div className="flex items-center gap-3 text-caption-1 text-foreground-tertiary">
                      {audit.leadAuditor && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {audit.leadAuditor.name.split(" ")[0]}
                        </span>
                      )}
                      {audit._count && audit._count.findings > 0 && (
                        <span className="flex items-center gap-1">
                          <FileSearch className="h-3 w-3" />
                          {audit._count.findings}
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
