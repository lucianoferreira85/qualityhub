"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  AlertTriangle,
  Shield,
  FileText,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  readAt: string | null;
  entityType: string | null;
  entityId: string | null;
  createdAt: string;
}

const TYPE_CONFIG: Record<string, { icon: typeof Bell; color: string; label: string }> = {
  nc_assigned: { icon: AlertTriangle, color: "bg-warning-bg text-warning-fg", label: "NC Atribuída" },
  audit_scheduled: { icon: Shield, color: "bg-brand-light text-brand", label: "Auditoria" },
  document_review: { icon: FileText, color: "bg-info-bg text-info", label: "Revisão Doc" },
  risk_critical: { icon: AlertTriangle, color: "bg-danger-bg text-danger-fg", label: "Risco Crítico" },
};

export default function NotificationsPage() {
  const { tenant } = useTenant();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchNotifications = async (p = page) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/tenants/${tenant.slug}/notifications?page=${p}&pageSize=20`
      );
      const json = await res.json();
      setNotifications(json.data || []);
      setTotalPages(json.totalPages || 1);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(1);
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant.slug]);

  useEffect(() => {
    fetchNotifications(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const markAllRead = async () => {
    setMarking(true);
    try {
      await fetch(`/api/tenants/${tenant.slug}/notifications`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() }))
      );
    } catch {
      /* ignore */
    } finally {
      setMarking(false);
    }
  };

  const getLink = (n: Notification) => {
    if (!n.entityType || !n.entityId) return null;
    const paths: Record<string, string> = {
      nonconformity: "nonconformities",
      audit: "audits",
      document: "documents",
      risk: "risks",
      actionPlan: "action-plans",
    };
    const path = paths[n.entityType];
    return path ? `/${tenant.slug}/${path}/${n.entityId}` : null;
  };

  const hasUnread = notifications.some((n) => !n.readAt);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-1 text-foreground-primary">Notificações</h1>
          <p className="text-body-1 text-foreground-secondary mt-1">
            Alertas e lembretes do sistema
          </p>
        </div>
        {hasUnread && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllRead}
            loading={marking}
          >
            <CheckCheck className="h-4 w-4" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse flex items-center gap-3">
                  <div className="h-10 w-10 bg-surface-tertiary rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-surface-tertiary rounded w-2/3" />
                    <div className="h-3 bg-surface-tertiary rounded w-1/3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="h-12 w-12 text-foreground-tertiary mx-auto mb-4" />
            <p className="text-title-3 text-foreground-primary mb-1">
              Tudo em dia!
            </p>
            <p className="text-body-1 text-foreground-secondary">
              Nenhuma notificação no momento
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-2">
            {notifications.map((n) => {
              const config = TYPE_CONFIG[n.type] || {
                icon: Bell,
                color: "bg-surface-tertiary text-foreground-secondary",
                label: "Notificação",
              };
              const Icon = config.icon;
              const link = getLink(n);
              const isUnread = !n.readAt;

              const content = (
                <Card
                  className={`transition-all ${
                    link ? "cursor-pointer hover:shadow-card-glow" : ""
                  } ${isUnread ? "border-brand/20 bg-brand-light/5" : ""}`}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isUnread ? config.color : "bg-surface-tertiary"
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 ${
                          isUnread ? "" : "text-foreground-tertiary"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Badge variant={config.color} className="text-caption-2">
                          {config.label}
                        </Badge>
                        {isUnread && (
                          <span className="h-2 w-2 rounded-full bg-brand" />
                        )}
                      </div>
                      <p className={`text-body-1 truncate ${isUnread ? "text-foreground-primary font-medium" : "text-foreground-secondary"}`}>
                        {n.title}
                      </p>
                      <p className="text-caption-1 text-foreground-tertiary truncate">
                        {n.message}
                      </p>
                    </div>
                    <div className="text-caption-1 text-foreground-tertiary flex-shrink-0">
                      {formatDate(n.createdAt)}
                    </div>
                  </CardContent>
                </Card>
              );

              return link ? (
                <Link key={n.id} href={link}>
                  {content}
                </Link>
              ) : (
                <div key={n.id}>{content}</div>
              );
            })}
          </div>

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
