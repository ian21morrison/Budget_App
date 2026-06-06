import { type FocusEvent } from "react";
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
  statusBadge,
  subtleSurface,
  surface,
} from "@/components/uiStyles";
import type {
  RecurringBill,
  RecurringBillCadence,
  RecurringBillsSummary,
} from "@/types";

type RecurringBillsSectionProps = {
  nextPaycheckDate: string;
  recurringBills: RecurringBill[];
  summary: RecurringBillsSummary;
  onAddBill: () => void;
  onDeleteBill: (billId: string) => void;
  onResetBills: () => void;
  onUpdateBill: (
    billId: string,
    field:
      | "name"
      | "category"
      | "dueDate"
      | "cadence"
      | "expectedAmount"
      | "isPaid"
      | "autopay",
    value: string | number | boolean,
  ) => void;
  onUpdateNextPaycheckDate: (date: string) => void;
  selectNumberInput: (event: FocusEvent<HTMLInputElement>) => void;
};

const cadenceOptions: Array<{
  label: string;
  value: RecurringBillCadence;
}> = [
  { label: "Weekly", value: "weekly" },
  { label: "Biweekly", value: "biweekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Quarterly", value: "quarterly" },
  { label: "Annual", value: "annual" },
];

const formatDateLabel = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });

const getBillStatus = (bill: RecurringBill, today: string) => {
  if (bill.isPaid) {
    return {
      label: "Paid",
      className: "bg-emerald-300/10 text-emerald-200",
    };
  }

  if (bill.dueDate < today) {
    return {
      label: "Overdue",
      className: "bg-rose-300/10 text-rose-200",
    };
  }

  if (bill.dueDate === today) {
    return {
      label: "Due today",
      className: "bg-amber-300/10 text-amber-200",
    };
  }

  return {
    label: "Unpaid",
    className: "bg-white/[0.06] text-neutral-300",
  };
};

export function RecurringBillsSection({
  nextPaycheckDate,
  recurringBills,
  summary,
  onAddBill,
  onDeleteBill,
  onResetBills,
  onUpdateBill,
  onUpdateNextPaycheckDate,
  selectNumberInput,
}: RecurringBillsSectionProps) {
  const today = new Date().toISOString().slice(0, 10);
  const sortedBills = [...recurringBills].sort((first, second) => {
    const dateComparison = first.dueDate.localeCompare(second.dueDate);

    return dateComparison !== 0
      ? dateComparison
      : first.name.localeCompare(second.name);
  });

  return (
    <article id="recurring-bills" className={`mt-4 scroll-mt-24 ${surface}`}>
      <div className={`${sectionHeader} xl:items-center`}>
        <div>
          <h3 className={sectionTitle}>Recurring Bills & Subscriptions</h3>
          <p className={sectionDescription}>
            Schedule obligations with due dates, cadence, expected amount, and
            paid status.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onAddBill} className={primaryButton}>
            Add bill
          </button>
          <button type="button" onClick={onResetBills} className={secondaryButton}>
            Reset
          </button>
        </div>
      </div>

      <div className="border-b border-white/10 p-5">
        <div className="grid gap-3 lg:grid-cols-[220px_minmax(190px,1.2fr)_minmax(190px,1fr)] xl:grid-cols-[220px_minmax(210px,1.25fr)_repeat(4,minmax(140px,1fr))]">
          <label className={`${nestedSurface} block px-3 py-2.5`}>
            <span className="text-sm text-neutral-300">
              Next paycheck date
            </span>
            <input
              type="date"
              value={nextPaycheckDate}
              onChange={(event) => onUpdateNextPaycheckDate(event.target.value)}
              className={`${inputBase} mt-2 w-full px-3 py-3 font-semibold`}
            />
          </label>

          <div className={`${subtleSurface} p-4 lg:col-span-2 xl:col-span-1`}>
            <p className={metricLabel}>Cash leaving before paycheck</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-amber-200">
              {formatCurrency(summary.totalDueBeforePaycheck)}
            </p>
            <p className="mt-2 text-sm leading-6 text-neutral-500">
              {summary.unpaidDueBeforePaycheck.length} unpaid item
              {summary.unpaidDueBeforePaycheck.length === 1 ? "" : "s"} due by{" "}
              {formatDateLabel(nextPaycheckDate)}.
            </p>
          </div>

          <div className={`${nestedSurface} px-3 py-2.5`}>
            <p className={metricLabel}>Unpaid total</p>
            <p className={`${metricValue} text-xl`}>
              {formatCurrency(summary.unpaidTotal)}
            </p>
          </div>

          <div className={`${nestedSurface} px-3 py-2.5`}>
            <p className={metricLabel}>Overdue</p>
            <p
              className={`${metricValue} text-xl ${
                summary.overdueTotal > 0 ? "text-rose-300" : ""
              }`}
            >
              {formatCurrency(summary.overdueTotal)}
            </p>
          </div>

          <div className={`${nestedSurface} px-3 py-2.5`}>
            <p className={metricLabel}>Due today</p>
            <p
              className={`${metricValue} text-xl ${
                summary.dueTodayTotal > 0 ? "text-amber-200" : ""
              }`}
            >
              {formatCurrency(summary.dueTodayTotal)}
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              {formatCurrency(summary.totalPaidBeforePaycheck)} paid before
              paycheck
            </p>
          </div>

          <div className={`${nestedSurface} px-3 py-2.5`}>
            <p className={metricLabel}>Monthly expected</p>
            <p className={`${metricValue} text-xl`}>
              {formatCurrency(summary.monthlyExpectedTotal)}
            </p>
          </div>
        </div>

        <div className={`${subtleSurface} mt-3 p-4`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-neutral-100">
                Next unpaid bill
              </p>
              {summary.nextUnpaidBill ? (
                <p className="mt-1 text-sm text-neutral-400">
                  {summary.nextUnpaidBill.name} is due{" "}
                  {formatDateLabel(summary.nextUnpaidBill.dueDate)}.
                </p>
              ) : (
                <p className="mt-1 text-sm text-neutral-500">
                  All scheduled items are marked paid.
                </p>
              )}
            </div>
            {summary.nextUnpaidBill ? (
              <p className="shrink-0 text-xl font-semibold tracking-tight text-neutral-50">
                {formatCurrency(summary.nextUnpaidBill.expectedAmount)}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="grid gap-3">
          {sortedBills.map((bill) => {
            const status = getBillStatus(bill, today);

            return (
              <div key={bill.id} className={`${subtleSurface} p-3.5`}>
                <div className="grid gap-3 xl:grid-cols-[minmax(260px,1fr)_140px_140px_120px_252px] xl:items-end">
                  <div className="min-w-0">
                    <div className="flex min-h-7 flex-wrap items-center gap-2">
                      <span className={`${statusBadge} ${status.className}`}>
                        {status.label}
                      </span>
                      {bill.autopay ? (
                        <span className="rounded-full border border-sky-300/20 bg-sky-300/10 px-2.5 py-1 text-xs font-semibold text-sky-200">
                          Autopay
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_170px]">
                      <label className="block">
                        <span className="sr-only">Bill name</span>
                        <input
                          type="text"
                          value={bill.name}
                          onChange={(event) =>
                            onUpdateBill(bill.id, "name", event.target.value)
                          }
                          className={`${inputBase} h-10 w-full px-3 text-sm font-semibold`}
                        />
                      </label>
                      <label className="block">
                        <span className="sr-only">Bill category</span>
                        <input
                          type="text"
                          value={bill.category}
                          onChange={(event) =>
                            onUpdateBill(
                              bill.id,
                              "category",
                              event.target.value,
                            )
                          }
                          className={`${inputBase} h-10 w-full px-3 text-sm`}
                        />
                      </label>
                    </div>
                  </div>

                  <label className="grid gap-1">
                    <span className="text-xs text-neutral-500">Due date</span>
                    <input
                      type="date"
                      value={bill.dueDate}
                      onChange={(event) =>
                        onUpdateBill(bill.id, "dueDate", event.target.value)
                      }
                      className={`${inputBase} h-10 w-full px-2 text-sm`}
                    />
                  </label>

                  <label className="grid gap-1">
                    <span className="text-xs text-neutral-500">Cadence</span>
                    <select
                      value={bill.cadence}
                      onChange={(event) =>
                        onUpdateBill(
                          bill.id,
                          "cadence",
                          event.target.value as RecurringBillCadence,
                        )
                      }
                      className={`${inputBase} h-10 w-full px-2 text-sm`}
                    >
                      {cadenceOptions.map((cadence) => (
                        <option key={cadence.value} value={cadence.value}>
                          {cadence.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-1">
                    <span className="text-xs text-neutral-500">Amount</span>
                    <div className={`${inputBase} flex h-10 items-center px-2`}>
                      <span className="text-neutral-500">$</span>
                      <input
                        type="number"
                        onFocus={selectNumberInput}
                        min="0"
                        step="5"
                        value={bill.expectedAmount}
                        onChange={(event) =>
                          onUpdateBill(
                            bill.id,
                            "expectedAmount",
                            Number(event.target.value),
                          )
                        }
                        className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm font-semibold text-neutral-100 outline-none"
                      />
                    </div>
                  </label>

                  <div className="grid grid-cols-3 gap-2 xl:self-end">
                    <label className={`${secondaryButton} h-10 w-full cursor-pointer gap-2 px-2`}>
                      <input
                        type="checkbox"
                        checked={bill.isPaid}
                        onChange={(event) =>
                          onUpdateBill(bill.id, "isPaid", event.target.checked)
                        }
                        className="size-4 accent-emerald-300"
                      />
                      Paid
                    </label>
                    <label className={`${secondaryButton} h-10 w-full cursor-pointer gap-2 px-2`}>
                      <input
                        type="checkbox"
                        checked={bill.autopay}
                        onChange={(event) =>
                          onUpdateBill(bill.id, "autopay", event.target.checked)
                        }
                        className="size-4 accent-sky-300"
                      />
                      Auto
                    </label>
                    <button
                      type="button"
                      onClick={() => onDeleteBill(bill.id)}
                      className={`${dangerButton} h-10 w-full px-2`}
                    >
                      Delete
                    </button>
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
