import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BarChart } from "../components/BarChart";
import { ErrorState } from "../components/ErrorState";
import {
  ActivityIcon,
  PercentIcon,
  RefreshIcon,
  TrendingUpIcon,
  UsersIcon,
} from "../components/icons";
import { KPICard, KPICardSkeleton, type KPIColor } from "../components/KPICard";
import { LineChart } from "../components/LineChart";
import { PieChart } from "../components/PieChart";
import { RecentActivity } from "../components/RecentActivity";
import { Button } from "../components/ui/Button";
import {
  DASHBOARD_QUERY_KEY,
  useClientsByDay,
  useDashboardStats,
  useNewClients,
  useRecentContacts,
} from "../hooks/useDashboard";
import { formatTime } from "../lib/format";
import {
  PAGE_CLASS,
  PAGE_HEADER_CLASS,
  PAGE_SUBTITLE_CLASS,
  PAGE_TITLE_CLASS,
} from "../lib/ui";
import { STAGES } from "../types/client";
import type { DailyClientCount, StageCount } from "../types/dashboard";

const RANGE_OPTIONS = [7, 14, 30] as const;
/** Two weeks of new clients: the last 7 days against the 7 before them. */
const TREND_WINDOW_DAYS = 14;
const TREND_HALF_WINDOW = TREND_WINDOW_DAYS / 2;

function sumCounts(entries: DailyClientCount[]): number {
  return entries.reduce((total, entry) => total + entry.count, 0);
}

/**
 * Percentage change in new clients for the last 7 days versus the 7 before
 * them. Returns `undefined` when there is no baseline to compare against, so
 * the card shows no trend instead of a made-up number.
 */
function computeWeeklyTrend(daily: DailyClientCount[]): number | undefined {
  if (daily.length < TREND_WINDOW_DAYS) {
    return undefined;
  }
  const current = sumCounts(daily.slice(TREND_HALF_WINDOW));
  const previous = sumCounts(daily.slice(0, TREND_HALF_WINDOW));
  if (previous === 0) {
    return undefined;
  }
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function formatPercent(value: number): string {
  return `${Number.isInteger(value) ? value : value.toFixed(1)}%`;
}

interface Kpi {
  title: string;
  value: string;
  icon: ReactNode;
  color: KPIColor;
  trend?: number;
  trendLabel?: string;
}

export function Dashboard() {
  const queryClient = useQueryClient();
  const [range, setRange] = useState<number>(7);

  const statsQuery = useDashboardStats();
  const dailyQuery = useClientsByDay(range);
  const trendQuery = useClientsByDay(TREND_WINDOW_DAYS);
  const contactsQuery = useRecentContacts();
  const newClientsQuery = useNewClients();

  const stats = statsQuery.data;
  const daily = dailyQuery.data ?? [];
  const contacts = contactsQuery.data ?? [];
  const newClients = newClientsQuery.data ?? [];

  const stageData = useMemo<StageCount[]>(
    () =>
      STAGES.map((stage) => ({
        stage,
        count: stats?.byStage[stage] ?? 0,
      })),
    [stats],
  );

  const weeklyTrend = useMemo(
    () => (trendQuery.data === undefined ? undefined : computeWeeklyTrend(trendQuery.data)),
    [trendQuery.data],
  );

  const kpis = useMemo<Kpi[]>(() => {
    if (stats === undefined) {
      return [];
    }
    return [
      {
        title: "إجمالي العملاء",
        value: `${stats.totalClients}`,
        icon: <UsersIcon className="h-5 w-5" />,
        color: "blue",
        trend: weeklyTrend,
        trendLabel: "عملاء جدد vs. الأسبوع السابق",
      },
      {
        title: "نسبة الفوز",
        value: formatPercent(stats.winRate),
        icon: <TrendingUpIcon className="h-5 w-5" />,
        color: "green",
      },
      {
        title: "معدل التحويل",
        value: formatPercent(stats.conversionRate),
        icon: <PercentIcon className="h-5 w-5" />,
        color: "yellow",
      },
      {
        title: "صفقات نشطة",
        value: `${stats.activeDeals}`,
        icon: <ActivityIcon className="h-5 w-5" />,
        color: "red",
      },
    ];
  }, [stats, weeklyTrend]);

  const isFetching =
    statsQuery.isFetching ||
    dailyQuery.isFetching ||
    contactsQuery.isFetching ||
    newClientsQuery.isFetching;

  function refreshAll() {
    void queryClient.invalidateQueries({ queryKey: [DASHBOARD_QUERY_KEY] });
  }

  function retryStats() {
    void statsQuery.refetch();
  }

  return (
    <div dir="rtl" className={PAGE_CLASS}>
      <div className={PAGE_HEADER_CLASS}>
        <div>
          <h1 className={PAGE_TITLE_CLASS}>لوحة التحكم</h1>
          <p className={PAGE_SUBTITLE_CLASS}>
            {statsQuery.dataUpdatedAt > 0
              ? `آخر تحديث: ${formatTime(statsQuery.dataUpdatedAt)}`
              : "ملخّص الأداء"}
            {stats !== undefined
              ? ` · ${stats.newClientsThisMonth} عميل جديد هذا الشهر`
              : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isFetching ? (
            <span className="text-xs text-gray-400">جارٍ التحديث…</span>
          ) : null}
          <Button variant="secondary" onClick={refreshAll}>
            <RefreshIcon className="h-4 w-4" />
            تحديث
          </Button>
        </div>
      </div>

      {statsQuery.isError ? (
        <ErrorState
          message="تعذّر جلب مؤشرات الأداء"
          error={statsQuery.error}
          onRetry={retryStats}
        />
      ) : statsQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((index) => (
            <KPICardSkeleton key={index} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi, index) => (
            <div
              key={kpi.title}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <KPICard {...kpi} />
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <BarChart
          data={stageData}
          isLoading={statsQuery.isLoading}
          isError={statsQuery.isError}
          error={statsQuery.error}
          onRetry={retryStats}
        />
        <PieChart
          data={stageData}
          isLoading={statsQuery.isLoading}
          isError={statsQuery.isError}
          error={statsQuery.error}
          onRetry={retryStats}
        />
        <div className="lg:col-span-2">
          <LineChart
            data={daily}
            subtitle={`آخر ${range} يوم`}
            action={
              <select
                value={range}
                onChange={(event) => setRange(Number(event.target.value))}
                aria-label="نطاق العرض"
                className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {RANGE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option} يوم
                  </option>
                ))}
              </select>
            }
            isLoading={dailyQuery.isLoading}
            isError={dailyQuery.isError}
            error={dailyQuery.error}
            onRetry={() => void dailyQuery.refetch()}
          />
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-900">آخر التحديثات</h2>        <RecentActivity
          contacts={contacts}
          clients={newClients}
          isLoading={contactsQuery.isLoading || newClientsQuery.isLoading}
          isError={contactsQuery.isError || newClientsQuery.isError}
          error={contactsQuery.error ?? newClientsQuery.error}
          onRetry={refreshAll}
        />
      </section>
    </div>
  );
}