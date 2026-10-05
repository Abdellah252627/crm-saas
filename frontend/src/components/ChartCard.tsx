import type { ReactNode } from "react";
import { EMPTY_STATE_MESSAGE } from "../lib/chart";
import { CARD_SURFACE_CLASS, SECTION_TITLE_CLASS } from "../lib/ui";
import { ErrorState } from "./ErrorState";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  isLoading?: boolean;
  isError?: boolean;
  error?: unknown;
  onRetry?: () => void;
  /** Lets a chart declare "loaded, but every value is zero". */
  isEmpty?: boolean;
  children: ReactNode;
}

/**
 * Shared frame for the dashboard charts: title, and the loading / error /
 * empty states, so all three charts behave identically.
 */
export function ChartCard({
  title,
  subtitle,
  action,
  isLoading = false,
  isError = false,
  error,
  onRetry,
  isEmpty = false,
  children,
}: ChartCardProps) {
  return (
    <section className={`${CARD_SURFACE_CLASS} flex flex-col p-4`}>
      <header className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h2 className={SECTION_TITLE_CLASS}>{title}</h2>
          {subtitle !== undefined ? (
            <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
          ) : null}
        </div>
        {action}
      </header>

      {isLoading ? (
        <div className="h-64 w-full animate-pulse rounded-lg bg-gray-100" />
      ) : isError ? (
        <ErrorState
          message="تعذّر تحميل الرسم البياني"
          error={error}
          onRetry={() => onRetry?.()}
        />
      ) : isEmpty ? (
        <p className="flex h-64 items-center justify-center text-center text-sm text-gray-400">
          {EMPTY_STATE_MESSAGE}
        </p>
      ) : (
        <div className="h-64 w-full">{children}</div>
      )}
    </section>
  );
}