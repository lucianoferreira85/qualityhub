"use client";

import { useState } from "react";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { toast } from "sonner";

interface NotificationPref {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
}

const DEFAULT_PREFS: NotificationPref[] = [
  { key: "nc_assigned", label: "NC Atribuída", description: "Quando uma não conformidade é atribuída a você", enabled: true },
  { key: "audit_scheduled", label: "Auditoria Agendada", description: "Quando você é designado como auditor líder", enabled: true },
  { key: "document_review", label: "Revisão de Documento", description: "Quando um documento é enviado para sua revisão", enabled: true },
  { key: "risk_critical", label: "Risco Crítico", description: "Quando um risco de nível crítico é identificado", enabled: true },
  { key: "action_plan_due", label: "Plano de Ação Vencendo", description: "Lembretes sobre planos de ação próximos do prazo", enabled: true },
  { key: "weekly_digest", label: "Resumo Semanal", description: "Email semanal com resumo das atividades", enabled: false },
];

export default function NotificationSettingsPage() {
  const { tenant } = useTenant();
  const [prefs, setPrefs] = useState<NotificationPref[]>(DEFAULT_PREFS);
  const [saving, setSaving] = useState(false);

  const togglePref = (key: string) => {
    setPrefs((prev) =>
      prev.map((p) => (p.key === key ? { ...p, enabled: !p.enabled } : p))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const notificationPreferences = Object.fromEntries(
        prefs.map((p) => [p.key, p.enabled])
      );
      const res = await fetch(`/api/tenants/${tenant.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: { notificationPreferences } }),
      });
      if (!res.ok) throw new Error("Erro ao salvar");
      toast.success("Preferências de notificação salvas");
    } catch {
      toast.error("Erro ao salvar preferências");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Breadcrumb
        items={[
          { label: "Configurações", href: `/${tenant.slug}/settings` },
          { label: "Notificações" },
        ]}
      />

      <div>
        <h1 className="text-title-1 text-foreground-primary">Preferências de Notificação</h1>
        <p className="text-body-1 text-foreground-secondary mt-1">
          Escolha quais notificações deseja receber por e-mail
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-title-3 text-foreground-primary">Notificações por E-mail</h2>
        </CardHeader>
        <CardContent className="space-y-1">
          {prefs.map((pref) => (
            <div
              key={pref.key}
              className="flex items-center justify-between py-3 border-b border-stroke-secondary last:border-0"
            >
              <div>
                <p className="text-body-1 text-foreground-primary font-medium">
                  {pref.label}
                </p>
                <p className="text-caption-1 text-foreground-secondary">
                  {pref.description}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={pref.enabled}
                onClick={() => togglePref(pref.key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  pref.enabled ? "bg-brand" : "bg-stroke-primary"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    pref.enabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving}>
          Salvar Preferências
        </Button>
      </div>
    </div>
  );
}
