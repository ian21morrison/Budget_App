import { formatCurrency } from "@/lib/formatting";
import type { FinancialReport } from "@/lib/calculations/reporting";
import {
  metricLabel,
  metricValue,
  nestedSurface,
  primaryButton,
  secondaryButton,
  sectionDescription,
  sectionHeader,
  sectionTitle,
  subtleSurface,
  surface,
} from "@/components/uiStyles";

type ReportSectionProps = {
  report: FinancialReport;
  onDownloadCsv: () => void;
  onExportPdf: () => void;
};

const formatMonthLabel = (month: string) =>
  new Date(`${month}-01T00:00:00`).toLocaleDateString([], {
    month: "long",
    year: "numeric",
  });

const formatDateLabel = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const formatMonths = (months: number | null) => {
  if (months === null) {
    return "No payoff date";
  }

  if (months === 0) {
    return "Paid off";
  }

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years === 0) {
    return `${months} mo`;
  }

  return remainingMonths === 0
    ? `${years} yr`
    : `${years} yr ${remainingMonths} mo`;
};

const varianceClassName = (value: number) => {
  if (value > 0) {
    return "text-rose-300";
  }

  if (value < 0) {
    return "text-emerald-300";
  }

  return "text-neutral-100";
};

export function ReportSection({
  report,
  onDownloadCsv,
  onExportPdf,
}: ReportSectionProps) {
  const largestBudgetVariance = [...report.budgetVariance].sort(
    (first, second) => Math.abs(second.variance) - Math.abs(first.variance),
  )[0];

  return (
    <section id="reporting" className={`scroll-mt-24 ${surface}`}>
      <div className={sectionHeader}>
        <div>
          <h3 className={sectionTitle}>Financial Report</h3>
          <p className={sectionDescription}>
            {formatMonthLabel(report.month)} summary, budget variance, net
            worth trend, retirement status, and debt payoff outlook.
          </p>
        </div>
        <div data-report-hidden="true" className="flex flex-wrap gap-2">
          <button type="button" onClick={onDownloadCsv} className={secondaryButton}>
            Export CSV
          </button>
          <button type="button" onClick={onExportPdf} className={primaryButton}>
            Export PDF
          </button>
        </div>
      </div>

      <div className="grid gap-4 p-4 md:p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className={`${nestedSurface} p-4`}>
            <p className={metricLabel}>Actual surplus</p>
            <p
              className={`${metricValue} text-2xl ${
                report.actualSurplus >= 0 ? "text-emerald-300" : "text-rose-300"
              }`}
            >
              {formatCurrency(report.actualSurplus)}
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              {formatCurrency(report.surplusVariance)} vs plan
            </p>
          </div>

          <div className={`${nestedSurface} p-4`}>
            <p className={metricLabel}>Actual outflow</p>
            <p className={`${metricValue} text-2xl`}>
              {formatCurrency(report.actualOutflow)}
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              Planned {formatCurrency(report.plannedOutflow)}
            </p>
          </div>

          <div className={`${nestedSurface} p-4`}>
            <p className={metricLabel}>Net worth</p>
            <p className={`${metricValue} text-2xl`}>
              {formatCurrency(report.totals.netWorth)}
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              Assets {formatCurrency(report.totals.assets)}
            </p>
          </div>

          <div className={`${nestedSurface} p-4`}>
            <p className={metricLabel}>Retirement</p>
            <p
              className={`${metricValue} text-2xl ${
                report.retirementStatus.isOnTrack
                  ? "text-emerald-300"
                  : "text-amber-200"
              }`}
            >
              {report.retirementStatus.progress}%
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              {report.retirementStatus.isOnTrack ? "On track" : "Needs attention"}
            </p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <div className={`${subtleSurface} overflow-hidden`}>
            <div className="border-b border-white/10 px-4 py-3">
              <h4 className="text-sm font-semibold text-neutral-100">
                Budget Variance
              </h4>
              {largestBudgetVariance ? (
                <p className="mt-1 text-xs text-neutral-500">
                  Largest movement: {largestBudgetVariance.label} at{" "}
                  {formatCurrency(largestBudgetVariance.variance)}.
                </p>
              ) : null}
            </div>
            <div className="overflow-hidden">
              <table className="w-full table-fixed text-left text-sm">
                <thead className="text-xs uppercase tracking-[0.08em] text-neutral-500">
                  <tr>
                    <th className="w-[38%] px-4 py-3 font-medium">Category</th>
                    <th className="px-3 py-3 font-medium">Planned</th>
                    <th className="px-3 py-3 font-medium">Actual</th>
                    <th className="px-3 py-3 font-medium">Variance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {report.budgetVariance.map((item) => (
                    <tr key={item.id}>
                      <td className="break-words px-4 py-3 font-medium text-neutral-100">
                        {item.label}
                      </td>
                      <td className="px-3 py-3 text-neutral-400">
                        {formatCurrency(item.planned)}
                      </td>
                      <td className="px-3 py-3 text-neutral-400">
                        {formatCurrency(item.actual)}
                      </td>
                      <td
                        className={`px-3 py-3 font-semibold ${varianceClassName(
                          item.variance,
                        )}`}
                      >
                        {formatCurrency(item.variance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-4">
            <div className={`${subtleSurface} p-4`}>
              <p className="text-sm font-semibold text-neutral-100">
                Net Worth Trend
              </p>
              {report.netWorthTrend ? (
                <>
                  <p
                    className={`mt-3 text-2xl font-semibold tracking-tight ${
                      report.netWorthTrend.delta >= 0
                        ? "text-emerald-300"
                        : "text-rose-300"
                    }`}
                  >
                    {formatCurrency(report.netWorthTrend.delta)}
                  </p>
                  <p className="mt-1 text-sm text-neutral-500">
                    {formatDateLabel(report.netWorthTrend.firstDate)} to{" "}
                    {formatDateLabel(report.netWorthTrend.latestDate)} across{" "}
                    {report.netWorthTrend.snapshotCount} snapshots.
                  </p>
                </>
              ) : (
                <p className="mt-3 text-sm text-neutral-500">
                  Add net worth snapshots to show a trend.
                </p>
              )}
            </div>

            <div className={`${subtleSurface} p-4`}>
              <p className="text-sm font-semibold text-neutral-100">
                Retirement Status
              </p>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-neutral-50">
                {formatCurrency(report.retirementStatus.balanceAtTargetAge)}
              </p>
              <p className="mt-1 text-sm text-neutral-500">
                Projected at age {report.retirementStatus.targetAge}; gap{" "}
                {formatCurrency(report.retirementStatus.goalGap)} against{" "}
                {formatCurrency(report.retirementStatus.targetPortfolio)}.
              </p>
              <p className="mt-2 text-sm text-neutral-400">
                Required monthly contribution:{" "}
                {formatCurrency(
                  report.retirementStatus.requiredMonthlyContribution,
                )}
              </p>
            </div>
          </div>
        </div>

        <div className={`${subtleSurface} overflow-hidden`}>
          <div className="border-b border-white/10 px-4 py-3">
            <h4 className="text-sm font-semibold text-neutral-100">
              Debt Payoff Outlook
            </h4>
          </div>
          <div className="grid divide-y divide-white/10">
            {report.debtPayoffOutlook.map((debt) => (
              <div
                key={debt.id}
                className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_repeat(3,minmax(110px,auto))] sm:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-neutral-100">
                    {debt.name}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {debt.rate}% APR
                  </p>
                </div>
                <p className="text-sm text-neutral-400">
                  Balance {formatCurrency(debt.balance)}
                </p>
                <p className="text-sm text-neutral-400">
                  Pay {formatCurrency(debt.payment)}/mo
                </p>
                <p className="text-sm font-semibold text-neutral-100">
                  {formatMonths(debt.monthsToPayoff)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
