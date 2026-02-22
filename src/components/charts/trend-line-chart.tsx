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
  { key: "risks", name: "Riscos", color: "#C4314B" },
  { key: "ncs", name: "NCs", color: "#FFB900" },
  { key: "actions", name: "Ações", color: "#0078D4" },
  { key: "incidents", name: "Incidentes", color: "#8764B8" },
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
        Sem dados de tendência para o período selecionado
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
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis
          dataKey="label"
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
        {SERIES.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color}
            strokeWidth={2}
            dot={{ r: 3, fill: s.color }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
