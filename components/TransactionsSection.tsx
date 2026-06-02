"use client";

import { type ChangeEvent, type FocusEvent, useMemo, useRef } from "react";
import { formatCurrency } from "@/lib/formatting";
import {
  dangerButton,
  inputBase,
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
import type {
  Account,
  Budget,
  MonthlyActual,
  Transaction,
  TransactionCategoryType,
} from "@/types";

type TransactionsSectionProps = {
  accounts: Account[];
  budgets: Budget[];
  selectedMonth: string;
  transactionActual: MonthlyActual;
  transactions: Transaction[];
  onAddTransaction: () => void;
  onApplyToActuals: () => void;
  onDeleteTransaction: (transactionId: string) => void;
  onDownloadCsvTemplate: () => void;
  onImportCsv: (csv: string) => void;
  onUpdateTransaction: (
    transactionId: string,
    nextTransaction: Partial<Transaction>,
  ) => void;
  selectNumberInput: (event: FocusEvent<HTMLInputElement>) => void;
};

const categoryOptions: Array<{
  label: string;
  value: TransactionCategoryType;
}> = [
  { label: "Uncategorized", value: "uncategorized" },
  { label: "Income", value: "income" },
  { label: "Transfer / set-aside", value: "transfer" },
  { label: "Debt payment", value: "debtPayment" },
  { label: "Investment contribution", value: "contribution" },
];

const transactionCategoryValue = (transaction: Transaction) =>
  transaction.categoryType === "budget"
    ? `budget:${transaction.budgetId}`
    : transaction.categoryType;

const formatMonthLabel = (month: string) => {
  const [year, monthIndex] = month.split("-").map(Number);
  const date = new Date(year, monthIndex - 1, 1);

  return date.toLocaleDateString([], {
    month: "long",
    year: "numeric",
  });
};

export function TransactionsSection({
  accounts,
  budgets,
  selectedMonth,
  transactionActual,
  transactions,
  onAddTransaction,
  onApplyToActuals,
  onDeleteTransaction,
  onDownloadCsvTemplate,
  onImportCsv,
  onUpdateTransaction,
  selectNumberInput,
}: TransactionsSectionProps) {
  const csvInputRef = useRef<HTMLInputElement>(null);
  const selectedMonthTransactions = useMemo(
    () =>
      transactions
        .filter((transaction) => transaction.date.startsWith(selectedMonth))
        .sort((first, second) => second.date.localeCompare(first.date)),
    [selectedMonth, transactions],
  );
  const uncategorizedCount = selectedMonthTransactions.filter(
    (transaction) => transaction.categoryType === "uncategorized",
  ).length;
  const spending = Object.values(transactionActual.budgetActuals).reduce(
    (total, amount) => total + amount,
    0,
  );

  const importCsv = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    onImportCsv(await file.text());
  };

  return (
    <article id="transactions" className={`mt-4 scroll-mt-24 ${surface}`}>
      <div className={`${sectionHeader} xl:items-center`}>
        <div>
          <h3 className={sectionTitle}>Transactions</h3>
          <p className={sectionDescription}>
            Import or enter dated transactions, categorize them, then roll them
            into monthly actuals.
          </p>
        </div>
        <div data-report-hidden="true" className="flex flex-wrap gap-2">
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={importCsv}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => csvInputRef.current?.click()}
            className={secondaryButton}
          >
            Import CSV
          </button>
          <button
            type="button"
            onClick={onDownloadCsvTemplate}
            className={secondaryButton}
          >
            Download template
          </button>
          <button
            type="button"
            onClick={onAddTransaction}
            className={secondaryButton}
          >
            Add transaction
          </button>
          <button
            type="button"
            onClick={onApplyToActuals}
            className={primaryButton}
          >
            Apply to actuals
          </button>
        </div>
      </div>

      <div className="grid gap-5 p-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className={`${nestedSurface} px-3 py-2`}>
            <p className={metricLabel}>{formatMonthLabel(selectedMonth)}</p>
            <p className={`${metricValue} text-2xl`}>
              {selectedMonthTransactions.length} transactions
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              {transactions.length} total saved locally
            </p>
          </div>

          <div className={`${subtleSurface} grid gap-3 p-4`}>
            <MetricRow label="Imported income" value={transactionActual.income} />
            <MetricRow label="Category spending" value={spending} />
            <MetricRow label="Transfers" value={transactionActual.transfers} />
            <MetricRow label="Debt payments" value={transactionActual.debtPayments} />
            <MetricRow
              label="Contributions"
              value={transactionActual.contributions}
            />
          </div>

          <div className={`${subtleSurface} p-4`}>
            <p className="text-sm font-semibold text-neutral-100">
              {uncategorizedCount} uncategorized
            </p>
            <p className="mt-2 text-xs leading-5 text-neutral-500">
              CSV imports can use headers for date, description, amount,
              category, account, and notes. Positive uncategorized amounts are
              treated as income.
            </p>
            <p className="mt-2 text-xs leading-5 text-neutral-500">
              Use negative amounts for purchases and positive amounts for
              income or refunds.
            </p>
            <p className="mt-2 text-xs leading-5 text-neutral-500">
              Applying transactions updates only categories represented by this
              month&apos;s transactions.
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          {selectedMonthTransactions.length === 0 ? (
            <div className={`${subtleSurface} p-5`}>
              <p className="font-medium text-neutral-100">
                No transactions for this month
              </p>
              <p className="mt-2 text-sm text-neutral-500">
                Add one manually or import a CSV, then use the month picker in
                Monthly Actuals to review each month.
              </p>
            </div>
          ) : null}

          {selectedMonthTransactions.map((transaction) => (
            <div key={transaction.id} className={`${subtleSurface} p-4`}>
              <div className="grid gap-3 xl:grid-cols-[130px_minmax(0,1fr)_150px]">
                <label className="block">
                  <span className="text-xs text-neutral-500">Date</span>
                  <input
                    type="date"
                    value={transaction.date}
                    onChange={(event) =>
                      onUpdateTransaction(transaction.id, {
                        date: event.target.value,
                      })
                    }
                    className={`${inputBase} mt-1 w-full px-2 py-2 text-sm`}
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-neutral-500">Description</span>
                  <input
                    type="text"
                    value={transaction.description}
                    onChange={(event) =>
                      onUpdateTransaction(transaction.id, {
                        description: event.target.value,
                      })
                    }
                    className={`${inputBase} mt-1 w-full px-2 py-2 text-sm`}
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-neutral-500">Amount</span>
                  <div className={`${inputBase} mt-1 flex items-center px-2`}>
                    <span className="text-neutral-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={transaction.amount}
                      onFocus={selectNumberInput}
                      onChange={(event) =>
                        onUpdateTransaction(transaction.id, {
                          amount: Number(event.target.value),
                        })
                      }
                      aria-label={`${transaction.description} amount`}
                      className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm font-semibold text-neutral-100 outline-none"
                    />
                  </div>
                </label>
              </div>

              <div className="mt-3 grid gap-3 xl:grid-cols-[220px_180px_minmax(0,1fr)_auto] xl:items-end">
                <label className="block">
                  <span className="text-xs text-neutral-500">Category</span>
                  <select
                    value={transactionCategoryValue(transaction)}
                    onChange={(event) => {
                      const value = event.target.value;

                      onUpdateTransaction(
                        transaction.id,
                        value.startsWith("budget:")
                          ? {
                              categoryType: "budget",
                              budgetId: value.replace("budget:", ""),
                            }
                          : {
                              categoryType: value as TransactionCategoryType,
                              budgetId: "",
                            },
                      );
                    }}
                    className={`${inputBase} mt-1 w-full px-2 py-2 text-sm`}
                  >
                    {categoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                    {budgets.map((budget) => (
                      <option key={budget.id} value={`budget:${budget.id}`}>
                        {budget.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs text-neutral-500">Account</span>
                  <select
                    value={transaction.accountId}
                    onChange={(event) =>
                      onUpdateTransaction(transaction.id, {
                        accountId: event.target.value,
                      })
                    }
                    className={`${inputBase} mt-1 w-full px-2 py-2 text-sm`}
                  >
                    <option value="">No account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs text-neutral-500">Notes</span>
                  <input
                    type="text"
                    value={transaction.notes}
                    onChange={(event) =>
                      onUpdateTransaction(transaction.id, {
                        notes: event.target.value,
                      })
                    }
                    className={`${inputBase} mt-1 w-full px-2 py-2 text-sm`}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => onDeleteTransaction(transaction.id)}
                  className={dangerButton}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

function MetricRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-neutral-400">{label}</span>
      <span className="font-semibold text-neutral-100">
        {formatCurrency(value)}
      </span>
    </div>
  );
}
