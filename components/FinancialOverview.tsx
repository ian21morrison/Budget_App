import { formatCurrency, formatPercent } from "@/lib/formatting";
import {
  metricLabel,
  metricValue,
  nestedSurface,
  progressTrack,
  statusBadge,
  surface,
} from "@/components/uiStyles";
import type { BudgetTotals, RetirementPlan, RetirementProjection } from "@/types";

type FinancialOverviewProps = {
  retirementPlan: RetirementPlan;
  retirementProjection: RetirementProjection;
  totals: BudgetTotals;
};

export function FinancialOverview({
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

  return (
    <section
      id="overview"
      className="scroll-mt-24 grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(360px,0.9fr)]"
    >
      <article className={`${surface} overflow-hidden`}>
        <div className="grid gap-6 p-5 md:p-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div>
            <p className={metricLabel}>Total net worth</p>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-neutral-50 md:text-5xl">
              {formatCurrency(totals.netWorth)}
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-400">
              Assets minus debt, updated from your local accounts, liabilities,
              contributions, and budget plan.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
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
            </div>
          </div>

          <div className="grid content-between gap-4 rounded-lg border border-white/10 bg-neutral-950/55 p-4">
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
      </article>

      <article className={`${surface} p-5 md:p-6`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={metricLabel}>Financial mix</p>
            <p className="mt-2 text-xl font-semibold tracking-tight text-neutral-50">
              {cashPercent}% cash
            </p>
          </div>
          <p className="text-right text-sm text-neutral-500">
            Debt load {debtPercent}%
          </p>
        </div>
        <div className="mt-6 grid gap-4">
          <div>
            <div className="mb-2 flex items-center justify-between text-xs text-neutral-500">
              <span>Cash</span>
              <span>{formatCurrency(totals.cash)}</span>
            </div>
            <div className={`${progressTrack} h-2`}>
              <div
                className="h-2 rounded-full bg-sky-300"
                style={{ width: `${Math.min(100, cashPercent)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between text-xs text-neutral-500">
              <span>Invested</span>
              <span>{formatCurrency(totals.invested)}</span>
            </div>
            <div className={`${progressTrack} h-2`}>
              <div
                className="h-2 rounded-full bg-violet-300"
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
            <div className="mb-2 flex items-center justify-between text-xs text-neutral-500">
              <span>Debt</span>
              <span>{formatCurrency(totals.debt)}</span>
            </div>
            <div className={`${progressTrack} h-2`}>
              <div
                className="h-2 rounded-full bg-rose-300"
                style={{ width: `${Math.min(100, debtPercent)}%` }}
              />
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}
