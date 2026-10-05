import type { ReactNode } from "react";
import { CARD_HOVER_CLASS, CARD_SURFACE_CLASS } from "../lib/ui";

export type KPIColor = "blue" | "green" | "yellow" | "red";

interface KPICardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  color: KPIColor;
  /** Percentage change; positive renders green, negative red. */
  trend?: number;
  trendLabel?: string;
}

/**
 * Static class strings only: Tailwind cannot see classes built at runtime, so
 * the palette has to be a literal lookup.
 */
const ICON_STYLES: Record<KPIColor, string> = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-emerald-50 text-emerald-600",
  yellow: "bg-amber-50 text-amber-600",
  red: "bg-red-50 text-red-600",
};

function trendStyle(trend: number): string {
  if (trend > 0) return "text-emerald-600";
  if (trend < 0) return "text-red-600";
  return "text-gray-500";
}

function trendArrow(trend: number): string {
  if (trend > 0) return "↑";
  if (trend < 0) return "↓";
  return "→";
}

export function KPICard({
  title,
  value,
  icon,
  color,
  trend,
  trendLabel,
}: KPICardProps) {
  return (
    <div className={`${CARD_SURFACE_CLASS} ${CARD_HOVER_CLASS} p-4`}>
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${ICON_STYLES[color]}`}
        >
          {icon}
        </span>
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      </div>
      <p className="mt-3 text-2xl font-bold text-gray-900">{value}</p>
      {trend !== undefined ? (
        <p className={`mt-1 text-xs font-medium ${trendStyle(trend)}`}>
          <span aria-hidden="true">{trendArrow(trend)}</span> {Math.abs(trend)}%
          {trendLabel !== undefined ? ` ${trendLabel}` : ""}
        </p>
      ) : null}
    </div>
  );
}

export function KPICardSkeleton() {
  return (
    <div className={`${CARD_SURFACE_CLASS} ${CARD_HOVER_CLASS} animate-pulse`}>
      <div className="flex items-center gap-2">
        <span className="h-9 w-9 rounded-lg bg-gray-100" />
        <span className="h-3 w-24 rounded bg-gray-100" />
      </div>
      <span className="mt-4 block h-7 w-16 rounded bg-gray-100" />
    </div>
  );
}