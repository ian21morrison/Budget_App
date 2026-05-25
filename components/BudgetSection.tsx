import { type FocusEvent, type ReactNode } from "react";
import { formatCurrency } from "@/lib/formatting";
import {
  dangerButton,
  inputBase,
  metricLabel,
  metricValue,
  nestedSurface,
  primaryButton,
  progressTrack,
  secondaryButton,
  sectionDescription,
  sectionHeader,
  subtleSurface,
  surface,
} from "@/components/uiStyles";
import type { Budget, BudgetTotals } from "@/types";

type BudgetSectionProps = {
  budgets: Budget[];
  contributionsSection: ReactNode;
  incomeUsedPercent: number;
  isEditingBudget: boolean;
  monthlyIncome: number;
  totals: BudgetTotals;
  onAddBudget: () => void;
  onDeleteBudget: (budgetId: string) => void;
  onResetBudget: () => void;
  onToggleEditingBudget: () => void;
  onUpdateBudget: (
    budgetId: string,
    field: "label" | "detail" | "amount" | "color",
    value: string | number,
  ) => void;
  onUpdateMonthlyIncome: (value: number) => void;
  renderColorPicker: (
    pickerId: string,
    currentColor: string,
    label: string,
    onSelect: (color: string) => void,
    sizeClass?: string,
  ) => ReactNode;
  selectNumberInput: (event: FocusEvent<HTMLInputElement>) => void;
};

export function BudgetSection({
  budgets,
  contributionsSection,
  incomeUsedPercent,
  isEditingBudget,
  monthlyIncome,
  totals,
  onAddBudget,
  onDeleteBudget,
  onResetBudget,
  onToggleEditingBudget,
  onUpdateBudget,
  onUpdateMonthlyIncome,
  renderColorPicker,
  selectNumberInput,
}: BudgetSectionProps) {
  return (
    <article id="budget" className={`scroll-mt-24 ${surface}`}>
      <div className={`${sectionHeader} xl:items-center`}>
        <div>
          <h3 className="text-xl font-semibold tracking-tight text-neutral-50">
            Budget
          </h3>
          <p className={sectionDescription}>
            Monthly spending plan, contributions, debt payments, and surplus.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <div className={`${nestedSurface} px-3 py-2`}>
            <p className={metricLabel}>Income</p>
            <p className={`${metricValue} text-lg`}>
              {formatCurrency(monthlyIncome)}
            </p>
          </div>
          <div className={`${nestedSurface} px-3 py-2`}>
            <p className={metricLabel}>Budgeted</p>
            <p className={`${metricValue} text-lg`}>
              {formatCurrency(totals.monthlyBudget)}
            </p>
          </div>
          <div className={`${nestedSurface} px-3 py-2`}>
            <p className={metricLabel}>Contributions</p>
            <p className={`${metricValue} text-lg`}>
              {formatCurrency(totals.monthlyInvestment)}
            </p>
          </div>
          <div className={`${nestedSurface} px-3 py-2`}>
            <p className={metricLabel}>Surplus</p>
            <p
              className={`${metricValue} text-lg ${
                totals.monthlySurplus >= 0
                  ? "text-emerald-300"
                  : "text-rose-300"
              }`}
            >
              {formatCurrency(totals.monthlySurplus)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-4">
          <label className="block text-sm">
            <span className="mb-2 flex items-center justify-between">
              <span className="text-neutral-300">Monthly income</span>
              <span className="font-medium">
                {formatCurrency(monthlyIncome)}
              </span>
            </span>
            <input
              type="number"
              onFocus={selectNumberInput}
              min="0"
              step="100"
              value={monthlyIncome}
              onChange={(event) =>
                onUpdateMonthlyIncome(Number(event.target.value))
              }
              className={`${inputBase} w-full px-3 py-3 font-semibold`}
            />
          </label>

          <div className={`${subtleSurface} p-4`}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-400">Income used</span>
              <span className="font-semibold text-neutral-100">
                {incomeUsedPercent}%
              </span>
            </div>
            <div className={`${progressTrack} mt-3 h-3`}>
              <div
                className={`h-3 rounded-full ${
                  incomeUsedPercent > 100 ? "bg-rose-300" : "bg-emerald-400"
                }`}
                style={{ width: `${Math.min(100, incomeUsedPercent)}%` }}
              />
            </div>
            <p className="mt-3 text-xs text-neutral-500">
              Includes budget, debt payments, and monthly contributions.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onToggleEditingBudget}
              className={primaryButton}
            >
              {isEditingBudget ? "Done editing" : "Edit budget"}
            </button>
            {isEditingBudget ? (
              <>
                <button
                  type="button"
                  onClick={onAddBudget}
                  className={secondaryButton}
                >
                  Add item
                </button>
                <button
                  type="button"
                  onClick={onResetBudget}
                  className={secondaryButton}
                >
                  Reset
                </button>
              </>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {budgets.map((budget) => {
            const percent = Math.round(
              (budget.amount / Math.max(totals.monthlyBudget, 1)) * 100,
            );

            return (
              <div key={budget.id} className={`${subtleSurface} p-4`}>
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div className="flex min-w-0 flex-1 gap-3">
                    <div className="pt-1">
                      {renderColorPicker(
                        `budget-${budget.id}`,
                        budget.color,
                        budget.label,
                        (color) => onUpdateBudget(budget.id, "color", color),
                        "size-3",
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      {isEditingBudget ? (
                        <div className="grid gap-2">
                          <label className="block">
                            <span className="sr-only">Budget title</span>
                            <input
                              type="text"
                              value={budget.label}
                              onChange={(event) =>
                                onUpdateBudget(
                                  budget.id,
                                  "label",
                                  event.target.value,
                                )
                              }
                              className={`${inputBase} w-full px-2 py-2 text-sm font-medium`}
                            />
                          </label>
                          <label className="block">
                            <span className="sr-only">Budget notes</span>
                            <input
                              type="text"
                              value={budget.detail}
                              onChange={(event) =>
                                onUpdateBudget(
                                  budget.id,
                                  "detail",
                                  event.target.value,
                                )
                              }
                              className={`${inputBase} w-full px-2 py-2 text-xs text-neutral-300`}
                            />
                          </label>
                        </div>
                      ) : (
                        <>
                          <p className="font-medium text-neutral-100">
                            {budget.label}
                          </p>
                          <p className="mt-1 text-sm text-neutral-500">
                            {budget.detail}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-lg font-semibold text-neutral-100">
                      {formatCurrency(budget.amount)}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {percent}% of budget
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className={`${progressTrack} h-3`}>
                    <div
                      className={`h-3 rounded-full ${budget.color}`}
                      style={{ width: `${Math.min(100, percent)}%` }}
                    />
                  </div>

                  {isEditingBudget ? (
                    <div className="grid gap-3 sm:grid-cols-[1fr_150px_auto] sm:items-center">
                      <input
                        type="range"
                        min="0"
                        max={budget.id === "housing" ? 4000 : 1600}
                        step="25"
                        value={budget.amount}
                        onChange={(event) =>
                          onUpdateBudget(
                            budget.id,
                            "amount",
                            Number(event.target.value),
                          )
                        }
                        className="w-full accent-emerald-400"
                      />
                      <label className={`${inputBase} flex items-center px-2`}>
                        <span className="text-sm text-neutral-500">$</span>
                        <input
                          type="number"
                          onFocus={selectNumberInput}
                          min="0"
                          step="25"
                          value={budget.amount}
                          onChange={(event) =>
                            onUpdateBudget(
                              budget.id,
                              "amount",
                              Number(event.target.value),
                            )
                          }
                          aria-label={`${budget.label} budget amount`}
                          className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm font-semibold text-neutral-100 outline-none"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => onDeleteBudget(budget.id)}
                        className={dangerButton}
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {contributionsSection}
      </div>
    </article>
  );
}
