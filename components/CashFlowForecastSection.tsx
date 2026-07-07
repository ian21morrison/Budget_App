import { formatCurrency } from "@/lib/formatting";
import {
  metricLabel,
  metricValue,
  nestedSurface,
  sectionDescription,
  sectionHeader,
  sectionTitle,
  statusBadge,
  subtleSurface,
  surface,
} from "@/components/uiStyles";
import type { CashFlowForecast } from "@/types";

type CashFlowForecastSectionProps = {
  forecast: CashFlowForecast;
};

const formatPaycheckDate = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });

const getEndingCashTone = (endingCash: number) =>
  endingCash < 0
    ? "text-rose-300"
    : endingCash < 1_000
      ? "text-amber-200"
      : "text-emerald-300";

export function CashFlowForecastSection({
  forecast,
}: CashFlowForecastSectionProps) {
  const ninetyDayForecast =
    forecast.horizons.find((horizon) => horizon.days === 90) ??
    forecast.horizons[forecast.horizons.length - 1];

  return (
    <section className={`mt-5 ${surface}`}>
      <div className={`${sectionHeader} xl:items-center`}>
        <div>
          <h3 className={sectionTitle}>Cash-flow forecast</h3>
          <p className={sectionDescription}>
            30, 60, and 90-day runway from cash, income, bills, debts,
            transfers, and planned contributions.
          </p>
        </div>
        <div className={`${nestedSurface} min-w-52 px-3 py-2`}>
          <p className={metricLabel}>Runway</p>
          <p className={`${metricValue} text-xl`}>
            {forecast.runwayDays === null
              ? "Cash positive"
              : `${forecast.runwayDays} days`}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            starts with {formatCurrency(forecast.startingCash)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 p-4 md:p-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-3 md:grid-cols-3">
          {forecast.horizons.map((horizon) => (
            <div key={horizon.days} className={`${nestedSurface} p-4`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={metricLabel}>{horizon.days} days</p>
                  <p
                    className={`${metricValue} text-2xl ${getEndingCashTone(
                      horizon.endingCash,
                    )}`}
                  >
                    {formatCurrency(horizon.endingCash)}
                  </p>
                </div>
                <span
                  className={`${statusBadge} min-w-20 ${
                    horizon.netCashFlow >= 0
                      ? "bg-emerald-300/10 text-emerald-200"
                      : "bg-rose-300/10 text-rose-200"
                  }`}
                >
                  {horizon.netCashFlow >= 0 ? "+" : ""}
                  {formatCurrency(horizon.netCashFlow)}
                </span>
              </div>
              <div className="mt-4 grid gap-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-neutral-500">Income</span>
                  <span className="font-medium text-emerald-200">
                    {formatCurrency(horizon.income)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-neutral-500">Outflow</span>
                  <span className="font-medium text-neutral-200">
                    {formatCurrency(horizon.totalOutflow)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-neutral-600">Bills</span>
                  <span className="text-neutral-400">
                    {formatCurrency(horizon.bills)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-neutral-600">Debt + saving</span>
                  <span className="text-neutral-400">
                    {formatCurrency(
                      horizon.debtPayments + horizon.contributions,
                    )}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className={`${subtleSurface} p-4`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={metricLabel}>Assumptions</p>
              <p className="mt-1 text-sm text-neutral-400">
                Next income cycle starts {formatPaycheckDate(
                  forecast.nextPaycheckDate,
                )}.
              </p>
            </div>
            <p
              className={`text-right text-sm font-semibold ${
                forecast.monthlyPlannedCashFlow >= 0
                  ? "text-emerald-300"
                  : "text-rose-300"
              }`}
            >
              {forecast.monthlyPlannedCashFlow >= 0 ? "+" : ""}
              {formatCurrency(forecast.monthlyPlannedCashFlow)}/mo
            </p>
          </div>

          <div className="mt-4 grid gap-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-neutral-500">Monthly income</span>
              <span className="font-medium text-neutral-100">
                {formatCurrency(forecast.monthlyIncome)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-neutral-500">Debt payments</span>
              <span className="font-medium text-neutral-100">
                {formatCurrency(forecast.monthlyDebtPayments)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-neutral-500">Transfers</span>
              <span className="font-medium text-neutral-100">
                {formatCurrency(forecast.monthlyTransfers)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-neutral-500">Contributions</span>
              <span className="font-medium text-neutral-100">
                {formatCurrency(forecast.monthlyContributions)}
              </span>
            </div>
          </div>

          {ninetyDayForecast ? (
            <p className="mt-4 border-t border-white/10 pt-3 text-xs leading-5 text-neutral-500">
              90-day cash lands at{" "}
              <span className={getEndingCashTone(ninetyDayForecast.endingCash)}>
                {formatCurrency(ninetyDayForecast.endingCash)}
              </span>{" "}
              after scheduled inflows and known outflows.
            </p>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
