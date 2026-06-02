import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/formatting";
import {
  metricLabel,
  metricValue,
  nestedSurface,
  sectionDescription,
  sectionHeader,
  sectionTitle,
  surface,
} from "@/components/uiStyles";
import type { NetWorthSnapshot } from "@/types";

type HistoryView = "weekly" | "monthly" | "yearly" | "all";

type NetWorthHistorySectionProps = {
  snapshots: NetWorthSnapshot[];
};

const historyViews: { label: string; value: HistoryView }[] = [
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
  { label: "All", value: "all" },
];

const sumBalances = (balances: Record<string, number>) =>
  Object.values(balances).reduce((total, balance) => total + balance, 0);

const getSnapshotTotals = (snapshot: NetWorthSnapshot) => {
  const assets = sumBalances(snapshot.accountBalances);
  const debt = sumBalances(snapshot.debtBalances);

  return {
    assets,
    debt,
    netWorth: assets - debt,
  };
};

const formatDateLabel = (dateKey: string) => {
  const date = new Date(`${dateKey}T00:00:00`);

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatAxisDateLabel = (dateKey: string) => {
  const date = new Date(`${dateKey}T00:00:00`);

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
};

const getViewWindowDays = (view: HistoryView) => {
  if (view === "weekly") {
    return 7;
  }

  if (view === "monthly") {
    return 30;
  }

  if (view === "yearly") {
    return 365;
  }

  return Number.POSITIVE_INFINITY;
};

const getDaysBetween = (startDate: string, endDate: string) =>
  Math.round(
    (new Date(`${endDate}T00:00:00`).getTime() -
      new Date(`${startDate}T00:00:00`).getTime()) /
      86_400_000,
  );

const formatCompactCurrency = (value: number) => {
  const sign = value < 0 ? "-" : "";
  const absoluteValue = Math.abs(value);

  if (absoluteValue >= 1_000_000) {
    return `${sign}$${(absoluteValue / 1_000_000).toFixed(1)}M`;
  }

  if (absoluteValue >= 1_000) {
    return `${sign}$${Math.round(absoluteValue / 1_000)}k`;
  }

  return `${sign}$${Math.round(absoluteValue)}`;
};

export function NetWorthHistorySection({
  snapshots,
}: NetWorthHistorySectionProps) {
  const [historyView, setHistoryView] = useState<HistoryView>("all");
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const chartWidth = 640;
  const chartHeight = 240;
  const chartPadding = {
    bottom: 42,
    left: 68,
    right: 18,
    top: 22,
  };
  const trendPoints = useMemo(() => {
    const sortedSnapshots = [...snapshots].sort((first, second) =>
      first.date.localeCompare(second.date),
    );

    return sortedSnapshots.map((snapshot) => ({
      ...getSnapshotTotals(snapshot),
      date: snapshot.date,
      label: formatDateLabel(snapshot.date),
    }));
  }, [snapshots]);
  const latestTrendPoint = trendPoints[trendPoints.length - 1];
  const viewWindowDays = getViewWindowDays(historyView);
  const visibleTrendPoints =
    historyView === "all" || !latestTrendPoint
      ? trendPoints
      : trendPoints.filter(
          (point) =>
            getDaysBetween(point.date, latestTrendPoint.date) <= viewWindowDays,
        );
  const firstPoint = visibleTrendPoints[0];
  const latestPoint = visibleTrendPoints[visibleTrendPoints.length - 1];
  const trendDelta =
    firstPoint && latestPoint ? latestPoint.netWorth - firstPoint.netWorth : 0;
  const rawMinTrendValue =
    visibleTrendPoints.length > 0
      ? Math.min(...visibleTrendPoints.map((point) => point.netWorth))
      : 0;
  const rawMaxTrendValue =
    visibleTrendPoints.length > 0
      ? Math.max(...visibleTrendPoints.map((point) => point.netWorth))
      : 1;
  const rawTrendRange = Math.max(rawMaxTrendValue - rawMinTrendValue, 1);
  const trendPadding = Math.max(rawTrendRange * 0.15, Math.abs(rawMaxTrendValue) * 0.02, 100);
  const minTrendValue = rawMinTrendValue - trendPadding;
  const maxTrendValue = rawMaxTrendValue + trendPadding;
  const trendRange = Math.max(maxTrendValue - minTrendValue, 1);
  const yAxisTicks = [
    maxTrendValue,
    minTrendValue + trendRange / 2,
    minTrendValue,
  ];
  const plotWidth = chartWidth - chartPadding.left - chartPadding.right;
  const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom;
  const getPointX = (index: number) =>
    visibleTrendPoints.length === 1
      ? chartPadding.left + plotWidth / 2
      : chartPadding.left +
        (index / (visibleTrendPoints.length - 1)) * plotWidth;
  const getPointY = (netWorth: number) =>
    chartPadding.top +
    ((maxTrendValue - netWorth) / trendRange) * plotHeight;
  const polylinePoints = visibleTrendPoints
    .map((point, index) => {
      return `${getPointX(index)},${getPointY(point.netWorth)}`;
    })
    .join(" ");

  return (
    <section id="net-worth-history" className={`mt-4 scroll-mt-24 ${surface}`}>
      <div className={sectionHeader}>
        <div>
          <h3 className={sectionTitle}>Net Worth History</h3>
          <p className={sectionDescription}>
            Automatically tracked from the dates you enter account and debt
            balances in this app.
          </p>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsViewMenuOpen((current) => !current)}
            aria-expanded={isViewMenuOpen}
            className="inline-flex min-h-9 min-w-28 items-center justify-between gap-3 rounded-md border border-white/10 bg-neutral-950/55 px-3 py-2 text-sm font-semibold text-neutral-100 transition hover:border-white/20 hover:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-white/15"
          >
            {historyViews.find((view) => view.value === historyView)?.label}
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className={`size-4 text-neutral-500 transition ${
                isViewMenuOpen ? "rotate-180" : ""
              }`}
              fill="none"
            >
              <path
                d="M5.5 8 10 12.5 14.5 8"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
          </button>
          {isViewMenuOpen ? (
            <div className="absolute right-0 top-11 z-30 grid min-w-36 gap-1 rounded-lg border border-white/10 bg-neutral-950/95 p-1 shadow-2xl backdrop-blur">
              {historyViews.map((view) => (
                <button
                  key={view.value}
                  type="button"
                  onClick={() => {
                    setHistoryView(view.value);
                    setIsViewMenuOpen(false);
                  }}
                  aria-pressed={historyView === view.value}
                  className={`rounded-md px-3 py-2 text-left text-sm font-semibold transition ${
                    historyView === view.value
                      ? "bg-white text-neutral-950 shadow-sm"
                      : "text-neutral-400 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  {view.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className={`${nestedSurface} overflow-hidden p-4`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className={metricLabel}>Tracked net worth</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-neutral-50">
                {latestPoint ? formatCurrency(latestPoint.netWorth) : "$0"}
              </p>
            </div>
            {historyView !== "all" ? (
              <div className="text-right">
                <p className={metricLabel}>Change</p>
                <p
                  className={`mt-2 text-xl font-semibold ${
                    trendDelta >= 0 ? "text-emerald-300" : "text-rose-300"
                  }`}
                >
                  {trendDelta >= 0 ? "+" : ""}
                  {formatCurrency(trendDelta)}
                </p>
              </div>
            ) : null}
          </div>

          <div className="mt-6">
            {visibleTrendPoints.length > 0 ? (
              <div>
                <div className="mb-2 flex items-center justify-between gap-3 text-xs font-semibold uppercase text-neutral-300">
                  <span>Net worth</span>
                  <span>Date</span>
                </div>
                <svg
                  aria-label={`Net worth history chart, ${historyView} view`}
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="h-72 w-full"
                  role="img"
                >
                  {yAxisTicks.map((tick) => {
                    const y = getPointY(tick);

                    return (
                      <g key={tick}>
                        <line
                          x1={chartPadding.left}
                          x2={chartWidth - chartPadding.right}
                          y1={y}
                          y2={y}
                          stroke="rgba(255,255,255,0.12)"
                          strokeWidth="1"
                        />
                        <text
                          dominantBaseline="middle"
                          fill="rgb(212,212,216)"
                          fontSize="12"
                          fontWeight="600"
                          textAnchor="end"
                          x={chartPadding.left - 10}
                          y={y}
                        >
                          {formatCompactCurrency(tick)}
                        </text>
                      </g>
                    );
                  })}
                  <line
                    x1={chartPadding.left}
                    x2={chartPadding.left}
                    y1={chartPadding.top}
                    y2={chartHeight - chartPadding.bottom}
                    stroke="rgba(255,255,255,0.28)"
                    strokeWidth="1.4"
                  />
                  <line
                    x1={chartPadding.left}
                    x2={chartWidth - chartPadding.right}
                    y1={chartHeight - chartPadding.bottom}
                    y2={chartHeight - chartPadding.bottom}
                    stroke="rgba(255,255,255,0.28)"
                    strokeWidth="1.4"
                  />
                  {visibleTrendPoints.length > 1 ? (
                    <polyline
                      fill="none"
                      points={polylinePoints}
                      stroke="#34d399"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="5"
                    />
                  ) : (
                    <circle
                      cx={getPointX(0)}
                      cy={getPointY(visibleTrendPoints[0].netWorth)}
                      fill="#34d399"
                      r="6"
                    />
                  )}
                  {visibleTrendPoints.map((point, index) => {
                    const shouldShowLabel =
                      index === 0 ||
                      index === visibleTrendPoints.length - 1 ||
                      (visibleTrendPoints.length > 2 &&
                        index ===
                          Math.floor((visibleTrendPoints.length - 1) / 2));

                    if (!shouldShowLabel) {
                      return null;
                    }

                    return (
                      <text
                        key={point.date}
                        fill="rgb(212,212,216)"
                        fontSize="12"
                        fontWeight="600"
                        textAnchor={
                          index === 0
                            ? "start"
                            : index === visibleTrendPoints.length - 1
                              ? "end"
                              : "middle"
                        }
                        x={getPointX(index)}
                        y={chartHeight - chartPadding.bottom + 24}
                      >
                        {formatAxisDateLabel(point.date)}
                      </text>
                    );
                  })}
                </svg>
              </div>
            ) : (
              <div className="grid min-h-56 place-items-center rounded-md border border-dashed border-white/10 text-sm text-neutral-500">
                History starts when balances are entered.
              </div>
            )}
          </div>

          {firstPoint && latestPoint ? (
            <div className="mt-4 flex items-center justify-between gap-3 text-xs text-neutral-500">
              <span>{firstPoint.label}</span>
              <span>
                {visibleTrendPoints.length} of {trendPoints.length} points
              </span>
              <span>{latestPoint.label}</span>
            </div>
          ) : null}
        </div>

        <aside className={`${nestedSurface} p-4`}>
          <p className={metricLabel}>Latest tracked day</p>
          <p className={`${metricValue} text-xl`}>
            {latestPoint ? latestPoint.label : "Not tracked yet"}
          </p>
          <div className="mt-5 grid gap-3">
            <div>
              <p className={metricLabel}>Assets</p>
              <p className="mt-1 text-lg font-semibold text-neutral-50">
                {latestPoint ? formatCurrency(latestPoint.assets) : "$0"}
              </p>
            </div>
            <div>
              <p className={metricLabel}>Debt</p>
              <p className="mt-1 text-lg font-semibold text-neutral-50">
                {latestPoint ? formatCurrency(latestPoint.debt) : "$0"}
              </p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-6 text-neutral-500">
            Each day keeps the latest balances you entered. Weekly, monthly, and
            yearly views show tracked days inside that date range.
          </p>
        </aside>
      </div>
    </section>
  );
}
