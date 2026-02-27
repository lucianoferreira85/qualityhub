"use client";

interface CertificationData {
  projectId: string;
  projectName: string;
  requirementCompliance: number;
  controlCompliance: number;
  openNCs: number;
  pendingActions: number;
  overdueItems: number;
  readinessScore: number;
}

interface CertificationReadinessProps {
  data: CertificationData[];
}

function ScoreGauge({ score }: { score: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color =
    score >= 80 ? "#10B981" : score >= 60 ? "#F59E0B" : "#EF4444";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          className="stroke-surface-tertiary"
          strokeWidth="8"
        />
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          transform="rotate(-90 48 48)"
          className="transition-all duration-700 ease-spring"
        />
      </svg>
      <span
        className="absolute text-title-2 font-bold tracking-tight-2"
        style={{ color }}
      >
        {score}
      </span>
    </div>
  );
}

export function CertificationReadiness({ data }: CertificationReadinessProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-body-2 text-foreground-tertiary">
        Sem projetos para avaliar prontidao
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.map((p) => (
        <div
          key={p.projectId}
          className="flex flex-col items-center gap-3 p-4 rounded-card border border-stroke-secondary bg-surface-primary shadow-xs hover:shadow-card-hover transition-all duration-200"
        >
          <ScoreGauge score={p.readinessScore} />
          <p className="text-body-1 font-medium text-foreground-primary text-center truncate w-full">
            {p.projectName}
          </p>
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-caption-1 text-foreground-secondary">Requisitos</span>
              <span className="text-caption-1 font-semibold text-foreground-primary tabular-nums">
                {p.requirementCompliance}%
              </span>
            </div>
            <div className="h-1.5 bg-surface-tertiary rounded-full overflow-hidden">
              <div
                className="h-full bg-brand rounded-full transition-all duration-400 ease-spring"
                style={{ width: `${p.requirementCompliance}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-caption-1 text-foreground-secondary">Controles</span>
              <span className="text-caption-1 font-semibold text-foreground-primary tabular-nums">
                {p.controlCompliance}%
              </span>
            </div>
            <div className="h-1.5 bg-surface-tertiary rounded-full overflow-hidden">
              <div
                className="h-full bg-brand rounded-full transition-all duration-400 ease-spring"
                style={{ width: `${p.controlCompliance}%` }}
              />
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-stroke-secondary">
              <span className="text-caption-1 text-foreground-tertiary tabular-nums">
                NCs: {p.openNCs}
              </span>
              <span className="text-caption-1 text-foreground-tertiary tabular-nums">
                Acoes: {p.pendingActions}
              </span>
              {p.overdueItems > 0 && (
                <span className="text-caption-1 text-danger-fg font-medium tabular-nums">
                  {p.overdueItems} atrasada{p.overdueItems > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
