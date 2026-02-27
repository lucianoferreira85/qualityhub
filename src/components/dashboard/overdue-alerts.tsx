"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Clock, AlertTriangle } from "lucide-react";

interface OverdueAlertsProps {
  overdueActions: number;
  overdueRiskReviews: number;
  tenantSlug: string;
}

function OverdueAlerts({ overdueActions, overdueRiskReviews, tenantSlug }: OverdueAlertsProps) {
  return (
    <>
      {overdueActions > 0 && (
        <div className="flex items-center gap-3 bg-danger-bg border border-danger/15 rounded-card p-4 shadow-xs">
          <div className="h-9 w-9 rounded-lg bg-danger/10 flex items-center justify-center flex-shrink-0">
            <Clock className="h-4 w-4 text-danger-fg" />
          </div>
          <div className="flex-1">
            <p className="text-body-1 font-medium text-danger-fg">
              {overdueActions} acao(oes) com prazo vencido
            </p>
            <p className="text-body-2 text-danger-fg/70">
              Verifique os planos de acao pendentes
            </p>
          </div>
          <Link href={`/${tenantSlug}/action-plans`}>
            <Button variant="outline" size="sm" className="border-danger/20 text-danger-fg hover:bg-danger/10">
              Ver acoes
            </Button>
          </Link>
        </div>
      )}

      {overdueRiskReviews > 0 && (
        <div className="flex items-center gap-3 bg-warning-bg border border-warning/15 rounded-card p-4 shadow-xs">
          <div className="h-9 w-9 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-4 w-4 text-warning-fg" />
          </div>
          <div className="flex-1">
            <p className="text-body-1 font-medium text-warning-fg">
              {overdueRiskReviews} risco(s) com revisao pendente
            </p>
            <p className="text-body-2 text-warning-fg/70">
              Revise os riscos para manter o monitoramento atualizado
            </p>
          </div>
          <Link href={`/${tenantSlug}/risks`}>
            <Button variant="outline" size="sm" className="border-warning/20 text-warning-fg hover:bg-warning/10">
              Ver riscos
            </Button>
          </Link>
        </div>
      )}
    </>
  );
}

export { OverdueAlerts };
