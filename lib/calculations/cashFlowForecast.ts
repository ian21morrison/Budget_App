import type {
  BudgetTotals,
  CashFlowForecast,
  CashFlowForecastHorizon,
  MonthlyActual,
  RecurringBill,
} from "@/types";

const HORIZON_DAYS = [30, 60, 90];

const toDate = (date: string) => new Date(`${date}T00:00:00`);

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const addDays = (date: Date, days: number) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
};

const addMonths = (date: Date, months: number) => {
  const nextDate = new Date(date);
  nextDate.setMonth(nextDate.getMonth() + months);

  return nextDate;
};

const addCadence = (date: Date, cadence: RecurringBill["cadence"]) => {
  switch (cadence) {
    case "weekly":
      return addDays(date, 7);
    case "biweekly":
      return addDays(date, 14);
    case "quarterly":
      return addMonths(date, 3);
    case "annual":
      return addMonths(date, 12);
    case "monthly":
      return addMonths(date, 1);
  }
};

const getMonthlyOccurrences = ({
  amount,
  anchorDate,
  today,
  horizonDays,
}: {
  amount: number;
  anchorDate: string;
  today: string;
  horizonDays: number;
}) => {
  if (amount <= 0) {
    return 0;
  }

  const startDate = toDate(today);
  const endDate = addDays(startDate, horizonDays);
  let occurrenceDate = toDate(anchorDate);

  while (occurrenceDate < startDate) {
    occurrenceDate = addMonths(occurrenceDate, 1);
  }

  let total = 0;

  while (occurrenceDate <= endDate) {
    total += amount;
    occurrenceDate = addMonths(occurrenceDate, 1);
  }

  return total;
};

const getBillOccurrences = ({
  bill,
  today,
  horizonDays,
}: {
  bill: RecurringBill;
  today: string;
  horizonDays: number;
}) => {
  if (bill.expectedAmount <= 0) {
    return 0;
  }

  const startDate = toDate(today);
  const endDate = addDays(startDate, horizonDays);
  const billDueDate = toDate(bill.dueDate);
  let total = 0;

  if (!bill.isPaid && billDueDate < startDate) {
    total += bill.expectedAmount;
  }

  let occurrenceDate =
    bill.isPaid || billDueDate < startDate
      ? addCadence(billDueDate, bill.cadence)
      : billDueDate;

  while (occurrenceDate < startDate) {
    occurrenceDate = addCadence(occurrenceDate, bill.cadence);
  }

  while (occurrenceDate <= endDate) {
    total += bill.expectedAmount;
    occurrenceDate = addCadence(occurrenceDate, bill.cadence);
  }

  return total;
};

const getForecastHorizon = ({
  days,
  monthlyIncome,
  monthlyDebtPayments,
  monthlyTransfers,
  monthlyContributions,
  nextPaycheckDate,
  recurringBills,
  startingCash,
  today,
}: {
  days: number;
  monthlyIncome: number;
  monthlyDebtPayments: number;
  monthlyTransfers: number;
  monthlyContributions: number;
  nextPaycheckDate: string;
  recurringBills: RecurringBill[];
  startingCash: number;
  today: string;
}): CashFlowForecastHorizon => {
  const income = getMonthlyOccurrences({
    amount: monthlyIncome,
    anchorDate: nextPaycheckDate,
    today,
    horizonDays: days,
  });
  const debtPayments = getMonthlyOccurrences({
    amount: monthlyDebtPayments,
    anchorDate: nextPaycheckDate,
    today,
    horizonDays: days,
  });
  const transfers = getMonthlyOccurrences({
    amount: monthlyTransfers,
    anchorDate: nextPaycheckDate,
    today,
    horizonDays: days,
  });
  const contributions = getMonthlyOccurrences({
    amount: monthlyContributions,
    anchorDate: nextPaycheckDate,
    today,
    horizonDays: days,
  });
  const bills = recurringBills.reduce(
    (total, bill) =>
      total +
      getBillOccurrences({
        bill,
        today,
        horizonDays: days,
      }),
    0,
  );
  const totalOutflow = bills + debtPayments + transfers + contributions;
  const netCashFlow = income - totalOutflow;

  return {
    days,
    income,
    bills,
    debtPayments,
    transfers,
    contributions,
    totalOutflow,
    netCashFlow,
    endingCash: startingCash + netCashFlow,
  };
};

export const calculateCashFlowForecast = ({
  monthlyActual,
  monthlyIncome,
  nextPaycheckDate,
  recurringBills,
  today = toDateKey(new Date()),
  totals,
}: {
  monthlyActual: MonthlyActual;
  monthlyIncome: number;
  nextPaycheckDate: string;
  recurringBills: RecurringBill[];
  today?: string;
  totals: Pick<BudgetTotals, "cash" | "debtPayments" | "monthlyInvestment">;
}): CashFlowForecast => {
  const monthlyTransfers = Math.max(0, -monthlyActual.transfers);
  const monthlyPlannedCashFlow =
    monthlyIncome -
    recurringBills.reduce((total, bill) => total + bill.expectedAmount, 0) -
    totals.debtPayments -
    monthlyTransfers -
    totals.monthlyInvestment;
  const dailyBurn =
    monthlyPlannedCashFlow < 0 ? Math.abs(monthlyPlannedCashFlow) / 30 : 0;
  const runwayDays =
    dailyBurn > 0 ? Math.floor(totals.cash / Math.max(dailyBurn, 1)) : null;
  const horizons = HORIZON_DAYS.map((days) =>
    getForecastHorizon({
      days,
      monthlyIncome,
      monthlyDebtPayments: totals.debtPayments,
      monthlyTransfers,
      monthlyContributions: totals.monthlyInvestment,
      nextPaycheckDate,
      recurringBills,
      startingCash: totals.cash,
      today,
    }),
  );

  return {
    startingCash: totals.cash,
    nextPaycheckDate,
    monthlyIncome,
    monthlyDebtPayments: totals.debtPayments,
    monthlyTransfers,
    monthlyContributions: totals.monthlyInvestment,
    monthlyPlannedCashFlow,
    runwayDays,
    horizons,
  };
};
