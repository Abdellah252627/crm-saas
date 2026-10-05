import type { CSSProperties } from "react";

export const EMPTY_STATE_MESSAGE = "لا يوجد بيانات بعد";

/**
 * Recharts renders SVG, so tooltips and axes cannot use Tailwind classes.
 * These literals keep the charts visually in step with the rest of the app.
 */
export const CHART_TOOLTIP_STYLE: CSSProperties = {
  direction: "rtl",
  borderRadius: "0.75rem",
  border: "1px solid #e5e7eb",
  boxShadow: "0 4px 12px rgb(0 0 0 / 0.06)",
  fontSize: "0.75rem",
};

export const CHART_TICK_PROPS = { fontSize: 12, fill: "#6b7280" };