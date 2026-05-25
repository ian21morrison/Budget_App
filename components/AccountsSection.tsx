import { type FocusEvent, type ReactNode } from "react";
import { defaultReturnForAccount } from "@/lib/calculations/returns";
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
    <article id="accounts" className={`scroll-mt-24 ${surface}`}>
      <div className={sectionHeader}>
        <div>
          <h3 className={sectionTitle}>Accounts</h3>
          <p className={sectionDescription}>
            Current balances used for net worth.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onAddAccount}
            className={primaryButton}
          >
            Add account
          </button>
          <button
            type="button"
            onClick={onResetAccounts}
            className={secondaryButton}
          >
            Reset
          </button>
        </div>
      </div>

      <div className={divider}>
        {accounts.map((account) => (
          <div
            key={account.id}
            className={`grid gap-3 px-4 py-3 md:grid-cols-[minmax(0,1fr)_160px_130px_140px_auto] md:items-center ${rowHover}`}
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
                      className={`${transparentInput} w-full px-2 py-1 font-medium text-neutral-100`}
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
                      className={`${transparentInput} w-full px-2 py-1 text-sm text-neutral-500 focus:text-neutral-200`}
                    />
                  </label>
                </div>
              </div>
            </div>

            <label className="block text-sm">
              <span className="sr-only">{account.name} balance</span>
              <div className={`${inputBase} flex items-center px-2`}>
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
              <div className={`${inputBase} flex items-center px-2`}>
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
                className={`${inputBase} w-full px-2 py-2 font-medium`}
              >
                <option value="cash">Cash</option>
                <option value="invested">Invested</option>
              </select>
            </label>
            <button
              type="button"
              onClick={() => onDeleteAccount(account.id)}
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
