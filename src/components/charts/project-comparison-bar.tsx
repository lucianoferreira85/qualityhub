"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface ProjectComparisonData {
  id: string;
  name: string;
  compliance: number;
  avgMaturity: number;
  openNCs: number;
  pendingActions: number;
}

interface ProjectComparisonBarProps {
  data: ProjectComparisonData[];
}

export function ProjectComparisonBar({ data }: ProjectComparisonBarProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-body-2 text-foreground-tertiary">
        Sem projetos para comparar
      </div>
    );
  }

  const chartData = data.map((p) => ({
    name: p.name.length > 20 ? p.name.slice(0, 20) + "..." : p.name,
    "Compliance (%)": p.compliance,
    "NCs Abertas": p.openNCs,
    "Acoes Pendentes": p.pendingActions,
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-stroke-secondary)" />
        <XAxis
          dataKey="name"
          tick={{ fill: "var(--color-fg-secondary)", fontSize: 11 }}
          axisLine={{ stroke: "var(--color-stroke-primary)" }}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: "var(--color-fg-tertiary)", fontSize: 11 }}
          axisLine={{ stroke: "var(--color-stroke-primary)" }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--color-bg-elevated)",
            border: "1px solid var(--color-stroke-secondary)",
            borderRadius: 12,
            fontSize: 12,
            boxShadow: "var(--shadow-lg)",
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Compliance (%)" fill="#7C3AED" radius={[4, 4, 0, 0]} />
        <Bar dataKey="NCs Abertas" fill="#F59E0B" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Acoes Pendentes" fill="#EF4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
