"use client";

import { Card, CardHeader, CardContent } from "@/components/ui/card";

const RISK_LEVEL_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  very_high: { label: "Muito Alto", color: "text-white", bg: "bg-danger" },
  high: { label: "Alto", color: "text-danger-fg", bg: "bg-danger-bg" },
  medium: { label: "Medio", color: "text-warning-fg", bg: "bg-warning-bg" },
  low: { label: "Baixo", color: "text-success-fg", bg: "bg-success-bg" },
  very_low: { label: "Muito Baixo", color: "text-foreground-tertiary", bg: "bg-surface-tertiary" },
};

interface RiskDistributionProps {
  data: { level: string; count: number }[];
}

function RiskDistribution({ data }: RiskDistributionProps) {
  if (data.length === 0) return null;

  const totalRisks = data.reduce((s, r) => s + r.count, 0);
  const orderedLevels = ["very_high", "high", "medium", "low", "very_low"];
  const sorted = [...data].sort(
    (a, b) => orderedLevels.indexOf(a.level) - orderedLevels.indexOf(b.level)
  );

  return (
    <Card>
      <CardHeader>
        <h2 className="text-title-3 text-foreground-primary">Distribuicao de Riscos</h2>
      </CardHeader>
      <CardContent>
        <div className="space-y-3.5">
          {sorted.map((r) => {
            const cfg = RISK_LEVEL_CONFIG[r.level] || RISK_LEVEL_CONFIG.low;
            const pct = totalRisks > 0 ? Math.round((r.count / totalRisks) * 100) : 0;
            return (
              <div key={r.level} className="flex items-center gap-3">
                <span className="text-body-2 text-foreground-secondary w-24 flex-shrink-0">{cfg.label}</span>
                <div className="flex-1 h-6 bg-surface-tertiary rounded-full overflow-hidden">
                  <div
                    className={`h-full ${cfg.bg} rounded-full transition-all duration-400 ease-spring flex items-center justify-end pr-2`}
                    style={{ width: `${Math.max(pct, 8)}%` }}
                  >
                    <span className={`text-caption-2 font-semibold ${cfg.color}`}>{r.count}</span>
                  </div>
                </div>
                <span className="text-caption-1 text-foreground-tertiary w-10 text-right tabular-nums">{pct}%</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export { RiskDistribution };
