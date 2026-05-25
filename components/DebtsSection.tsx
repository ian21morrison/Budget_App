import { type FocusEvent, type ReactNode } from "react";
import {
  dangerButton,
  divider,
  inputBase,
  primaryButton,
  rowHover,
  secondaryButton,
  sectionDescription,
  sectionHeader,
  sectionTitle,
  surface,
  transparentInput,
} from "@/components/uiStyles";
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
    <article id="debt" className={`scroll-mt-24 ${surface}`}>
      <div className={sectionHeader}>
        <div>
          <h3 className={sectionTitle}>Debt / Student loans</h3>
          <p className={sectionDescription}>
            Liabilities subtract from net worth and payments reduce surplus.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onAddDebt}
            className={primaryButton}
          >
            Add debt
          </button>
          <button
            type="button"
            onClick={onResetDebts}
            className={secondaryButton}
          >
            Reset
          </button>
        </div>
      </div>

      <div className={divider}>
        {debts.map((debt) => (
          <div
            key={debt.id}
            className={`grid gap-3 px-4 py-3 lg:grid-cols-[minmax(0,1fr)_150px_150px_110px_auto] lg:items-center ${rowHover}`}
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
                    className={`${transparentInput} w-full px-2 py-1 font-medium text-neutral-100 focus:border-rose-300/60`}
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
                    className={`${transparentInput} w-full px-2 py-1 text-sm text-neutral-500 focus:border-rose-300/60 focus:text-neutral-200`}
                  />
                </label>
              </div>
            </div>

            <label className="block text-sm">
              <span className="text-xs text-neutral-500">Balance</span>
              <div className={`${inputBase} mt-1 flex items-center px-2 focus-within:border-rose-300/60`}>
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
              <div className={`${inputBase} mt-1 flex items-center px-2 focus-within:border-rose-300/60`}>
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
              <div className={`${inputBase} mt-1 flex items-center px-2 focus-within:border-rose-300/60`}>
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
              className={dangerButton}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </article>
  );
}
