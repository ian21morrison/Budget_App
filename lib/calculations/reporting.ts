import type {
  Budget,
  BudgetTotals,
  Debt,
  MonthlyActual,
  MonthlyActualTotals,
  NetWorthSnapshot,
  RetirementPlan,
  RetirementProjection,
} from "@/types";

export type BudgetVarianceReportItem = {
  id: string;
  label: string;
  planned: number;
  actual: number;
  variance: number;
};

export type NetWorthTrendReport = {
  firstDate: string;
  latestDate: string;
  firstNetWorth: number;
  latestNetWorth: number;
  delta: number;
  snapshotCount: number;
};

export type DebtPayoffReportItem = {
  id: string;
  name: string;
  balance: number;
  payment: number;
  rate: number;
  monthsToPayoff: number | null;
  totalInterest: number | null;
};

export type FinancialReport = {
  generatedAt: string;
  month: string;
  monthlyIncome: number;
  plannedOutflow: number;
  actualOutflow: number;
  plannedSurplus: number;
  actualSurplus: number;
  spendingVariance: number;
  outflowVariance: number;
  surplusVariance: number;
  budgetVariance: BudgetVarianceReportItem[];
  netWorthTrend: NetWorthTrendReport | null;
  retirementStatus: {
    targetAge: number;
    targetPortfolio: number;
    balanceAtTargetAge: number;
    goalGap: number;
    isOnTrack: boolean;
    progress: number;
    requiredMonthlyContribution: number;
  };
  debtPayoffOutlook: DebtPayoffReportItem[];
  totals: BudgetTotals;
};

const sumBalances = (balances: Record<string, number>) =>
  Object.values(balances).reduce((total, balance) => total + balance, 0);

const getSnapshotNetWorth = (snapshot: NetWorthSnapshot) =>
  sumBalances(snapshot.accountBalances) - sumBalances(snapshot.debtBalances);

const calculateDebtPayoff = (debt: Debt) => {
  if (debt.balance <= 0) {
    return { monthsToPayoff: 0, totalInterest: 0 };
  }

  if (debt.payment <= 0) {
    return { monthsToPayoff: null, totalInterest: null };
  }

  const monthlyRate = debt.rate / 100 / 12;
  let balance = debt.balance;
  let totalInterest = 0;

  if (monthlyRate > 0 && debt.payment <= balance * monthlyRate) {
    return { monthsToPayoff: null, totalInterest: null };
  }

  for (let month = 1; month <= 600; month += 1) {
    const interest = balance * monthlyRate;
    totalInterest += interest;
    balance = balance + interest - debt.payment;

    if (balance <= 0) {
      return { monthsToPayoff: month, totalInterest };
    }
  }

  return { monthsToPayoff: null, totalInterest: null };
};

export const createFinancialReport = ({
  budgets,
  debts,
  monthlyActual,
  monthlyActualTotals,
  monthlyIncome,
  netWorthSnapshots,
  retirementPlan,
  retirementProjection,
  selectedMonth,
  totals,
}: {
  budgets: Budget[];
  debts: Debt[];
  monthlyActual: MonthlyActual;
  monthlyActualTotals: MonthlyActualTotals;
  monthlyIncome: number;
  netWorthSnapshots: NetWorthSnapshot[];
  retirementPlan: RetirementPlan;
  retirementProjection: RetirementProjection;
  selectedMonth: string;
  totals: BudgetTotals;
}): FinancialReport => {
  const sortedSnapshots = [...netWorthSnapshots].sort((first, second) =>
    first.date.localeCompare(second.date),
  );
  const firstSnapshot = sortedSnapshots[0];
  const latestSnapshot = sortedSnapshots[sortedSnapshots.length - 1];
  const firstNetWorth = firstSnapshot ? getSnapshotNetWorth(firstSnapshot) : 0;
  const latestNetWorth = latestSnapshot ? getSnapshotNetWorth(latestSnapshot) : 0;

  return {
    generatedAt: new Date().toISOString(),
    month: selectedMonth,
    monthlyIncome,
    plannedOutflow: monthlyActualTotals.plannedOutflow,
    actualOutflow: monthlyActualTotals.outflow,
    plannedSurplus: monthlyActualTotals.plannedSurplus,
    actualSurplus: monthlyActualTotals.surplus,
    spendingVariance: monthlyActualTotals.spendingVariance,
    outflowVariance: monthlyActualTotals.outflowVariance,
    surplusVariance: monthlyActualTotals.surplusVariance,
    budgetVariance: budgets.map((budget) => {
      const actual = -(monthlyActual.budgetActuals[budget.id] ?? 0);

      return {
        id: budget.id,
        label: budget.label,
        planned: budget.amount,
        actual,
        variance: actual - budget.amount,
      };
    }),
    netWorthTrend:
      firstSnapshot && latestSnapshot
        ? {
            firstDate: firstSnapshot.date,
            latestDate: latestSnapshot.date,
            firstNetWorth,
            latestNetWorth,
            delta: latestNetWorth - firstNetWorth,
            snapshotCount: sortedSnapshots.length,
          }
        : null,
    retirementStatus: {
      targetAge: retirementPlan.targetAge,
      targetPortfolio: retirementPlan.targetPortfolio,
      balanceAtTargetAge: retirementProjection.balanceAtTargetAge,
      goalGap: retirementProjection.goalGap,
      isOnTrack: retirementProjection.isOnTrack,
      progress: retirementProjection.progress,
      requiredMonthlyContribution:
        retirementProjection.requiredMonthlyContribution,
    },
    debtPayoffOutlook: debts.map((debt) => ({
      id: debt.id,
      name: debt.name,
      balance: debt.balance,
      payment: debt.payment,
      rate: debt.rate,
      ...calculateDebtPayoff(debt),
    })),
    totals,
  };
};

const escapeCsvValue = (value: string | number) => {
  const text = String(value);

  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const csvRow = (values: Array<string | number>) =>
  values.map(escapeCsvValue).join(",");

export const createFinancialReportCsv = (report: FinancialReport) => {
  const rows: Array<Array<string | number>> = [
    ["Section", "Metric", "Value", "Detail"],
    ["Month Summary", "Month", report.month, ""],
    ["Month Summary", "Monthly income", report.monthlyIncome, ""],
    ["Month Summary", "Planned outflow", report.plannedOutflow, ""],
    ["Month Summary", "Actual outflow", report.actualOutflow, ""],
    ["Month Summary", "Planned surplus", report.plannedSurplus, ""],
    ["Month Summary", "Actual surplus", report.actualSurplus, ""],
    ["Month Summary", "Surplus variance", report.surplusVariance, ""],
    ["Balance Sheet", "Assets", report.totals.assets, ""],
    ["Balance Sheet", "Debt", report.totals.debt, ""],
    ["Balance Sheet", "Net worth", report.totals.netWorth, ""],
  ];

  report.budgetVariance.forEach((item) => {
    rows.push([
      "Budget Variance",
      item.label,
      item.variance,
      `planned ${item.planned}; actual ${item.actual}`,
    ]);
  });

  if (report.netWorthTrend) {
    rows.push([
      "Net Worth Trend",
      "Change",
      report.netWorthTrend.delta,
      `${report.netWorthTrend.firstDate} to ${report.netWorthTrend.latestDate}`,
    ]);
  }

  rows.push(
    [
      "Retirement",
      report.retirementStatus.isOnTrack ? "On track" : "Needs attention",
      report.retirementStatus.goalGap,
      `target age ${report.retirementStatus.targetAge}; progress ${report.retirementStatus.progress}%`,
    ],
    [
      "Retirement",
      "Required monthly contribution",
      report.retirementStatus.requiredMonthlyContribution,
      "",
    ],
  );

  report.debtPayoffOutlook.forEach((debt) => {
    rows.push([
      "Debt Payoff",
      debt.name,
      debt.monthsToPayoff ?? "No payoff date",
      `balance ${debt.balance}; payment ${debt.payment}; rate ${debt.rate}%; interest ${debt.totalInterest ?? "n/a"}`,
    ]);
  });

  return rows.map(csvRow).join("\n");
};
