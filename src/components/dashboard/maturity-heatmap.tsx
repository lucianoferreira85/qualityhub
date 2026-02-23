"use client";

import { Card, CardHeader, CardContent } from "@/components/ui/card";

const MATURITY_COLORS: Record<number, string> = {
  0: "bg-gray-200 text-gray-600",
  1: "bg-red-200 text-red-800",
  2: "bg-yellow-200 text-yellow-800",
  3: "bg-blue-200 text-blue-800",
  4: "bg-green-200 text-green-800",
};

interface HeatmapEntry {
  domain: string;
  projectName: string;
  avgMaturity: number;
}

interface MaturityHeatmapProps {
  data: HeatmapEntry[];
}

function MaturityHeatmap({ data }: MaturityHeatmapProps) {
  if (data.length === 0) return null;

  const domains = Array.from(new Set(data.map((h) => h.domain)));
  const projectNames = Array.from(new Set(data.map((h) => h.projectName)));
  const lookup = new Map(
    data.map((h) => [`${h.domain}|||${h.projectName}`, h.avgMaturity])
  );

  return (
    <Card>
      <CardHeader>
        <h2 className="text-title-3 text-foreground-primary">Heatmap de Maturidade</h2>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-caption-1">
            <thead>
              <tr>
                <th className="text-left p-2 text-foreground-secondary font-medium">Dominio</th>
                {projectNames.map((pn) => (
                  <th key={pn} className="text-center p-2 text-foreground-secondary font-medium truncate max-w-[120px]">
                    {pn}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {domains.map((domain) => (
                <tr key={domain} className="border-t border-stroke-secondary">
                  <td className="p-2 text-foreground-primary truncate max-w-[180px]" title={domain}>
                    {domain}
                  </td>
                  {projectNames.map((pn) => {
                    const val = lookup.get(`${domain}|||${pn}`);
                    const level = val !== undefined ? Math.round(val) : -1;
                    const colorClass = level >= 0
                      ? MATURITY_COLORS[Math.min(level, 4)]
                      : "bg-surface-tertiary text-foreground-tertiary";
                    return (
                      <td key={pn} className="p-1.5 text-center">
                        <span
                          className={`inline-block w-10 py-1 rounded text-caption-2 font-medium ${colorClass}`}
                          title={val !== undefined ? `${val.toFixed(1)}` : "N/A"}
                        >
                          {val !== undefined ? val.toFixed(1) : "-"}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export { MaturityHeatmap };
