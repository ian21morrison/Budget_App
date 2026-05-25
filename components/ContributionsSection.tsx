import { type FocusEvent, type ReactNode } from "react";
import { defaultReturnForAccount } from "@/lib/calculations/returns";
import { formatCurrency, formatPercent } from "@/lib/formatting";
import type {
  Account,
  BudgetTotals,
  ContributionReturns,
  InvestmentContributions,
  RetirementPlan,
} from "@/types";

type ContributionsSectionProps = {
  availableContributionAccounts: Account[];
  contributionAccounts: Account[];
  contributionReturns: ContributionReturns;
  investmentContributions: InvestmentContributions;
  isAccountPickerOpen: boolean;
  monthlyContributionWeightedReturn: number;
  retirementPlan: RetirementPlan;
  selectedContributionAccountId: string;
  totals: Pick<BudgetTotals, "monthlyInvestment">;
  onAddExistingContributionAccount: () => void;
  onAddInvestmentAccount: () => void;
  onCancelAccountPicker: () => void;
  onRemoveContributionAccount: (accountId: string) => void;
  onResetInvestmentContributions: () => void;
  onSelectContributionAccount: (accountId: string) => void;
  onShowAccountPicker: () => void;
  onUpdateAccount: (
    accountId: string,
    field: "name" | "institution" | "balance" | "type" | "accent",
    value: string | number,
  ) => void;
  onUpdateInvestmentContribution: (accountId: string, value: number) => void;
  renderColorPicker: (
    pickerId: string,
    currentColor: string,
    label: string,
    onSelect: (color: string) => void,
    sizeClass?: string,
  ) => ReactNode;
  selectNumberInput: (event: FocusEvent<HTMLInputElement>) => void;
};

export function ContributionsSection({
  availableContributionAccounts,
  contributionAccounts,
  contributionReturns,
  investmentContributions,
  isAccountPickerOpen,
  monthlyContributionWeightedReturn,
  retirementPlan,
  selectedContributionAccountId,
  totals,
  onAddExistingContributionAccount,
  onAddInvestmentAccount,
  onCancelAccountPicker,
  onRemoveContributionAccount,
  onResetInvestmentContributions,
  onSelectContributionAccount,
  onShowAccountPicker,
  onUpdateAccount,
  onUpdateInvestmentContribution,
  renderColorPicker,
  selectNumberInput,
}: ContributionsSectionProps) {
  return (
    <div className="xl:col-span-2 rounded-lg border border-white/10 bg-neutral-950/45 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="text-base font-semibold">Monthly contributions</h4>
          <p className="mt-1 text-sm text-neutral-500">
            Contributions that reduce monthly surplus and feed the retirement
            projection.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {availableContributionAccounts.length > 0 && !isAccountPickerOpen ? (
            <button
              type="button"
              onClick={onShowAccountPicker}
              className="w-fit rounded-md border border-emerald-300/30 px-3 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-300/10"
            >
              Add existing
            </button>
          ) : null}
          <button
            type="button"
            onClick={onAddInvestmentAccount}
            className="w-fit rounded-md border border-emerald-300/30 px-3 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-300/10"
          >
            New account
          </button>
          <button
            type="button"
            onClick={onResetInvestmentContributions}
            className="w-fit rounded-md border border-white/10 px-3 py-2 text-sm text-neutral-300 transition hover:bg-white/5 hover:text-white"
          >
            Reset
          </button>
        </div>
      </div>

      {isAccountPickerOpen ? (
        <div className="mt-4 flex flex-col gap-2 rounded-lg border border-white/10 bg-neutral-950/60 p-3 sm:flex-row sm:items-center">
          <label className="sr-only" htmlFor="contribution-account">
            Existing account
          </label>
          <select
            id="contribution-account"
            value={selectedContributionAccountId}
            onChange={(event) => onSelectContributionAccount(event.target.value)}
            className="min-w-0 flex-1 rounded-md border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-emerald-400/60"
          >
            <option value="">Select an account</option>
            {availableContributionAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onAddExistingContributionAccount}
            disabled={!selectedContributionAccountId}
            className="w-fit rounded-md bg-emerald-400 px-3 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Add
          </button>
          <button
            type="button"
            onClick={onCancelAccountPicker}
            className="w-fit rounded-md border border-white/10 px-3 py-2 text-sm text-neutral-300 transition hover:bg-white/5 hover:text-white"
          >
            Cancel
          </button>
        </div>
      ) : null}

      <div className="mt-4 divide-y divide-white/10">
        {contributionAccounts.length > 0 ? (
          <>
            {contributionAccounts.map((account) => (
              <div
                key={account.id}
                className="grid gap-3 py-3 md:grid-cols-[minmax(0,1fr)_170px_110px_110px] md:items-center"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {renderColorPicker(
                    `investment-${account.id}`,
                    account.accent,
                    account.name,
                    (color) => onUpdateAccount(account.id, "accent", color),
                    "size-2.5",
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium text-neutral-100">
                      {account.name}
                    </p>
                    <p className="truncate text-sm text-neutral-500">
                      {account.institution} / {account.type}
                    </p>
                  </div>
                </div>
                <label className="block">
                  <span className="text-xs text-neutral-500">
                    Monthly contribution
                  </span>
                  <div className="mt-1 flex items-center rounded-md border border-white/10 bg-neutral-950/60 px-2 focus-within:border-emerald-400/60">
                    <span className="text-neutral-500">$</span>
                    <input
                      type="number"
                      onFocus={selectNumberInput}
                      min="0"
                      step="25"
                      value={investmentContributions[account.id] ?? 0}
                      onChange={(event) =>
                        onUpdateInvestmentContribution(
                          account.id,
                          Number(event.target.value),
                        )
                      }
                      aria-label={`${account.name} monthly contribution`}
                      className="min-w-0 flex-1 bg-transparent px-1 py-2 font-semibold text-neutral-100 outline-none"
                    />
                  </div>
                </label>
                <div className="rounded-md border border-white/10 bg-neutral-950/45 px-2 py-1.5">
                  <p className="text-xs text-neutral-500">Account return</p>
                  <p className="mt-1 font-semibold text-neutral-100">
                    {formatPercent(
                      contributionReturns[account.id] ??
                        defaultReturnForAccount(
                          account,
                          retirementPlan.annualReturn,
                        ),
                    )}
                    %
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveContributionAccount(account.id)}
                  className="w-fit rounded-md border border-rose-300/20 px-3 py-2 text-sm text-rose-200 transition hover:bg-rose-300/10 md:justify-self-end"
                >
                  Remove
                </button>
              </div>
            ))}
            <div className="grid gap-3 py-3 md:grid-cols-[minmax(0,1fr)_170px_110px_110px] md:items-center">
              <div className="min-w-0">
                <p className="font-semibold text-neutral-100">Total</p>
                <p className="text-sm text-neutral-500">
                  Monthly contribution summary
                </p>
              </div>
              <div className="rounded-md border border-emerald-300/20 bg-emerald-300/10 px-2 py-1.5">
                <p className="text-xs text-emerald-200">Monthly contribution</p>
                <p className="mt-1 font-semibold text-neutral-100">
                  {formatCurrency(totals.monthlyInvestment)}
                </p>
              </div>
              <div className="rounded-md border border-emerald-300/20 bg-emerald-300/10 px-2 py-1.5">
                <p className="text-xs text-emerald-200">Weighted return</p>
                <p className="mt-1 font-semibold text-neutral-100">
                  {formatPercent(monthlyContributionWeightedReturn)}%
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="py-4 text-sm text-neutral-500">
            Add an existing account or create a new account to start monthly
            contributions.
          </div>
        )}
      </div>
    </div>
  );
}
