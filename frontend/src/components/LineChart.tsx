import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ReactNode } from "react";
import { formatDayKey, formatDate } from "../lib/format";
import { CHART_TICK_PROPS, CHART_TOOLTIP_STYLE } from "../lib/chart";
import type { DailyClientCount } from "../types/dashboard";
import { ChartCard } from "./ChartCard";

interface LineChartProps {
  data: DailyClientCount[];
  title?: string;
  subtitle?: string;
  /** Rendered in the header, next to the title (e.g. a range picker). */
  action?: ReactNode;
  isLoading?: boolean;
  isError?: boolean;
  error?: unknown;
  onRetry?: () => void;
}

/** New clients per day; the tooltip shows the full date plus the count. */
export function LineChart({
  data,
  title = "العملاء الجدد يومياً",
  subtitle,
  action,
  isLoading,
  isError,
  error,
  onRetry,
}: LineChartProps) {
  return (
    <ChartCard
      title={title}
      subtitle={subtitle}
      action={action}
      isLoading={isLoading}
      isError={isError}
      error={error}
      onRetry={onRetry}
      isEmpty={data.every((entry) => entry.count === 0)}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDayKey}
            tickLine={false}
            axisLine={false}
            tick={CHART_TICK_PROPS}
            minTickGap={8}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tick={CHART_TICK_PROPS}
            width={40}
          />
          <Tooltip
            cursor={{ stroke: "#d1d5db", strokeDasharray: "3 3" }}
            contentStyle={CHART_TOOLTIP_STYLE}
            labelFormatter={(label) => formatDate(String(label))}
            formatter={(value) => [`${value} عميل`, "العدد"]}
          />
          <Line
            type="monotone"
            dataKey="count"
            name="العدد"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 6 }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}