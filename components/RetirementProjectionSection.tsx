import { type FocusEvent } from "react";
import { formatCurrency, formatPercent } from "@/lib/formatting";
import type { BudgetTotals, RetirementPlan, RetirementProjection } from "@/types";

type RetirementProjectionSectionProps = {
  retirementPlan: RetirementPlan;
  retirementProjection: RetirementProjection;
  totals: Pick<BudgetTotals, "contributionBalance" | "monthlyInvestment">;
  onResetRetirementPlan: () => void;
  onUpdateRetirementPlan: (field: keyof RetirementPlan, value: number) => void;
  selectNumberInput: (event: FocusEvent<HTMLInputElement>) => void;
};

export function RetirementProjectionSection({
  retirementPlan,
  retirementProjection,
  totals,
  onResetRetirementPlan,
  onUpdateRetirementPlan,
  selectNumberInput,
}: RetirementProjectionSectionProps) {
  return (
    <section
      id="retirement"
      className="mt-4 scroll-mt-24 rounded-lg border border-white/10 bg-white/[0.035]"
    >
      <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold">Retirement Projection</h3>
          <p className="mt-1 text-sm text-neutral-500">
            Track whether contribution accounts can hit the goal portfolio by your
            goal age.
          </p>
        </div>
        <button
          type="button"
          onClick={onResetRetirementPlan}
          className="w-fit rounded-md border border-white/10 px-3 py-2 text-sm text-neutral-300 transition hover:bg-white/5 hover:text-white"
        >
          Reset
        </button>
      </div>

      <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block">
            <span className="text-xs text-neutral-500">Current age</span>
            <input
              type="number"
              onFocus={selectNumberInput}
              min="18"
              step="1"
              value={retirementPlan.currentAge}
              onChange={(event) =>
                onUpdateRetirementPlan("currentAge", Number(event.target.value))
              }
              className="mt-1 w-full rounded-md border border-white/10 bg-neutral-950/60 px-3 py-2 font-semibold text-neutral-100 outline-none focus:border-emerald-400/60"
            />
          </label>
          <label className="block">
            <span className="text-xs text-neutral-500">Goal age</span>
            <input
              type="number"
              onFocus={selectNumberInput}
              min="18"
              step="1"
              value={retirementPlan.targetAge}
              onChange={(event) =>
                onUpdateRetirementPlan("targetAge", Number(event.target.value))
              }
              className="mt-1 w-full rounded-md border border-white/10 bg-neutral-950/60 px-3 py-2 font-semibold text-neutral-100 outline-none focus:border-emerald-400/60"
            />
          </label>
          <label className="block">
            <span className="text-xs text-neutral-500">
              Goal portfolio by goal age
            </span>
            <div className="mt-1 flex items-center rounded-md border border-white/10 bg-neutral-950/60 px-2 focus-within:border-emerald-400/60">
              <span className="text-neutral-500">$</span>
              <input
                type="number"
                onFocus={selectNumberInput}
                min="0"
                step="10000"
                value={retirementPlan.targetPortfolio}
                onChange={(event) =>
                  onUpdateRetirementPlan(
                    "targetPortfolio",
                    Number(event.target.value),
                  )
                }
                className="min-w-0 flex-1 bg-transparent px-1 py-2 font-semibold text-neutral-100 outline-none"
              />
            </div>
          </label>
          <label className="block">
            <span className="text-xs text-neutral-500">
              Default return for new invested accounts
            </span>
            <div className="mt-1 flex items-center rounded-md border border-white/10 bg-neutral-950/60 px-2 focus-within:border-emerald-400/60">
              <input
                type="number"
                onFocus={selectNumberInput}
                min="0"
                step="0.25"
                value={retirementPlan.annualReturn}
                onChange={(event) =>
                  onUpdateRetirementPlan(
                    "annualReturn",
                    Number(event.target.value),
                  )
                }
                className="min-w-0 flex-1 bg-transparent px-1 py-2 font-semibold text-neutral-100 outline-none"
              />
              <span className="text-neutral-500">%</span>
            </div>
          </label>
          <div className="rounded-lg border border-white/10 bg-neutral-950/45 px-3 py-2">
            <p className="text-xs text-neutral-500">Contribution balance</p>
            <p className="mt-1 text-lg font-semibold text-neutral-100">
              {formatCurrency(totals.contributionBalance)}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-neutral-950/45 px-3 py-2">
            <p className="text-xs text-neutral-500">Monthly contributions</p>
            <p className="mt-1 text-lg font-semibold text-neutral-100">
              {formatCurrency(totals.monthlyInvestment)}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-neutral-950/45 px-3 py-2">
            <p className="text-xs text-neutral-500">Overall weighted return</p>
            <p className="mt-1 text-lg font-semibold text-neutral-100">
              {formatPercent(retirementProjection.weightedAnnualReturn)}%
            </p>
          </div>
        </div>

        <aside className="rounded-lg border border-white/10 bg-neutral-950/45 p-4">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              retirementProjection.isOnTrack
                ? "bg-emerald-400/10 text-emerald-300"
                : "bg-amber-300/10 text-amber-200"
            }`}
          >
            {retirementProjection.isOnTrack ? "On track" : "Needs more"}
          </span>
          <p className="mt-4 text-sm text-neutral-400">
            Projected at age {retirementPlan.targetAge}
          </p>
          <p className="mt-1 text-3xl font-semibold tracking-tight">
            {formatCurrency(retirementProjection.balanceAtTargetAge)}
          </p>
          <div className="mt-4 h-3 rounded-full bg-white/10">
            <div
              className={`h-3 rounded-full ${
                retirementProjection.isOnTrack
                  ? "bg-emerald-400"
                  : "bg-amber-300"
              }`}
              style={{ width: `${retirementProjection.progress}%` }}
            />
          </div>
          <div className="mt-4 grid gap-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-neutral-500">Goal date</span>
              <span className="font-medium text-neutral-100">
                {retirementProjection.projectedAge === null
                  ? "Past 75 years"
                  : `Age ${formatPercent(retirementProjection.projectedAge)}`}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-neutral-500">Needed monthly</span>
              <span className="font-medium text-neutral-100">
                {formatCurrency(
                  retirementProjection.requiredMonthlyContribution,
                )}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-neutral-500">Current monthly</span>
              <span className="font-medium text-neutral-100">
                {formatCurrency(totals.monthlyInvestment)}
              </span>
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-white/10 bg-neutral-950/50 p-3">
            <p className="text-xs font-medium text-neutral-400">Return mix</p>
            <div className="mt-3 grid gap-2">
              {retirementProjection.returnMix.length > 0 ? (
                retirementProjection.returnMix.map((account) => (
                  <div
                    key={account.id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-xs"
                  >
                    <span className="flex min-w-0 items-center gap-2 text-neutral-400">
                      <span
                        className={`size-2 shrink-0 rounded-full ${account.accent}`}
                      />
                      <span className="truncate">{account.name}</span>
                    </span>
                    <span className="font-medium text-neutral-100">
                      {formatPercent(account.share)}% at{" "}
                      {formatPercent(account.annualReturn)}%
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-neutral-500">
                  Add monthly contribution accounts to see the blended return.
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>

      <div className="border-t border-white/10 p-5">
        <div className="rounded-lg border border-white/10 bg-neutral-950/45 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h4 className="text-base font-semibold">
                Projection to Age {retirementPlan.targetAge}
              </h4>
              <p className="mt-1 text-sm text-neutral-500">
                Current contribution balances plus monthly contributions.
              </p>
            </div>
            <div className="text-sm text-neutral-400">
              Goal {formatCurrency(retirementPlan.targetPortfolio)}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-neutral-400">
            <span className="flex items-center gap-2">
              <span className="h-1 w-8 rounded-full bg-emerald-400" />
              Projected portfolio
            </span>
            <span className="flex items-center gap-2">
              <span className="h-0.5 w-8 border-t-2 border-dashed border-amber-300" />
              Target portfolio
            </span>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px] xl:items-stretch">
            <div className="overflow-hidden rounded-lg border border-white/10 bg-neutral-950/60 p-3">
              <div className="aspect-[16/9] w-full">
                <svg
                  aria-label="Retirement portfolio projection chart"
                  role="img"
                  viewBox="0 0 720 260"
                  className="h-full w-full"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <line
                    x1="48"
                    y1="24"
                    x2="48"
                    y2="218"
                    stroke="rgba(255,255,255,0.16)"
                    strokeWidth="1"
                  />
                  <line
                    x1="48"
                    y1="218"
                    x2="690"
                    y2="218"
                    stroke="rgba(255,255,255,0.16)"
                    strokeWidth="1"
                  />
                  {[0.25, 0.5, 0.75].map((tick) => (
                    <line
                      key={tick}
                      x1="48"
                      y1={218 - 194 * tick}
                      x2="690"
                      y2={218 - 194 * tick}
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="1"
                    />
                  ))}
                  <line
                    x1="48"
                    y1={
                      218 -
                      (retirementPlan.targetPortfolio /
                        retirementProjection.maxChartBalance) *
                        194
                    }
                    x2="690"
                    y2={
                      218 -
                      (retirementPlan.targetPortfolio /
                        retirementProjection.maxChartBalance) *
                        194
                    }
                    stroke="rgba(251,191,36,0.85)"
                    strokeDasharray="6 6"
                    strokeWidth="2"
                  />
                  <polyline
                    fill="none"
                    stroke="rgb(52,211,153)"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="4"
                    points={retirementProjection.projectionPoints
                      .map((point, index, points) => {
                        const x =
                          48 +
                          (points.length === 1
                            ? 0
                            : (index / (points.length - 1)) * 642);
                        const y =
                          218 -
                          (point.balance /
                            retirementProjection.maxChartBalance) *
                            194;

                        return `${x},${y}`;
                      })
                      .join(" ")}
                  />
                  {retirementProjection.projectionPoints.map(
                    (point, index, points) => {
                      const x =
                        48 +
                        (points.length === 1
                          ? 0
                          : (index / (points.length - 1)) * 642);
                      const y =
                        218 -
                        (point.balance /
                          retirementProjection.maxChartBalance) *
                          194;

                      return (
                        <circle
                          key={`${point.age}-${point.balance}`}
                          cx={x}
                          cy={y}
                          r={index === points.length - 1 ? 5 : 3}
                          fill="rgb(52,211,153)"
                        />
                      );
                    },
                  )}
                  <text x="48" y="246" fill="rgb(163,163,163)" fontSize="13">
                    Age {retirementPlan.currentAge}
                  </text>
                  <text
                    x="690"
                    y="246"
                    fill="rgb(163,163,163)"
                    fontSize="13"
                    textAnchor="end"
                  >
                    Age {retirementPlan.targetAge}
                  </text>
                  <text x="52" y="36" fill="rgb(163,163,163)" fontSize="13">
                    {formatCurrency(retirementProjection.maxChartBalance)}
                  </text>
                </svg>
              </div>
            </div>

            <div className="grid gap-3 rounded-lg border border-white/10 bg-neutral-950/60 p-4 text-sm">
              <div>
                <p className="text-xs text-neutral-500">At goal age</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-neutral-100">
                  {formatCurrency(retirementProjection.balanceAtTargetAge)}
                </p>
              </div>
              <div className="h-px bg-white/10" />
              <div className="grid gap-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-neutral-500">
                    {retirementProjection.goalGap >= 0
                      ? "Projected surplus"
                      : "Projected gap"}
                  </span>
                  <span
                    className={`font-semibold ${
                      retirementProjection.goalGap >= 0
                        ? "text-emerald-300"
                        : "text-amber-200"
                    }`}
                  >
                    {formatCurrency(Math.abs(retirementProjection.goalGap))}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-neutral-500">Goal portfolio</span>
                  <span className="font-semibold text-neutral-100">
                    {formatCurrency(retirementPlan.targetPortfolio)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-neutral-500">Monthly pace</span>
                  <span className="font-semibold text-neutral-100">
                    {formatCurrency(totals.monthlyInvestment)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-neutral-500">
                    Overall weighted return
                  </span>
                  <span className="font-semibold text-neutral-100">
                    {formatPercent(retirementProjection.weightedAnnualReturn)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
