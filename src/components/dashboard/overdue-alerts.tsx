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
        <div className="flex items-center gap-3 bg-danger-bg border border-danger/20 rounded-card p-4">
          <Clock className="h-5 w-5 text-danger-fg flex-shrink-0" />
          <div className="flex-1">
            <p className="text-body-1 font-medium text-danger-fg">
              {overdueActions} acao(oes) com prazo vencido
            </p>
            <p className="text-body-2 text-danger-fg/80">
              Verifique os planos de acao pendentes
            </p>
          </div>
          <Link href={`/${tenantSlug}/action-plans`}>
            <Button variant="outline" size="sm" className="border-danger/30 text-danger-fg hover:bg-danger-bg">
              Ver acoes
            </Button>
          </Link>
        </div>
      )}

      {overdueRiskReviews > 0 && (
        <div className="flex items-center gap-3 bg-warning-bg border border-warning/20 rounded-card p-4">
          <AlertTriangle className="h-5 w-5 text-warning-fg flex-shrink-0" />
          <div className="flex-1">
            <p className="text-body-1 font-medium text-warning-fg">
              {overdueRiskReviews} risco(s) com revisao pendente
            </p>
            <p className="text-body-2 text-warning-fg/80">
              Revise os riscos para manter o monitoramento atualizado
            </p>
          </div>
          <Link href={`/${tenantSlug}/risks`}>
            <Button variant="outline" size="sm" className="border-warning/30 text-warning-fg hover:bg-warning-bg">
              Ver riscos
            </Button>
          </Link>
        </div>
      )}
    </>
  );
}

export { OverdueAlerts };
