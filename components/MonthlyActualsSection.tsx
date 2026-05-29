import { type FocusEvent, useState } from "react";
import { formatCurrency } from "@/lib/formatting";
import {
  inputBase,
  metricLabel,
  metricValue,
  nestedSurface,
  progressTrack,
  secondaryButton,
  sectionDescription,
  sectionHeader,
  sectionTitle,
  subtleSurface,
  surface,
} from "@/components/uiStyles";
import type {
  Budget,
  BudgetTotals,
  MonthlyActual,
  MonthlyActualTotals,
} from "@/types";

type MonthlyActualsSectionProps = {
  actual: MonthlyActual;
  actualTotals: MonthlyActualTotals;
  budgets: Budget[];
  canGoToPreviousMonth: boolean;
  minMonth: string;
  totals: Pick<
    BudgetTotals,
    "debtPayments" | "monthlyBudget" | "monthlyInvestment" | "monthlySurplus"
  >;
  onGoToNextMonth: () => void;
  onGoToPreviousMonth: () => void;
  onResetMonthFromPlan: () => void;
  onSelectMonth: (month: string) => void;
  onUpdateActualBudget: (budgetId: string, amount: number) => void;
  onUpdateActualField: (
    field: "income" | "transfers" | "debtPayments" | "contributions",
    value: number,
  ) => void;
  selectNumberInput: (event: FocusEvent<HTMLInputElement>) => void;
};

const formatMonthLabel = (month: string) => {
  const [year, monthIndex] = month.split("-").map(Number);
  const date = new Date(year, monthIndex - 1, 1);

  return date.toLocaleDateString([], {
    month: "long",
    year: "numeric",
  });
};

const monthOptions = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const varianceClass = (value: number, positiveIsGood = true) => {
  if (value === 0) {
    return "text-neutral-400";
  }

  const isGood = positiveIsGood ? value > 0 : value < 0;
  return isGood ? "text-emerald-300" : "text-rose-300";
};

export function MonthlyActualsSection({
  actual,
  actualTotals,
  budgets,
  canGoToPreviousMonth,
  minMonth,
  totals,
  onGoToNextMonth,
  onGoToPreviousMonth,
  onResetMonthFromPlan,
  onSelectMonth,
  onUpdateActualBudget,
  onUpdateActualField,
  selectNumberInput,
}: MonthlyActualsSectionProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const spendingPercent = Math.round(
    (actualTotals.spending / Math.max(totals.monthlyBudget, 1)) * 100,
  );
  const outflowPercent = Math.round(
    (actualTotals.outflow / Math.max(actual.income, 1)) * 100,
  );
  const [selectedYear, selectedMonth] = actual.month.split("-").map(Number);
  const [minimumYear, minimumMonth] = minMonth.split("-").map(Number);
  const yearOptions = Array.from({ length: 11 }, (_, index) => minimumYear + index);
  const calendarMonthOptions = monthOptions.map((label, index) => ({
    label,
    value: index + 1,
    isDisabled: selectedYear === minimumYear && index + 1 < minimumMonth,
  }));
  const updateSelectedMonth = (year: number, month: number) => {
    const normalizedMonth =
      year === minimumYear && month < minimumMonth ? minimumMonth : month;

    onSelectMonth(`${year}-${String(normalizedMonth).padStart(2, "0")}`);
    setIsCalendarOpen(false);
  };

  return (
    <article id="actuals" className={`mt-4 scroll-mt-24 ${surface}`}>
      <div className={`${sectionHeader} xl:items-center`}>
        <div>
          <h3 className={sectionTitle}>Monthly Actuals</h3>
          <p className={sectionDescription}>
            Track real income, spending, transfers, debt payments, and
            contributions against the plan.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-[auto_minmax(300px,1fr)_auto] sm:items-center xl:min-w-[560px]">
          <button
            type="button"
            onClick={onGoToPreviousMonth}
            disabled={!canGoToPreviousMonth}
            className={`${secondaryButton} w-full px-3 disabled:cursor-not-allowed disabled:opacity-40`}
            aria-label="Previous month"
          >
            &lt;
          </button>
          <div className={`relative ${nestedSurface} px-3 py-2`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-neutral-100">
                  {formatMonthLabel(actual.month)}
                </p>
                <p className="text-xs text-neutral-500">
                  Current or future month
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCalendarOpen((current) => !current)}
                aria-expanded={isCalendarOpen}
                aria-label="Choose actuals month"
                className={`${secondaryButton} min-h-9 px-2`}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-4"
                  fill="none"
                >
                  <path
                    d="M7 3v3M17 3v3M4.5 9h15M6.5 5h11A2.5 2.5 0 0 1 20 7.5v10A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-10A2.5 2.5 0 0 1 6.5 5Z"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                  />
                </svg>
              </button>
            </div>
            {isCalendarOpen ? (
              <div className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-72 rounded-lg border border-white/10 bg-neutral-950/95 p-3 shadow-2xl backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-neutral-100">
                    Select Month
                  </p>
                  <label className="block">
                    <span className="sr-only">Actuals year</span>
                    <select
                      value={selectedYear}
                      onChange={(event) =>
                        updateSelectedMonth(
                          Number(event.target.value),
                          selectedMonth,
                        )
                      }
                      className={`${inputBase} w-24 px-2 py-1.5 text-xs`}
                    >
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-1">
                  {calendarMonthOptions.map((month) => {
                    const isSelected = month.value === selectedMonth;

                    return (
                      <button
                        key={month.value}
                        type="button"
                        disabled={month.isDisabled}
                        onClick={() =>
                          updateSelectedMonth(selectedYear, month.value)
                        }
                        className={`min-h-9 rounded-md px-2 text-xs font-medium transition ${
                          isSelected
                            ? "bg-emerald-300 text-neutral-950"
                            : "border border-white/10 bg-white/[0.03] text-neutral-300 hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
                        } disabled:cursor-not-allowed disabled:border-white/5 disabled:bg-transparent disabled:text-neutral-700`}
                      >
                        {month.label.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onGoToNextMonth}
            className={`${secondaryButton} w-full px-3`}
            aria-label="Next month"
          >
            &gt;
          </button>
          <div className="flex flex-wrap gap-2 sm:col-span-3 sm:justify-end">
            <button
              type="button"
              onClick={onResetMonthFromPlan}
              className={secondaryButton}
            >
              Match Plan
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className={`${nestedSurface} px-3 py-2`}>
              <p className={metricLabel}>Actual surplus</p>
              <p
                className={`${metricValue} text-2xl ${
                  actualTotals.surplus >= 0
                    ? "text-emerald-300"
                    : "text-rose-300"
                }`}
              >
                {formatCurrency(actualTotals.surplus)}
              </p>
              <p
                className={`mt-1 text-xs ${varianceClass(
                  actualTotals.surplusVariance,
                )}`}
              >
                {formatCurrency(actualTotals.surplusVariance)} vs plan
              </p>
            </div>
            <div className={`${nestedSurface} px-3 py-2`}>
              <p className={metricLabel}>Actual outflow</p>
              <p className={`${metricValue} text-2xl`}>
                {formatCurrency(actualTotals.outflow)}
              </p>
              <p
                className={`mt-1 text-xs ${varianceClass(
                  actualTotals.outflowVariance,
                  false,
                )}`}
              >
                {formatCurrency(actualTotals.outflowVariance)} vs plan
              </p>
            </div>
          </div>

          <div className={`${subtleSurface} p-4`}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-400">Income used</span>
              <span className="font-semibold text-neutral-100">
                {outflowPercent}%
              </span>
            </div>
            <div className={`${progressTrack} mt-3 h-3`}>
              <div
                className={`h-3 rounded-full ${
                  outflowPercent > 100 ? "bg-rose-300" : "bg-emerald-400"
                }`}
                style={{ width: `${Math.min(100, outflowPercent)}%` }}
              />
            </div>
            <p className="mt-3 text-xs text-neutral-500">
              Actual spending is {spendingPercent}% of the planned category
              budget.
            </p>
          </div>

          <div className="grid gap-3">
            <ActualNumberField
              label="Actual income"
              value={actual.income}
              onChange={(value) => onUpdateActualField("income", value)}
              selectNumberInput={selectNumberInput}
              step={100}
            />
            <ActualNumberField
              label="Transfers / set-aside"
              value={actual.transfers}
              onChange={(value) => onUpdateActualField("transfers", value)}
              selectNumberInput={selectNumberInput}
              step={25}
            />
            <ActualNumberField
              label="Debt payments"
              value={actual.debtPayments}
              onChange={(value) => onUpdateActualField("debtPayments", value)}
              selectNumberInput={selectNumberInput}
              step={25}
            />
            <ActualNumberField
              label="Investment contributions"
              value={actual.contributions}
              onChange={(value) => onUpdateActualField("contributions", value)}
              selectNumberInput={selectNumberInput}
              step={25}
            />
          </div>
        </div>

        <div className="grid gap-3">
          {budgets.map((budget) => {
            const actualAmount = actual.budgetActuals[budget.id] ?? 0;
            const variance = actualAmount - budget.amount;
            const percent = Math.round(
              (actualAmount / Math.max(budget.amount, 1)) * 100,
            );

            return (
              <div key={budget.id} className={`${subtleSurface} p-4`}>
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_150px_120px] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        aria-hidden="true"
                        className={`size-3 shrink-0 rounded-full ${budget.color}`}
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-neutral-100">
                          {budget.label}
                        </p>
                        <p className="text-sm text-neutral-500">
                          Planned {formatCurrency(budget.amount)}
                        </p>
                      </div>
                    </div>
                    <div className={`${progressTrack} mt-3 h-2`}>
                      <div
                        className={`h-2 rounded-full ${budget.color}`}
                        style={{ width: `${Math.min(100, percent)}%` }}
                      />
                    </div>
                  </div>
                  <ActualNumberField
                    label="Actual"
                    value={actualAmount}
                    onChange={(value) =>
                      onUpdateActualBudget(budget.id, value)
                    }
                    selectNumberInput={selectNumberInput}
                    step={25}
                  />
                  <div>
                    <p className="text-xs text-neutral-500">Variance</p>
                    <p
                      className={`mt-1 font-semibold ${varianceClass(
                        variance,
                        false,
                      )}`}
                    >
                      {formatCurrency(variance)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}

function ActualNumberField({
  label,
  value,
  onChange,
  selectNumberInput,
  step,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  selectNumberInput: (event: FocusEvent<HTMLInputElement>) => void;
  step: number;
}) {
  return (
    <label className="block">
      <span className="text-xs text-neutral-500">{label}</span>
      <div className={`${inputBase} mt-1 flex items-center px-2`}>
        <span className="text-neutral-500">$</span>
        <input
          type="number"
          onFocus={selectNumberInput}
          min="0"
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="min-w-0 flex-1 bg-transparent px-1 py-2 font-semibold text-neutral-100 outline-none"
        />
      </div>
    </label>
  );
}
