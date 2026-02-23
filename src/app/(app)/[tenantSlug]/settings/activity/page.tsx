"use client";

import { useEffect, useState } from "react";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CardSkeleton } from "@/components/ui/skeleton";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Activity, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  create: { label: "Criação", color: "bg-success-bg text-success-fg" },
  update: { label: "Atualização", color: "bg-brand-light text-brand" },
  delete: { label: "Exclusão", color: "bg-danger-bg text-danger-fg" },
  status_change: { label: "Mudança de Status", color: "bg-warning-bg text-warning-fg" },
  upload: { label: "Upload", color: "bg-brand-light text-brand" },
  download: { label: "Download", color: "bg-surface-tertiary text-foreground-secondary" },
  export: { label: "Exportação", color: "bg-surface-tertiary text-foreground-secondary" },
};

const ENTITY_LABELS: Record<string, string> = {
  nonconformity: "Não Conformidade",
  actionPlan: "Plano de Ação",
  audit: "Auditoria",
  document: "Documento",
  project: "Projeto",
  risk: "Risco",
  indicator: "Indicador",
  process: "Processo",
};

export default function ActivityLogPage() {
  const { tenant } = useTenant();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");

  const fetchLogs = async (p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), pageSize: "25" });
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      if (actionFilter) params.set("action", actionFilter);
      if (entityFilter) params.set("entityType", entityFilter);

      const res = await fetch(
        `/api/tenants/${tenant.slug}/activity-log?${params.toString()}`
      );
      const json = await res.json();
      setLogs(json.data || []);
      setTotalPages(json.totalPages || 1);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant.slug, dateFrom, dateTo, actionFilter, entityFilter]);

  useEffect(() => {
    fetchLogs(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const getDescription = (log: AuditLogEntry) => {
    const entity = ENTITY_LABELS[log.entityType] || log.entityType;
    const meta = log.metadata || {};
    const name = (meta.title || meta.code || meta.name || log.entityId) as string;
    return `${entity}: ${name}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Breadcrumb
        items={[
          { label: "Configurações", href: `/${tenant.slug}/settings` },
          { label: "Log de Atividades" },
        ]}
      />

      <div>
        <h1 className="text-title-1 text-foreground-primary">Log de Atividades</h1>
        <p className="text-body-1 text-foreground-secondary mt-1">
          Histórico de ações realizadas na plataforma
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-caption-1 text-foreground-secondary mb-1">
                Data início
              </label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-caption-1 text-foreground-secondary mb-1">
                Data fim
              </label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-caption-1 text-foreground-secondary mb-1">
                Ação
              </label>
              <Select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                options={[
                  { value: "", label: "Todas" },
                  { value: "create", label: "Criação" },
                  { value: "update", label: "Atualização" },
                  { value: "delete", label: "Exclusão" },
                  { value: "status_change", label: "Mudança de Status" },
                  { value: "upload", label: "Upload" },
                ]}
              />
            </div>
            <div>
              <label className="block text-caption-1 text-foreground-secondary mb-1">
                Entidade
              </label>
              <Select
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                options={[
                  { value: "", label: "Todas" },
                  { value: "nonconformity", label: "Não Conformidade" },
                  { value: "actionPlan", label: "Plano de Ação" },
                  { value: "audit", label: "Auditoria" },
                  { value: "document", label: "Documento" },
                  { value: "project", label: "Projeto" },
                  { value: "risk", label: "Risco" },
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <CardSkeleton key={i} lines={2} />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Activity className="h-12 w-12 text-foreground-tertiary mx-auto mb-4" />
            <p className="text-title-3 text-foreground-primary mb-1">
              Nenhuma atividade registrada
            </p>
            <p className="text-body-1 text-foreground-secondary">
              As ações realizadas aparecerão aqui
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-1">
            {logs.map((log) => {
              const actionInfo = ACTION_LABELS[log.action] || {
                label: log.action,
                color: "bg-surface-tertiary text-foreground-secondary",
              };
              return (
                <Card key={log.id}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="h-9 w-9 rounded-full bg-surface-tertiary flex items-center justify-center flex-shrink-0 text-body-2 font-medium text-foreground-secondary">
                      {log.user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-body-2 font-medium text-foreground-primary">
                          {log.user.name}
                        </span>
                        <Badge variant={actionInfo.color} className="text-caption-2">
                          {actionInfo.label}
                        </Badge>
                      </div>
                      <p className="text-caption-1 text-foreground-secondary truncate">
                        {getDescription(log)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-caption-1 text-foreground-tertiary">
                        {formatDate(log.createdAt)}
                      </p>
                      {log.ipAddress && (
                        <p className="text-caption-2 text-foreground-tertiary font-mono">
                          {log.ipAddress}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-body-2 text-foreground-secondary">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
