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
import { Plus, Search, User, Calendar, FileSearch } from "lucide-react";
import { getAuditTypeLabel, formatDate } from "@/lib/utils";
import { Breadcrumb } from "@/components/ui/breadcrumb";

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
  const [projectName, setProjectName] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/tenants/${tenant.slug}/audits?projectId=${projectId}`)
        .then((res) => res.json())
        .then((res) => setAudits(res.data || [])),
      fetch(`/api/tenants/${tenant.slug}/projects/${projectId}`)
        .then((res) => res.json())
        .then((res) => setProjectName(res.data?.name || "")),
    ])
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
      <Breadcrumb items={[
        { label: "Projetos", href: `/${tenant.slug}/projects` },
        { label: projectName, href: `/${tenant.slug}/projects/${projectId}` },
        { label: "Auditorias" },
      ]} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-1 text-foreground-primary">Auditorias</h1>
          <p className="text-body-1 text-foreground-secondary mt-1">
            Auditorias vinculadas a este projeto
          </p>
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
        placeholder="Buscar por título ou tipo..."
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
          icon={Search}
          title={search ? "Nenhuma auditoria encontrada" : "Nenhuma auditoria neste projeto"}
          description={search ? "Tente ajustar os termos de busca" : "Agende uma auditoria para este projeto"}
        />
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
                    <StatusBadge status={audit.status} />
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
