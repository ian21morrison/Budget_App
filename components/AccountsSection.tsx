import { type FocusEvent, type ReactNode } from "react";
import { defaultReturnForAccount } from "@/lib/calculations/returns";
import type {
  Account,
  AccountType,
  ContributionReturns,
  RetirementPlan,
} from "@/types";

type AccountsSectionProps = {
  accounts: Account[];
  contributionReturns: ContributionReturns;
  retirementPlan: RetirementPlan;
  onAddAccount: () => void;
  onResetAccounts: () => void;
  onUpdateAccount: (
    accountId: string,
    field: "name" | "institution" | "balance" | "type" | "accent",
    value: string | number,
  ) => void;
  onUpdateContributionReturn: (accountId: string, value: number) => void;
  onDeleteAccount: (accountId: string) => void;
  renderColorPicker: (
    pickerId: string,
    currentColor: string,
    label: string,
    onSelect: (color: string) => void,
    sizeClass?: string,
  ) => ReactNode;
  selectNumberInput: (event: FocusEvent<HTMLInputElement>) => void;
};

export function AccountsSection({
  accounts,
  contributionReturns,
  retirementPlan,
  onAddAccount,
  onResetAccounts,
  onUpdateAccount,
  onUpdateContributionReturn,
  onDeleteAccount,
  renderColorPicker,
  selectNumberInput,
}: AccountsSectionProps) {
  return (
    <article
      id="accounts"
      className="scroll-mt-24 rounded-lg border border-white/10 bg-white/[0.035]"
    >
      <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold">Accounts</h3>
          <p className="mt-1 text-sm text-neutral-500">
            Current balances used for net worth.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onAddAccount}
            className="w-fit rounded-md bg-emerald-400 px-3 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-emerald-300"
          >
            Add account
          </button>
          <button
            type="button"
            onClick={onResetAccounts}
            className="w-fit rounded-md border border-white/10 px-3 py-2 text-sm text-neutral-300 transition hover:bg-white/5 hover:text-white"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="divide-y divide-white/10">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="grid gap-3 px-4 py-3 md:grid-cols-[minmax(0,1fr)_160px_130px_140px_auto] md:items-center"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                {renderColorPicker(
                  `account-${account.id}`,
                  account.accent,
                  account.name,
                  (color) => onUpdateAccount(account.id, "accent", color),
                  "size-2.5",
                )}
                <div className="grid min-w-0 flex-1 gap-2">
                  <label className="block">
                    <span className="sr-only">Account title</span>
                    <input
                      type="text"
                      value={account.name}
                      onChange={(event) =>
                        onUpdateAccount(account.id, "name", event.target.value)
                      }
                      className="w-full rounded-md border border-transparent bg-transparent px-2 py-1 font-medium text-neutral-100 outline-none transition hover:border-white/10 hover:bg-neutral-950/40 focus:border-emerald-400/60 focus:bg-neutral-950/60"
                    />
                  </label>
                  <label className="block">
                    <span className="sr-only">Account notes</span>
                    <input
                      type="text"
                      value={account.institution}
                      onChange={(event) =>
                        onUpdateAccount(
                          account.id,
                          "institution",
                          event.target.value,
                        )
                      }
                      className="w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-sm text-neutral-500 outline-none transition hover:border-white/10 hover:bg-neutral-950/40 focus:border-emerald-400/60 focus:bg-neutral-950/60 focus:text-neutral-200"
                    />
                  </label>
                </div>
              </div>
            </div>

            <label className="block text-sm">
              <span className="sr-only">{account.name} balance</span>
              <div className="flex items-center rounded-md border border-white/10 bg-neutral-950/60 px-2 focus-within:border-emerald-400/60">
                <span className="text-neutral-500">$</span>
                <input
                  type="number"
                  onFocus={selectNumberInput}
                  min="0"
                  step="100"
                  value={account.balance}
                  onChange={(event) =>
                    onUpdateAccount(
                      account.id,
                      "balance",
                      Number(event.target.value),
                    )
                  }
                  className="min-w-0 flex-1 bg-transparent px-1 py-2 font-semibold text-neutral-100 outline-none"
                />
              </div>
            </label>
            <label className="block text-sm">
              <span className="text-xs text-neutral-500">Expected return</span>
              <div className="flex items-center rounded-md border border-white/10 bg-neutral-950/60 px-2 focus-within:border-emerald-400/60">
                <input
                  type="number"
                  onFocus={selectNumberInput}
                  min="0"
                  step="0.25"
                  value={
                    contributionReturns[account.id] ??
                    defaultReturnForAccount(
                      account,
                      retirementPlan.annualReturn,
                    )
                  }
                  onChange={(event) =>
                    onUpdateContributionReturn(
                      account.id,
                      Number(event.target.value),
                    )
                  }
                  aria-label={`${account.name} expected return`}
                  className="min-w-0 flex-1 bg-transparent px-1 py-2 font-semibold text-neutral-100 outline-none"
                />
                <span className="text-neutral-500">%</span>
              </div>
            </label>
            <label className="block text-sm">
              <span className="sr-only">{account.name} account type</span>
              <select
                value={account.type}
                onChange={(event) =>
                  onUpdateAccount(
                    account.id,
                    "type",
                    event.target.value as AccountType,
                  )
                }
                className="w-full rounded-md border border-white/10 bg-neutral-950/60 px-2 py-2 font-medium text-neutral-100 outline-none transition focus:border-emerald-400/60"
              >
                <option value="cash">Cash</option>
                <option value="invested">Invested</option>
              </select>
            </label>
            <button
              type="button"
              onClick={() => onDeleteAccount(account.id)}
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
