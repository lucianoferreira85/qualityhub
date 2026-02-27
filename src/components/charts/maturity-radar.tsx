"use client";

import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";

interface MaturityRadarProps {
  data: { domain: string; avgMaturity: number }[];
  targetMaturity: number;
}

export function MaturityRadar({ data, targetMaturity }: MaturityRadarProps) {
  const chartData = data.map((d) => ({
    domain: d.domain.length > 15 ? d.domain.slice(0, 15) + "..." : d.domain,
    maturity: Math.round(d.avgMaturity * 100) / 100,
    target: targetMaturity,
  }));

  if (chartData.length < 3) {
    return (
      <div className="flex items-center justify-center h-[300px] text-body-2 text-foreground-tertiary">
        Minimo 3 dominios necessarios para o grafico radar
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid stroke="var(--color-stroke-secondary)" />
        <PolarAngleAxis
          dataKey="domain"
          tick={{ fill: "var(--color-fg-secondary)", fontSize: 11 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 4]}
          tick={{ fill: "var(--color-fg-tertiary)", fontSize: 10 }}
          tickCount={5}
        />
        <Radar
          name="Maturidade Atual"
          dataKey="maturity"
          stroke="#7C3AED"
          fill="#7C3AED"
          fillOpacity={0.15}
          strokeWidth={2}
        />
        <Radar
          name="Meta"
          dataKey="target"
          stroke="#EF4444"
          fill="none"
          strokeWidth={2}
          strokeDasharray="5 5"
        />
        <Legend
          wrapperStyle={{ fontSize: 12 }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
