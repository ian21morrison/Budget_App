import { type FocusEvent, type ReactNode } from "react";
import { formatCurrency } from "@/lib/formatting";
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
    <article
      id="budget"
      className="scroll-mt-24 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.035]"
    >
      <div className="flex flex-col gap-4 border-b border-white/10 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h3 className="text-xl font-semibold">Budget</h3>
          <p className="mt-1 text-sm text-neutral-500">
            Monthly spending plan, contributions, debt payments, and surplus.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2">
            <p className="text-xs text-neutral-500">Income</p>
            <p className="mt-1 text-lg font-semibold">
              {formatCurrency(monthlyIncome)}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2">
            <p className="text-xs text-neutral-500">Budgeted</p>
            <p className="mt-1 text-lg font-semibold">
              {formatCurrency(totals.monthlyBudget)}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2">
            <p className="text-xs text-neutral-500">Contributions</p>
            <p className="mt-1 text-lg font-semibold">
              {formatCurrency(totals.monthlyInvestment)}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2">
            <p className="text-xs text-neutral-500">Surplus</p>
            <p
              className={`mt-1 text-lg font-semibold ${
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
              className="w-full rounded-md border border-white/10 bg-neutral-950/60 px-3 py-3 font-semibold text-neutral-100 outline-none focus:border-emerald-400/60"
            />
          </label>

          <div className="rounded-lg border border-white/10 bg-neutral-950/45 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-400">Income used</span>
              <span className="font-semibold text-neutral-100">
                {incomeUsedPercent}%
              </span>
            </div>
            <div className="mt-3 h-3 rounded-full bg-white/10">
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
              className="rounded-md bg-emerald-400 px-3 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-emerald-300"
            >
              {isEditingBudget ? "Done editing" : "Edit budget"}
            </button>
            {isEditingBudget ? (
              <>
                <button
                  type="button"
                  onClick={onAddBudget}
                  className="rounded-md border border-emerald-300/30 px-3 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-300/10"
                >
                  Add item
                </button>
                <button
                  type="button"
                  onClick={onResetBudget}
                  className="rounded-md border border-white/10 px-3 py-2 text-sm text-neutral-300 transition hover:bg-white/5 hover:text-white"
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
              <div
                key={budget.id}
                className="rounded-lg border border-white/10 bg-neutral-950/45 p-4"
              >
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
                              className="w-full rounded-md border border-white/10 bg-neutral-950/60 px-2 py-2 text-sm font-medium text-neutral-100 outline-none focus:border-emerald-400/60"
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
                              className="w-full rounded-md border border-white/10 bg-neutral-950/60 px-2 py-2 text-xs text-neutral-300 outline-none focus:border-emerald-400/60"
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
                  <div className="h-3 rounded-full bg-white/10">
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
                      <label className="flex items-center rounded-md border border-white/10 bg-neutral-950/60 px-2 focus-within:border-emerald-400/60">
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
                        className="w-fit rounded-md border border-rose-300/20 px-3 py-2 text-sm text-rose-200 transition hover:bg-rose-300/10"
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
