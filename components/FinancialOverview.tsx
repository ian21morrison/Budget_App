import { formatCurrency, formatPercent } from "@/lib/formatting";
import {
  metricLabel,
  metricValue,
  nestedSurface,
  progressTrack,
  statusBadge,
  surface,
} from "@/components/uiStyles";
import type {
  BudgetTotals,
  NetWorthSnapshot,
  RecurringBillsSummary,
  RetirementPlan,
  RetirementProjection,
} from "@/types";

type FinancialOverviewProps = {
  netWorthSnapshots: NetWorthSnapshot[];
  recurringBillsSummary: RecurringBillsSummary;
  retirementPlan: RetirementPlan;
  retirementProjection: RetirementProjection;
  totals: BudgetTotals;
};

const sumBalances = (balances: Record<string, number>) =>
  Object.values(balances).reduce((total, balance) => total + balance, 0);

const getSnapshotNetWorth = (snapshot: NetWorthSnapshot) =>
  sumBalances(snapshot.accountBalances) - sumBalances(snapshot.debtBalances);

const getDaysBetween = (startDate: string, endDate: string) =>
  Math.round(
    (new Date(`${endDate}T00:00:00`).getTime() -
      new Date(`${startDate}T00:00:00`).getTime()) /
      86_400_000,
  );

export function FinancialOverview({
  netWorthSnapshots,
  recurringBillsSummary,
  retirementPlan,
  retirementProjection,
  totals,
}: FinancialOverviewProps) {
  const cashPercent = Math.round(
    (totals.cash / Math.max(totals.assets, 1)) * 100,
  );
  const debtPercent = Math.round(
    (totals.debt / Math.max(totals.assets + totals.debt, 1)) * 100,
  );
  const trendPoints = [...netWorthSnapshots]
    .sort((first, second) => first.date.localeCompare(second.date))
    .map((snapshot) => ({
      date: snapshot.date,
      netWorth: getSnapshotNetWorth(snapshot),
    }));
  const firstTrendPoint = trendPoints[0];
  const latestTrendPoint = trendPoints[trendPoints.length - 1];
  const thirtyDayStartPoint =
    latestTrendPoint &&
    [...trendPoints]
      .reverse()
      .find((point) => getDaysBetween(point.date, latestTrendPoint.date) >= 30);
  const trendStartPoint = thirtyDayStartPoint ?? firstTrendPoint;
  const trendDelta =
    trendStartPoint && latestTrendPoint
      ? latestTrendPoint.netWorth - trendStartPoint.netWorth
      : 0;
  const trendDays =
    trendStartPoint && latestTrendPoint
      ? getDaysBetween(trendStartPoint.date, latestTrendPoint.date)
      : 0;

  return (
    <section
      id="overview"
      className="scroll-mt-24 grid gap-3 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.65fr)]"
    >
      <article className={`${surface} overflow-hidden`}>
        <div className="grid h-full grid-rows-[auto_1fr] gap-3 p-4 xl:p-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="min-w-0">
              <p className={metricLabel}>Total net worth</p>
              <p className="mt-2 text-4xl font-semibold tracking-tight text-neutral-50">
                {formatCurrency(totals.netWorth)}
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-400">
                Assets minus debt, updated from your local accounts,
                liabilities, contributions, and budget plan.
              </p>
            </div>

            <div className={`${nestedSurface} grid gap-3 p-3`}>
              <div>
                <div className="flex items-center justify-between gap-3">
                  <p className={metricLabel}>Retirement projection</p>
                  <span
                    className={`${statusBadge} ${
                      retirementProjection.isOnTrack
                        ? "bg-emerald-300/10 text-emerald-200"
                        : "bg-amber-300/10 text-amber-200"
                    }`}
                  >
                    {retirementProjection.isOnTrack ? "On track" : "Needs more"}
                  </span>
                </div>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-neutral-50">
                  {formatCurrency(retirementProjection.balanceAtTargetAge)}
                </p>
                <p className="mt-1 text-sm text-neutral-500">
                  projected by age {retirementPlan.targetAge}
                </p>
              </div>
              <div>
                <div className={`${progressTrack} h-2`}>
                  <div
                    className={`h-2 rounded-full ${
                      retirementProjection.isOnTrack
                        ? "bg-emerald-300"
                        : "bg-amber-300"
                    }`}
                    style={{ width: `${retirementProjection.progress}%` }}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 text-xs text-neutral-500">
                  <span>{retirementProjection.progress}% of goal</span>
                  <span>
                    {formatPercent(retirementProjection.weightedAnnualReturn)}%
                    return
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid auto-rows-fr gap-2 sm:grid-cols-2 xl:grid-cols-[0.75fr_0.75fr_0.9fr_1.1fr]">
            <div className={nestedSurface + " p-3"}>
              <p className={metricLabel}>Assets</p>
              <p className={`${metricValue} text-xl`}>
                {formatCurrency(totals.assets)}
              </p>
            </div>
            <div className={nestedSurface + " p-3"}>
              <p className={metricLabel}>Debt</p>
              <p className={`${metricValue} text-xl`}>
                {formatCurrency(totals.debt)}
              </p>
            </div>
            <div className={nestedSurface + " p-3"}>
              <p className={metricLabel}>30-day change</p>
              <p
                className={`${metricValue} text-xl ${
                  trendDelta >= 0 ? "text-emerald-300" : "text-rose-300"
                }`}
              >
                {trendDelta >= 0 ? "+" : ""}
                {formatCurrency(trendDelta)}
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                {trendDays >= 30
                  ? "Last 30 days"
                  : trendDays > 0
                    ? `${trendDays} tracked days`
                    : "Starts today"}
              </p>
            </div>
            <div className={nestedSurface + " min-w-0 p-3"}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className={metricLabel}>Bills due</p>
                  <p className={`${metricValue} text-xl text-amber-200`}>
                    {formatCurrency(
                      recurringBillsSummary.totalDueBeforePaycheck,
                    )}
                  </p>
                </div>
                <span
                  className={`${statusBadge} min-w-14 px-2 ${
                    recurringBillsSummary.totalDueBeforePaycheck > totals.cash
                      ? "bg-rose-300/10 text-rose-200"
                      : "bg-emerald-300/10 text-emerald-200"
                  }`}
                >
                  {recurringBillsSummary.unpaidDueBeforePaycheck.length}
                </span>
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                Due by{" "}
                {new Date(
                  `${recurringBillsSummary.nextPaycheckDate}T00:00:00`,
                ).toLocaleDateString([], {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      </article>

      <article className={`${surface} p-4`}>
        <div className="grid h-full content-between gap-3">
          <div className={`${nestedSurface} p-3`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={metricLabel}>Financial mix</p>
                <p className="mt-1.5 text-lg font-semibold tracking-tight text-neutral-50">
                  {cashPercent}% cash
                </p>
              </div>
              <p className="text-right text-sm text-neutral-500">
                Debt load {debtPercent}%
              </p>
            </div>
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs text-neutral-500">
              <span>Cash</span>
              <span>{formatCurrency(totals.cash)}</span>
            </div>
            <div className={`${progressTrack} h-3`}>
              <div
                className="h-3 rounded-full bg-sky-300 shadow-[0_0_18px_rgba(125,211,252,0.18)]"
                style={{ width: `${Math.min(100, cashPercent)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs text-neutral-500">
              <span>Invested</span>
              <span>{formatCurrency(totals.invested)}</span>
            </div>
            <div className={`${progressTrack} h-3`}>
              <div
                className="h-3 rounded-full bg-violet-300 shadow-[0_0_18px_rgba(196,181,253,0.18)]"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round((totals.invested / Math.max(totals.assets, 1)) * 100),
                  )}%`,
                }}
              />
            </div>
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs text-neutral-500">
              <span>Debt</span>
              <span>{formatCurrency(totals.debt)}</span>
            </div>
            <div className={`${progressTrack} h-3`}>
              <div
                className="h-3 rounded-full bg-rose-300 shadow-[0_0_18px_rgba(253,164,175,0.18)]"
                style={{ width: `${Math.min(100, debtPercent)}%` }}
              />
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}
