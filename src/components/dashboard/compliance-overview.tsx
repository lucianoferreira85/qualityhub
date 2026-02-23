"use client";

import { Card, CardHeader, CardContent } from "@/components/ui/card";

interface ComplianceData {
  avgRequirementMaturity: number;
  avgControlMaturity: number;
  totalRequirements: number;
  totalControls: number;
  compliancePercentage: number;
}

interface ComplianceOverviewProps {
  data: ComplianceData;
}

function ComplianceOverview({ data }: ComplianceOverviewProps) {
  if (data.totalRequirements === 0 && data.totalControls === 0) return null;

  return (
    <Card>
      <CardHeader>
        <h2 className="text-title-3 text-foreground-primary">Compliance</h2>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-shrink-0">
            <div className={`h-16 w-16 rounded-full flex items-center justify-center ${
              data.compliancePercentage >= 70 ? "bg-success-bg" :
              data.compliancePercentage >= 40 ? "bg-warning-bg" :
              "bg-danger-bg"
            }`}>
              <span className={`text-title-lg font-semibold ${
                data.compliancePercentage >= 70 ? "text-success-fg" :
                data.compliancePercentage >= 40 ? "text-warning-fg" :
                "text-danger-fg"
              }`}>
                {data.compliancePercentage}%
              </span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-body-2 text-foreground-secondary">
              Itens com maturidade &ge; 3
            </p>
            <p className="text-caption-1 text-foreground-tertiary mt-0.5">
              {data.totalRequirements} requisitos + {data.totalControls} controles
            </p>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-body-2 text-foreground-secondary">Requisitos</span>
              <span className="text-body-2 font-medium text-foreground-primary">{data.avgRequirementMaturity}/4</span>
            </div>
            <div className="h-2 bg-surface-tertiary rounded-full overflow-hidden">
              <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${(data.avgRequirementMaturity / 4) * 100}%` }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-body-2 text-foreground-secondary">Controles</span>
              <span className="text-body-2 font-medium text-foreground-primary">{data.avgControlMaturity}/4</span>
            </div>
            <div className="h-2 bg-surface-tertiary rounded-full overflow-hidden">
              <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${(data.avgControlMaturity / 4) * 100}%` }} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { ComplianceOverview };
