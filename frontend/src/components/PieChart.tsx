import {
  Cell,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { STAGE_COLORS, STAGE_LABELS } from "../types/client";
import type { StageCount } from "../types/dashboard";
import { CHART_TOOLTIP_STYLE } from "../lib/chart";
import { ChartCard } from "./ChartCard";

interface PieChartProps {
  data: StageCount[];
  title?: string;
  isLoading?: boolean;
  isError?: boolean;
  error?: unknown;
  onRetry?: () => void;
}

function toPercent(count: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return Math.round((count / total) * 1000) / 10;
}

/** Stage distribution. The legend is plain HTML so it reads right-to-left. */
export function PieChart({
  data,
  title = "توزيع العملاء حسب المرحلة",
  isLoading,
  isError,
  error,
  onRetry,
}: PieChartProps) {
  const total = data.reduce((sum, entry) => sum + entry.count, 0);
  const legendEntries = data.filter((entry) => entry.count > 0);

  return (
    <ChartCard
      title={title}
      isLoading={isLoading}
      isError={isError}
      error={error}
      onRetry={onRetry}
      isEmpty={legendEntries.length === 0}
    >
      <div className="flex h-full flex-col items-center gap-2">
        <div className="min-h-0 w-full flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="stage"
                outerRadius={78}
                stroke="#ffffff"
                strokeWidth={2}
              >
                {data.map((entry) => (
                  <Cell key={entry.stage} fill={STAGE_COLORS[entry.stage]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                formatter={(value, name) => [
                  `${value} عميل · ${toPercent(Number(value), total)}%`,
                  STAGE_LABELS[name as keyof typeof STAGE_LABELS] ?? String(name),
                ]}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
        <ul className="grid w-full grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-600">
          {legendEntries.map((entry) => (
            <li key={entry.stage} className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: STAGE_COLORS[entry.stage] }}
              />
              <span className="truncate text-gray-700">
                {STAGE_LABELS[entry.stage]}
              </span>
              <span className="text-gray-400">({toPercent(entry.count, total)}%)</span>
            </li>
          ))}
        </ul>
      </div>
    </ChartCard>
  );
}