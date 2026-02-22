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
        Mínimo 3 domínios necessários para o gráfico radar
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid stroke="#e0e0e0" />
        <PolarAngleAxis
          dataKey="domain"
          tick={{ fill: "#616161", fontSize: 11 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 4]}
          tick={{ fill: "#8a8886", fontSize: 10 }}
          tickCount={5}
        />
        <Radar
          name="Maturidade Atual"
          dataKey="maturity"
          stroke="#0078D4"
          fill="#0078D4"
          fillOpacity={0.3}
          strokeWidth={2}
        />
        <Radar
          name="Meta"
          dataKey="target"
          stroke="#C4314B"
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
