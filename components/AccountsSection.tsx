import { type FocusEvent, type ReactNode } from "react";
import { defaultReturnForAccount } from "@/lib/calculations/returns";
import { formatCurrency } from "@/lib/formatting";
import {
  dangerButton,
  divider,
  inputBase,
  itemTitleInput,
  metricLabel,
  metricValue,
  nestedSurface,
  primaryButton,
  progressTrack,
  rowHover,
  secondaryButton,
  sectionDescription,
  sectionHeader,
  sectionTitle,
  subtleSurface,
  surface,
  transparentInput,
} from "@/components/uiStyles";
import type {
  Account,
  AccountAssetAllocation,
  AccountPurpose,
  AccountTaxTreatment,
  AccountType,
  ContributionReturns,
  RetirementPlan,
} from "@/types";

type AccountUpdateField =
  | "name"
  | "institution"
  | "balance"
  | "type"
  | "taxTreatment"
  | "purpose"
  | "emergencyFundTarget"
  | "annualContributionLimit"
  | "yearToDateContribution"
  | "projectedAnnualIncomeRate"
  | "notes"
  | "accent";

type AccountsSectionProps = {
  accounts: Account[];
  contributionReturns: ContributionReturns;
  retirementPlan: RetirementPlan;
  onAddAccount: () => void;
  onResetAccounts: () => void;
  onUpdateAccount: (
    accountId: string,
    field: AccountUpdateField,
    value: string | number | AccountType | AccountTaxTreatment | AccountPurpose,
  ) => void;
  onUpdateAccountAllocation: (
    accountId: string,
    field: keyof AccountAssetAllocation,
    value: number,
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

const taxTreatmentOptions: Array<{
  label: string;
  value: AccountTaxTreatment;
}> = [
  { label: "Taxable", value: "taxable" },
  { label: "Traditional retirement", value: "traditionalRetirement" },
  { label: "Roth retirement", value: "rothRetirement" },
  { label: "HSA", value: "hsa" },
  { label: "Education", value: "education" },
  { label: "Other", value: "other" },
];

const purposeOptions: Array<{
  label: string;
  value: AccountPurpose;
}> = [
  { label: "Operating cash", value: "operating" },
  { label: "Emergency fund", value: "emergency" },
  { label: "Retirement", value: "retirement" },
  { label: "Taxable investing", value: "taxableInvesting" },
  { label: "Short-term savings", value: "shortTermSavings" },
  { label: "Other", value: "other" },
];

const allocationFields: Array<{
  label: string;
  value: keyof AccountAssetAllocation;
}> = [
  { label: "Stocks", value: "stocks" },
  { label: "Bonds", value: "bonds" },
  { label: "Cash", value: "cash" },
  { label: "Alt", value: "alternatives" },
];

const retirementTaxTreatments: AccountTaxTreatment[] = [
  "traditionalRetirement",
  "rothRetirement",
  "hsa",
];

const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

const getAllocationTotal = (allocation: AccountAssetAllocation) =>
  allocation.stocks + allocation.bonds + allocation.cash + allocation.alternatives;

export function AccountsSection({
  accounts,
  contributionReturns,
  retirementPlan,
  onAddAccount,
  onResetAccounts,
  onUpdateAccount,
  onUpdateAccountAllocation,
  onUpdateContributionReturn,
  onDeleteAccount,
  renderColorPicker,
  selectNumberInput,
}: AccountsSectionProps) {
  const emergencyAccounts = accounts.filter(
    (account) => account.purpose === "emergency" || account.emergencyFundTarget > 0,
  );
  const emergencyBalance = emergencyAccounts.reduce(
    (total, account) => total + account.balance,
    0,
  );
  const emergencyTarget = emergencyAccounts.reduce(
    (total, account) => total + account.emergencyFundTarget,
    0,
  );
  const emergencyProgress =
    emergencyTarget > 0
      ? Math.min(100, Math.round((emergencyBalance / emergencyTarget) * 100))
      : 0;
  const taxableBalance = accounts
    .filter((account) => account.taxTreatment === "taxable")
    .reduce((total, account) => total + account.balance, 0);
  const retirementBalance = accounts
    .filter((account) => retirementTaxTreatments.includes(account.taxTreatment))
    .reduce((total, account) => total + account.balance, 0);
  const contributionLimitTotal = accounts.reduce(
    (total, account) => total + account.annualContributionLimit,
    0,
  );
  const contributionYtdTotal = accounts.reduce(
    (total, account) => total + account.yearToDateContribution,
    0,
  );
  const contributionLimitProgress =
    contributionLimitTotal > 0
      ? Math.min(
          100,
          Math.round((contributionYtdTotal / contributionLimitTotal) * 100),
        )
      : 0;
  const projectedAnnualIncome = accounts.reduce(
    (total, account) =>
      total + account.balance * (account.projectedAnnualIncomeRate / 100),
    0,
  );
  const allocationBase = Math.max(
    1,
    accounts.reduce((total, account) => total + account.balance, 0),
  );
  const portfolioAllocation = allocationFields.map((field) => ({
    ...field,
    share:
      accounts.reduce(
        (total, account) =>
          total + account.balance * (account.allocation[field.value] / 100),
        0,
      ) / allocationBase,
  }));

  return (
    <article id="accounts" className={`scroll-mt-24 ${surface}`}>
      <div className={sectionHeader}>
        <div>
          <h3 className={sectionTitle}>Accounts</h3>
          <p className={sectionDescription}>
            Account balances, tax treatment, allocation, contribution limits,
            emergency targets, notes, and projected income.
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

      <div className="grid gap-3 border-b border-white/10 p-4 md:grid-cols-2 xl:grid-cols-4">
        <div className={`${nestedSurface} p-4`}>
          <p className={metricLabel}>Emergency fund</p>
          <p className={`${metricValue} text-2xl`}>
            {formatCurrency(emergencyBalance)}
          </p>
          <div className={`${progressTrack} mt-3 h-2 overflow-hidden`}>
            <div
              className="h-full rounded-full bg-emerald-300"
              style={{ width: `${emergencyProgress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            {emergencyProgress}% of {formatCurrency(emergencyTarget)} target
          </p>
        </div>

        <div className={`${nestedSurface} p-4`}>
          <p className={metricLabel}>Tax location</p>
          <p className={`${metricValue} text-2xl`}>
            {formatCurrency(retirementBalance)}
          </p>
          <p className="mt-2 text-xs text-neutral-500">
            Retirement; {formatCurrency(taxableBalance)} taxable
          </p>
        </div>

        <div className={`${nestedSurface} p-4`}>
          <p className={metricLabel}>Contribution limits</p>
          <p className={`${metricValue} text-2xl`}>
            {formatCurrency(contributionYtdTotal)}
          </p>
          <div className={`${progressTrack} mt-3 h-2 overflow-hidden`}>
            <div
              className="h-full rounded-full bg-sky-300"
              style={{ width: `${contributionLimitProgress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            {contributionLimitProgress}% of{" "}
            {formatCurrency(contributionLimitTotal)} annual limit
          </p>
        </div>

        <div className={`${nestedSurface} p-4`}>
          <p className={metricLabel}>Projected income</p>
          <p className={`${metricValue} text-2xl text-emerald-300`}>
            {formatCurrency(projectedAnnualIncome)}
          </p>
          <p className="mt-2 text-xs text-neutral-500">
            Estimated annual interest and dividends
          </p>
        </div>
      </div>

      <div className="grid gap-2 border-b border-white/10 p-4 md:grid-cols-4">
        {portfolioAllocation.map((item) => (
          <div key={item.value} className={`${subtleSurface} px-3 py-2`}>
            <div className="flex items-center justify-between gap-3">
              <p className={metricLabel}>{item.label}</p>
              <p className="text-sm font-semibold text-neutral-100">
                {Math.round(item.share * 100)}%
              </p>
            </div>
            <div className={`${progressTrack} mt-2 h-1.5 overflow-hidden`}>
              <div
                className="h-full rounded-full bg-violet-300"
                style={{ width: `${Math.min(100, item.share * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className={divider}>
        {accounts.map((account) => {
          const allocationTotal = getAllocationTotal(account.allocation);
          const projectedIncome =
            account.balance * (account.projectedAnnualIncomeRate / 100);
          const limitProgress =
            account.annualContributionLimit > 0
              ? Math.min(
                  100,
                  Math.round(
                    (account.yearToDateContribution /
                      account.annualContributionLimit) *
                      100,
                  ),
                )
              : 0;

          return (
            <div
              key={account.id}
              className={`grid gap-4 px-4 py-4 ${rowHover}`}
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  {renderColorPicker(
                    `account-${account.id}`,
                    account.accent,
                    account.name,
                    (color) => onUpdateAccount(account.id, "accent", color),
                    "size-2.5",
                  )}
                  <div className="grid min-w-0 flex-1 gap-1">
                    <label className="block">
                      <span className="sr-only">Account title</span>
                      <input
                        type="text"
                        value={account.name}
                        onChange={(event) =>
                          onUpdateAccount(account.id, "name", event.target.value)
                        }
                        className={`${itemTitleInput} w-full px-0 py-0.5 text-lg font-semibold leading-6`}
                      />
                    </label>
                    <label className="block">
                      <span className="sr-only">Institution or account role</span>
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
                <button
                  type="button"
                  onClick={() => onDeleteAccount(account.id)}
                  className={`${dangerButton} shrink-0`}
                >
                  Delete
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <label className="block text-sm">
                  <span className="text-xs text-neutral-500">Balance</span>
                  <div className={`${inputBase} mt-1 flex items-center px-2`}>
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
                      aria-label={`${account.name} balance`}
                      className="min-w-0 flex-1 bg-transparent px-1 py-2 font-semibold text-neutral-100 outline-none"
                    />
                  </div>
                </label>

                <label className="block text-sm">
                  <span className="text-xs text-neutral-500">Type</span>
                  <select
                    value={account.type}
                    onChange={(event) =>
                      onUpdateAccount(
                        account.id,
                        "type",
                        event.target.value as AccountType,
                      )
                    }
                    aria-label={`${account.name} account type`}
                    className={`${inputBase} mt-1 w-full px-2 py-2 font-medium`}
                  >
                    <option value="cash">Cash</option>
                    <option value="invested">Invested</option>
                  </select>
                </label>

                <label className="block text-sm">
                  <span className="text-xs text-neutral-500">Tax treatment</span>
                  <select
                    value={account.taxTreatment}
                    onChange={(event) =>
                      onUpdateAccount(
                        account.id,
                        "taxTreatment",
                        event.target.value as AccountTaxTreatment,
                      )
                    }
                    aria-label={`${account.name} tax treatment`}
                    className={`${inputBase} mt-1 w-full px-2 py-2 font-medium`}
                  >
                    {taxTreatmentOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm">
                  <span className="text-xs text-neutral-500">Purpose</span>
                  <select
                    value={account.purpose}
                    onChange={(event) =>
                      onUpdateAccount(
                        account.id,
                        "purpose",
                        event.target.value as AccountPurpose,
                      )
                    }
                    aria-label={`${account.name} purpose`}
                    className={`${inputBase} mt-1 w-full px-2 py-2 font-medium`}
                  >
                    {purposeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <label className="block text-sm">
                  <span className="text-xs text-neutral-500">Expected return</span>
                  <div className={`${inputBase} mt-1 flex items-center px-2`}>
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
                  <span className="text-xs text-neutral-500">Income yield</span>
                  <div className={`${inputBase} mt-1 flex items-center px-2`}>
                    <input
                      type="number"
                      onFocus={selectNumberInput}
                      min="0"
                      step="0.25"
                      value={account.projectedAnnualIncomeRate}
                      onChange={(event) =>
                        onUpdateAccount(
                          account.id,
                          "projectedAnnualIncomeRate",
                          Number(event.target.value),
                        )
                      }
                      aria-label={`${account.name} projected income yield`}
                      className="min-w-0 flex-1 bg-transparent px-1 py-2 font-semibold text-neutral-100 outline-none"
                    />
                    <span className="text-neutral-500">%</span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">
                    {formatCurrency(projectedIncome)} projected annually
                  </p>
                </label>

                <label className="block text-sm">
                  <span className="text-xs text-neutral-500">
                    Emergency target
                  </span>
                  <div className={`${inputBase} mt-1 flex items-center px-2`}>
                    <span className="text-neutral-500">$</span>
                    <input
                      type="number"
                      onFocus={selectNumberInput}
                      min="0"
                      step="500"
                      value={account.emergencyFundTarget}
                      onChange={(event) =>
                        onUpdateAccount(
                          account.id,
                          "emergencyFundTarget",
                          Number(event.target.value),
                        )
                      }
                      aria-label={`${account.name} emergency fund target`}
                      className="min-w-0 flex-1 bg-transparent px-1 py-2 font-semibold text-neutral-100 outline-none"
                    />
                  </div>
                </label>

                <div className={`${subtleSurface} p-3`}>
                  <p className={metricLabel}>Limit progress</p>
                  <p className="mt-1 text-sm font-semibold text-neutral-100">
                    {formatCurrency(account.yearToDateContribution)} /{" "}
                    {formatCurrency(account.annualContributionLimit)}
                  </p>
                  <div className={`${progressTrack} mt-2 h-1.5 overflow-hidden`}>
                    <div
                      className="h-full rounded-full bg-sky-300"
                      style={{ width: `${limitProgress}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <label className="block text-sm">
                  <span className="text-xs text-neutral-500">
                    Annual contribution limit
                  </span>
                  <div className={`${inputBase} mt-1 flex items-center px-2`}>
                    <span className="text-neutral-500">$</span>
                    <input
                      type="number"
                      onFocus={selectNumberInput}
                      min="0"
                      step="100"
                      value={account.annualContributionLimit}
                      onChange={(event) =>
                        onUpdateAccount(
                          account.id,
                          "annualContributionLimit",
                          Number(event.target.value),
                        )
                      }
                      aria-label={`${account.name} annual contribution limit`}
                      className="min-w-0 flex-1 bg-transparent px-1 py-2 font-semibold text-neutral-100 outline-none"
                    />
                  </div>
                </label>

                <label className="block text-sm">
                  <span className="text-xs text-neutral-500">
                    Year-to-date contribution
                  </span>
                  <div className={`${inputBase} mt-1 flex items-center px-2`}>
                    <span className="text-neutral-500">$</span>
                    <input
                      type="number"
                      onFocus={selectNumberInput}
                      min="0"
                      step="100"
                      value={account.yearToDateContribution}
                      onChange={(event) =>
                        onUpdateAccount(
                          account.id,
                          "yearToDateContribution",
                          Number(event.target.value),
                        )
                      }
                      aria-label={`${account.name} year-to-date contribution`}
                      className="min-w-0 flex-1 bg-transparent px-1 py-2 font-semibold text-neutral-100 outline-none"
                    />
                  </div>
                </label>

                <label className="block text-sm md:col-span-2">
                  <span className="text-xs text-neutral-500">Account notes</span>
                  <textarea
                    value={account.notes}
                    onChange={(event) =>
                      onUpdateAccount(account.id, "notes", event.target.value)
                    }
                    aria-label={`${account.name} account notes`}
                    rows={2}
                    className={`${inputBase} mt-1 w-full resize-none px-3 py-2 text-sm`}
                  />
                </label>
              </div>

              <div className={`${subtleSurface} p-3`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-neutral-100">
                    Asset allocation
                  </p>
                  <p
                    className={`text-xs font-semibold ${
                      allocationTotal === 100
                        ? "text-neutral-500"
                        : "text-amber-200"
                    }`}
                  >
                    Total {allocationTotal}%
                  </p>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {allocationFields.map((field) => (
                    <label key={field.value} className="block text-sm">
                      <span className="text-xs text-neutral-500">
                        {field.label}
                      </span>
                      <div className={`${inputBase} mt-1 flex items-center px-2`}>
                        <input
                          type="number"
                          onFocus={selectNumberInput}
                          min="0"
                          max="100"
                          step="5"
                          value={account.allocation[field.value]}
                          onChange={(event) =>
                            onUpdateAccountAllocation(
                              account.id,
                              field.value,
                              clampPercent(Number(event.target.value)),
                            )
                          }
                          aria-label={`${account.name} ${field.label} allocation`}
                          className="min-w-0 flex-1 bg-transparent px-1 py-2 font-semibold text-neutral-100 outline-none"
                        />
                        <span className="text-neutral-500">%</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}
