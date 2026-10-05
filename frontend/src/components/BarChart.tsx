import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { STAGE_COLORS, STAGE_LABELS, type Stage } from "../types/client";
import type { StageCount } from "../types/dashboard";
import { CHART_TICK_PROPS, CHART_TOOLTIP_STYLE } from "../lib/chart";
import { ChartCard } from "./ChartCard";

interface BarChartProps {
  data: StageCount[];
  title?: string;
  isLoading?: boolean;
  isError?: boolean;
  error?: unknown;
  onRetry?: () => void;
}

/** Client count per pipeline stage, colored like the Kanban stage badges. */
export function BarChart({
  data,
  title = "العملاء حسب المرحلة",
  isLoading,
  isError,
  error,
  onRetry,
}: BarChartProps) {
  return (
    <ChartCard
      title={title}
      isLoading={isLoading}
      isError={isError}
      error={error}
      onRetry={onRetry}
      isEmpty={data.every((entry) => entry.count === 0)}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="stage"
            tickFormatter={(stage: Stage) => STAGE_LABELS[stage] ?? stage}
            tickLine={false}
            axisLine={false}
            tick={CHART_TICK_PROPS}
            interval={0}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tick={CHART_TICK_PROPS}
            width={40}
          />
          <Tooltip
            cursor={{ fill: "rgb(99 102 241 / 0.06)" }}
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value) => [`${value} عميل`, "العدد"]}
          />
          <Bar dataKey="count" name="العدد" radius={[6, 6, 0, 0]} maxBarSize={48}>
            {data.map((entry) => (
              <Cell key={entry.stage} fill={STAGE_COLORS[entry.stage]} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}