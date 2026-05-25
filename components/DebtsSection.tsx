import { type FocusEvent, type ReactNode } from "react";
import type { Debt } from "@/types";

type DebtsSectionProps = {
  debts: Debt[];
  onAddDebt: () => void;
  onResetDebts: () => void;
  onUpdateDebt: (
    debtId: string,
    field: "name" | "lender" | "balance" | "payment" | "rate" | "accent",
    value: string | number,
  ) => void;
  onDeleteDebt: (debtId: string) => void;
  renderColorPicker: (
    pickerId: string,
    currentColor: string,
    label: string,
    onSelect: (color: string) => void,
    sizeClass?: string,
  ) => ReactNode;
  selectNumberInput: (event: FocusEvent<HTMLInputElement>) => void;
};

export function DebtsSection({
  debts,
  onAddDebt,
  onResetDebts,
  onUpdateDebt,
  onDeleteDebt,
  renderColorPicker,
  selectNumberInput,
}: DebtsSectionProps) {
  return (
    <article
      id="debt"
      className="scroll-mt-24 rounded-lg border border-white/10 bg-white/[0.035]"
    >
      <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold">Debt / Student loans</h3>
          <p className="mt-1 text-sm text-neutral-500">
            Liabilities subtract from net worth and payments reduce surplus.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onAddDebt}
            className="w-fit rounded-md bg-emerald-400 px-3 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-emerald-300"
          >
            Add debt
          </button>
          <button
            type="button"
            onClick={onResetDebts}
            className="w-fit rounded-md border border-white/10 px-3 py-2 text-sm text-neutral-300 transition hover:bg-white/5 hover:text-white"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="divide-y divide-white/10">
        {debts.map((debt) => (
          <div
            key={debt.id}
            className="grid gap-3 px-4 py-3 lg:grid-cols-[minmax(0,1fr)_150px_150px_110px_auto] lg:items-center"
          >
            <div className="flex min-w-0 items-center gap-3">
              {renderColorPicker(
                `debt-${debt.id}`,
                debt.accent,
                debt.name,
                (color) => onUpdateDebt(debt.id, "accent", color),
                "size-2.5",
              )}
              <div className="grid min-w-0 flex-1 gap-2">
                <label className="block">
                  <span className="sr-only">Debt title</span>
                  <input
                    type="text"
                    value={debt.name}
                    onChange={(event) =>
                      onUpdateDebt(debt.id, "name", event.target.value)
                    }
                    className="w-full rounded-md border border-transparent bg-transparent px-2 py-1 font-medium text-neutral-100 outline-none transition hover:border-white/10 hover:bg-neutral-950/40 focus:border-rose-300/60 focus:bg-neutral-950/60"
                  />
                </label>
                <label className="block">
                  <span className="sr-only">Debt notes</span>
                  <input
                    type="text"
                    value={debt.lender}
                    onChange={(event) =>
                      onUpdateDebt(debt.id, "lender", event.target.value)
                    }
                    className="w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-sm text-neutral-500 outline-none transition hover:border-white/10 hover:bg-neutral-950/40 focus:border-rose-300/60 focus:bg-neutral-950/60 focus:text-neutral-200"
                  />
                </label>
              </div>
            </div>

            <label className="block text-sm">
              <span className="text-xs text-neutral-500">Balance</span>
              <div className="mt-1 flex items-center rounded-md border border-white/10 bg-neutral-950/60 px-2 focus-within:border-rose-300/60">
                <span className="text-neutral-500">$</span>
                <input
                  type="number"
                  onFocus={selectNumberInput}
                  min="0"
                  step="100"
                  value={debt.balance}
                  onChange={(event) =>
                    onUpdateDebt(debt.id, "balance", Number(event.target.value))
                  }
                  className="min-w-0 flex-1 bg-transparent px-1 py-2 font-semibold text-neutral-100 outline-none"
                />
              </div>
            </label>

            <label className="block text-sm">
              <span className="text-xs text-neutral-500">Payment</span>
              <div className="mt-1 flex items-center rounded-md border border-white/10 bg-neutral-950/60 px-2 focus-within:border-rose-300/60">
                <span className="text-neutral-500">$</span>
                <input
                  type="number"
                  onFocus={selectNumberInput}
                  min="0"
                  step="25"
                  value={debt.payment}
                  onChange={(event) =>
                    onUpdateDebt(debt.id, "payment", Number(event.target.value))
                  }
                  className="min-w-0 flex-1 bg-transparent px-1 py-2 font-semibold text-neutral-100 outline-none"
                />
              </div>
            </label>

            <label className="block text-sm">
              <span className="text-xs text-neutral-500">APR</span>
              <div className="mt-1 flex items-center rounded-md border border-white/10 bg-neutral-950/60 px-2 focus-within:border-rose-300/60">
                <input
                  type="number"
                  onFocus={selectNumberInput}
                  min="0"
                  step="0.1"
                  value={debt.rate}
                  onChange={(event) =>
                    onUpdateDebt(debt.id, "rate", Number(event.target.value))
                  }
                  className="min-w-0 flex-1 bg-transparent px-1 py-2 font-semibold text-neutral-100 outline-none"
                />
                <span className="text-neutral-500">%</span>
              </div>
            </label>
            <button
              type="button"
              onClick={() => onDeleteDebt(debt.id)}
              className="w-fit rounded-md border border-rose-300/20 px-3 py-2 text-sm text-rose-200 transition hover:bg-rose-300/10"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </article>
  );
}
