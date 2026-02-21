"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  AlertTriangle,
  ClipboardCheck,
  Shield,
  Calendar,
  Clock,
} from "lucide-react";
import {
  getSeverityColor,
  getSeverityLabel,
  formatDate,
} from "@/lib/utils";

interface NcNotification {
  type: "nc_open" | "nc_overdue";
  id: string;
  code: string;
  title: string;
  severity: string;
  dueDate: string | null;
  createdAt: string;
}

interface ActionNotification {
  type: "action_overdue" | "action_pending";
  id: string;
  title: string;
  status: string;
  dueDate: string | null;
}

interface AuditNotification {
  type: "audit_upcoming";
  id: string;
  title: string;
  auditType: string;
  startDate: string;
}

type Notification = NcNotification | ActionNotification | AuditNotification;

export default function NotificationsPage() {
  const { tenant } = useTenant();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`/api/tenants/${tenant.slug}/dashboard`);
        const { data } = await res.json();
        if (!data) return;

        const items: Notification[] = [];

        // Overdue actions
        if (data.recentActions) {
          for (const ap of data.recentActions) {
            if (ap.dueDate && new Date(ap.dueDate) < new Date()) {
              items.push({
                type: "action_overdue",
                id: ap.id,
                title: ap.title,
                status: ap.status,
                dueDate: ap.dueDate,
              });
            } else {
              items.push({
                type: "action_pending",
                id: ap.id,
                title: ap.title,
                status: ap.status,
                dueDate: ap.dueDate,
              });
            }
          }
        }

        // Recent NCs
        if (data.recentNcs) {
          for (const nc of data.recentNcs) {
            const isOverdue = nc.dueDate && new Date(nc.dueDate) < new Date() && nc.status !== "closed";
            items.push({
              type: isOverdue ? "nc_overdue" : "nc_open",
              id: nc.id,
              code: nc.code,
              title: nc.title,
              severity: nc.severity,
              dueDate: nc.dueDate || null,
              createdAt: nc.createdAt,
            });
          }
        }

        // Upcoming audits
        if (data.upcomingAudits) {
          for (const audit of data.upcomingAudits) {
            items.push({
              type: "audit_upcoming",
              id: audit.id,
              title: audit.title,
              auditType: audit.type,
              startDate: audit.startDate,
            });
          }
        }

        // Sort: overdue first, then by date
        items.sort((a, b) => {
          const aOverdue = a.type.includes("overdue") ? 0 : 1;
          const bOverdue = b.type.includes("overdue") ? 0 : 1;
          return aOverdue - bOverdue;
        });

        setNotifications(items);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [tenant.slug]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "nc_open":
      case "nc_overdue":
        return AlertTriangle;
      case "action_overdue":
      case "action_pending":
        return ClipboardCheck;
      case "audit_upcoming":
        return Shield;
      default:
        return Bell;
    }
  };

  const getNotificationLink = (n: Notification) => {
    switch (n.type) {
      case "nc_open":
      case "nc_overdue":
        return `/${tenant.slug}/nonconformities/${n.id}`;
      case "action_overdue":
      case "action_pending":
        return `/${tenant.slug}/action-plans/${n.id}`;
      case "audit_upcoming":
        return `/${tenant.slug}/audits/${n.id}`;
      default:
        return "#";
    }
  };

  const getNotificationLabel = (type: string) => {
    switch (type) {
      case "nc_overdue":
        return { text: "NC Vencida", color: "bg-danger-bg text-danger-fg" };
      case "nc_open":
        return { text: "NC Aberta", color: "bg-warning-bg text-warning-fg" };
      case "action_overdue":
        return { text: "Acao Vencida", color: "bg-danger-bg text-danger-fg" };
      case "action_pending":
        return { text: "Acao Pendente", color: "bg-brand-light text-brand" };
      case "audit_upcoming":
        return { text: "Auditoria", color: "bg-brand-muted text-info" };
      default:
        return { text: "Notificacao", color: "bg-gray-100 text-gray-800" };
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-title-1 text-foreground-primary">Notificacoes</h1>
        <p className="text-body-1 text-foreground-secondary mt-1">
          Alertas e lembretes do sistema
        </p>
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
              Nenhuma notificacao ou alerta no momento
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n, i) => {
            const Icon = getNotificationIcon(n.type);
            const label = getNotificationLabel(n.type);
            const isOverdue = n.type.includes("overdue");

            return (
              <Link key={`${n.type}-${n.id}-${i}`} href={getNotificationLink(n)}>
                <Card
                  className={`cursor-pointer hover:shadow-card-glow transition-all ${
                    isOverdue ? "border-danger/20" : ""
                  }`}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isOverdue ? "bg-danger-bg" : "bg-surface-tertiary"
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 ${
                          isOverdue ? "text-danger-fg" : "text-foreground-tertiary"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Badge variant={label.color} className="text-caption-2">
                          {label.text}
                        </Badge>
                        {n.type === "nc_open" || n.type === "nc_overdue" ? (
                          <Badge
                            variant={getSeverityColor((n as NcNotification).severity)}
                            className="text-caption-2"
                          >
                            {getSeverityLabel((n as NcNotification).severity)}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-body-1 text-foreground-primary truncate">
                        {n.type === "nc_open" || n.type === "nc_overdue"
                          ? `${(n as NcNotification).code} - ${n.title}`
                          : n.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-caption-1 text-foreground-tertiary flex-shrink-0">
                      {n.type === "audit_upcoming" ? (
                        <>
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate((n as AuditNotification).startDate)}</span>
                        </>
                      ) : "dueDate" in n && n.dueDate ? (
                        <>
                          <Clock className={`h-3 w-3 ${isOverdue ? "text-danger-fg" : ""}`} />
                          <span className={isOverdue ? "text-danger-fg font-medium" : ""}>
                            {formatDate(n.dueDate)}
                          </span>
                        </>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
