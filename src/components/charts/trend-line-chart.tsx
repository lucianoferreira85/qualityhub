"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface TrendData {
  month: string;
  risks: number;
  ncs: number;
  actions: number;
  incidents: number;
}

interface TrendLineChartProps {
  data: TrendData[];
}

const SERIES = [
  { key: "risks", name: "Riscos", color: "#EF4444" },
  { key: "ncs", name: "NCs", color: "#F59E0B" },
  { key: "actions", name: "Acoes", color: "#7C3AED" },
  { key: "incidents", name: "Incidentes", color: "#6366F1" },
] as const;

function formatMonth(month: string): string {
  const [y, m] = month.split("-");
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${months[parseInt(m, 10) - 1]}/${y.slice(2)}`;
}

export function TrendLineChart({ data }: TrendLineChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-body-2 text-foreground-tertiary">
        Sem dados de tendencia para o periodo selecionado
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    label: formatMonth(d.month),
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-stroke-secondary)" />
        <XAxis
          dataKey="label"
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
        {SERIES.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color}
            strokeWidth={2}
            dot={{ r: 3, fill: s.color, strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
