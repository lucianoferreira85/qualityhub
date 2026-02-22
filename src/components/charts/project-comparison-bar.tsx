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
    "Ações Pendentes": p.pendingActions,
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis
          dataKey="name"
          tick={{ fill: "#616161", fontSize: 11 }}
          axisLine={{ stroke: "#d1d1d1" }}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: "#8a8886", fontSize: 11 }}
          axisLine={{ stroke: "#d1d1d1" }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e0e0e0",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Compliance (%)" fill="#0078D4" radius={[4, 4, 0, 0]} />
        <Bar dataKey="NCs Abertas" fill="#FFB900" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Ações Pendentes" fill="#C4314B" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
