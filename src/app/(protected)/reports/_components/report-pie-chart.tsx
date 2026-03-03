"use client";

import { Cell, Pie, PieChart } from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "#0EA5E9",
  "#8B5CF6",
  "#EC4899",
  "#F59E0B",
  "#10B981",
];

export interface ReportPieChartItem {
  name: string;
  value: number;
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

interface ReportPieChartProps {
  data: ReportPieChartItem[];
  config: ChartConfig;
  format?: ValueFormat;
  className?: string;
}

export function ReportPieChart({
  data,
  config,
  format = "count",
  className,
}: ReportPieChartProps) {
  if (data.length === 0) return null;

  const chartData = data.map((item, i) => ({
    ...item,
    fill: COLORS[i % COLORS.length],
  }));

  return (
    <ChartContainer config={config} className={className ?? "min-h-[240px]"}>
      <PieChart>
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => formatValue(Number(value), format)}
            />
          }
        />
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius="75%"
          label={({ name, percent }) =>
            `${name} ${(percent * 100).toFixed(0)}%`
          }
        >
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={entry.fill} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}
