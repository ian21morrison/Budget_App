import type { RecurringBill, RecurringBillsSummary } from "@/types";

const getTime = (date: string) => new Date(`${date}T00:00:00`).getTime();

const isOnOrBefore = (date: string, comparisonDate: string) =>
  getTime(date) <= getTime(comparisonDate);

const isBefore = (date: string, comparisonDate: string) =>
  getTime(date) < getTime(comparisonDate);

const sumBills = (bills: RecurringBill[]) =>
  bills.reduce((total, bill) => total + bill.expectedAmount, 0);

const getMonthlyAmount = (bill: RecurringBill) => {
  switch (bill.cadence) {
    case "weekly":
      return (bill.expectedAmount * 52) / 12;
    case "biweekly":
      return (bill.expectedAmount * 26) / 12;
    case "quarterly":
      return bill.expectedAmount / 3;
    case "annual":
      return bill.expectedAmount / 12;
    case "monthly":
      return bill.expectedAmount;
  }
};

const sumMonthlyRunRate = (bills: RecurringBill[]) =>
  bills.reduce((total, bill) => total + getMonthlyAmount(bill), 0);

export const sortBillsByDueDate = (bills: RecurringBill[]) =>
  [...bills].sort((first, second) => {
    const dateComparison = first.dueDate.localeCompare(second.dueDate);

    return dateComparison !== 0
      ? dateComparison
      : first.name.localeCompare(second.name);
  });

export const calculateRecurringBillsSummary = ({
  recurringBills,
  nextPaycheckDate,
  today = new Date().toISOString().slice(0, 10),
}: {
  recurringBills: RecurringBill[];
  nextPaycheckDate: string;
  today?: string;
}): RecurringBillsSummary => {
  const sortedBills = sortBillsByDueDate(recurringBills);
  const unpaidBills = sortedBills.filter((bill) => !bill.isPaid);
  const paidBills = sortedBills.filter((bill) => bill.isPaid);
  const unpaidDueBeforePaycheck = unpaidBills.filter((bill) =>
    isOnOrBefore(bill.dueDate, nextPaycheckDate),
  );
  const paidDueBeforePaycheck = paidBills.filter((bill) =>
    isOnOrBefore(bill.dueDate, nextPaycheckDate),
  );
  const upcomingAfterPaycheck = unpaidBills.filter((bill) =>
    isBefore(nextPaycheckDate, bill.dueDate),
  );
  const overdueBills = unpaidBills.filter((bill) => isBefore(bill.dueDate, today));
  const dueTodayBills = unpaidBills.filter((bill) => bill.dueDate === today);

  return {
    nextPaycheckDate,
    unpaidDueBeforePaycheck,
    paidDueBeforePaycheck,
    upcomingAfterPaycheck,
    totalDueBeforePaycheck: sumBills(unpaidDueBeforePaycheck),
    totalPaidBeforePaycheck: sumBills(paidDueBeforePaycheck),
    monthlyExpectedTotal: sumMonthlyRunRate(sortedBills),
    unpaidTotal: sumBills(unpaidBills),
    paidTotal: sumBills(paidBills),
    overdueTotal: sumBills(overdueBills),
    dueTodayTotal: sumBills(dueTodayBills),
    nextUnpaidBill: unpaidBills[0] ?? null,
  };
};
