"use client";

import { useState } from "react";
import Link from "next/link";
import * as Popover from "@radix-ui/react-popover";
import { Bell, Check, AlertTriangle, ClipboardCheck, ShieldAlert, FileText, Info } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTenant } from "@/hooks/use-tenant";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  readAt: string | null;
  createdAt: string;
  unreadCount: number;
}

interface NotificationsResponse {
  data: Notification[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "agora";
  if (diffMinutes < 60) return `ha ${diffMinutes}min`;
  if (diffHours < 24) return `ha ${diffHours}h`;
  if (diffDays === 1) return "ontem";
  if (diffDays < 7) return `ha ${diffDays}d`;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(date);
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "nonconformity":
      return AlertTriangle;
    case "action_plan":
      return ClipboardCheck;
    case "risk":
      return ShieldAlert;
    case "document":
      return FileText;
    default:
      return Info;
  }
}

export function NotificationPopover() {
  const { tenant } = useTenant();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: response } = useQuery<NotificationsResponse>({
    queryKey: [tenant.slug, "notifications", "popover"],
    queryFn: async () => {
      const res = await fetch(`/api/tenants/${tenant.slug}/notifications?pageSize=5`);
      if (!res.ok) throw new Error("Erro ao buscar notificacoes");
      return res.json();
    },
    refetchInterval: 60000,
    enabled: !!tenant.slug,
  });

  const notifications = response?.data ?? [];
  const unreadCount = notifications.length > 0 ? notifications[0]?.unreadCount ?? 0 : 0;

  async function markAllAsRead() {
    await fetch(`/api/tenants/${tenant.slug}/notifications`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    queryClient.invalidateQueries({ queryKey: [tenant.slug, "notifications"] });
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          className="relative h-9 w-9 flex items-center justify-center rounded-button text-foreground-secondary hover:bg-surface-tertiary hover:text-foreground-primary transition-all duration-120"
          aria-label={`Notificacoes${unreadCount > 0 ? `, ${unreadCount} nao lidas` : ""}`}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger text-[10px] font-semibold text-white px-1 animate-scale-in">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="z-50 w-80 rounded-card bg-surface-elevated border border-stroke-secondary shadow-dialog animate-fade-in-down"
          sideOffset={8}
          align="end"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-stroke-secondary">
            <h3 className="text-body-1 font-semibold text-foreground-primary">Notificacoes</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-caption-1 text-brand hover:text-brand-hover transition-colors duration-120"
              >
                <Check className="h-3 w-3" />
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="max-h-[320px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <div className="h-12 w-12 rounded-xl bg-surface-tertiary flex items-center justify-center mx-auto mb-3">
                  <Bell className="h-6 w-6 text-foreground-tertiary" />
                </div>
                <p className="text-body-2 text-foreground-secondary">Nenhuma notificacao</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                const isUnread = !notification.readAt;

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 border-b border-stroke-secondary last:border-b-0 transition-all duration-120",
                      isUnread ? "bg-brand-subtle" : "hover:bg-surface-tertiary"
                    )}
                  >
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0",
                      isUnread ? "bg-brand-light text-brand" : "bg-surface-tertiary text-foreground-tertiary"
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-body-2 truncate",
                        isUnread ? "text-foreground-primary font-medium" : "text-foreground-secondary"
                      )}>
                        {notification.title}
                      </p>
                      <p className="text-caption-1 text-foreground-tertiary mt-0.5">
                        {getTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                    {isUnread && (
                      <div className="h-2 w-2 rounded-full bg-brand flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-stroke-secondary px-4 py-2.5">
            <Link
              href={`/${tenant.slug}/notifications`}
              className="block text-center text-caption-1 text-brand hover:text-brand-hover transition-colors duration-120 font-medium"
              onClick={() => setOpen(false)}
            >
              Ver todas as notificacoes
            </Link>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
