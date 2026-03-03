"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export interface ReportBarChartItem {
  name: string;
  value: number;
  [key: string]: unknown;
}

type ValueFormat = "currency" | "count";

function formatValue(value: number, format: ValueFormat): string {
  if (format === "currency") {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  }
  return `${value} consultas`;
}

interface ReportBarChartProps {
  data: ReportBarChartItem[];
  config: ChartConfig;
  dataKey?: string;
  format?: ValueFormat;
  className?: string;
}

export function ReportBarChart({
  data,
  config,
  dataKey = "value",
  format = "count",
  className,
}: ReportBarChartProps) {
  if (data.length === 0) return null;

  const firstKey = Object.keys(config)[0] ?? "value";

  return (
    <ChartContainer config={config} className={className ?? "min-h-[240px]"}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          width={140}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11 }}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => formatValue(Number(value), format)}
            />
          }
        />
        <Bar
          dataKey={dataKey}
          radius={[0, 4, 4, 0]}
          fill={`var(--color-${firstKey})`}
          maxBarSize={32}
        />
      </BarChart>
    </ChartContainer>
  );
}
