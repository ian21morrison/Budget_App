import { defaultReturnForAccount } from "@/lib/calculations/returns";
import type {
  Account,
  Budget,
  BudgetTotals,
  ContributionReturns,
  Debt,
  InvestmentContributions,
  MonthlyActual,
  MonthlyActualTotals,
  Transaction,
} from "@/types";

export const calculateBudgetTotals = ({
  accounts,
  budgets,
  debts,
  investmentContributions,
  monthlyIncome,
}: {
  accounts: Account[];
  budgets: Budget[];
  debts: Debt[];
  investmentContributions: InvestmentContributions;
  monthlyIncome: number;
}): BudgetTotals => {
  const assets = accounts.reduce((total, account) => total + account.balance, 0);
  const debt = debts.reduce((total, item) => total + item.balance, 0);
  const debtPayments = debts.reduce((total, item) => total + item.payment, 0);
  const netWorth = assets - debt;
  const monthlyBudget = budgets.reduce((total, budget) => total + budget.amount, 0);
  const accountIds = new Set(accounts.map((account) => account.id));
  const monthlyInvestment = Object.entries(investmentContributions).reduce(
    (total, [accountId, amount]) =>
      accountIds.has(accountId) ? total + amount : total,
    0,
  );
  const monthlySurplus =
    monthlyIncome - monthlyBudget - debtPayments - monthlyInvestment;
  const cash = accounts
    .filter((account) => account.type === "cash")
    .reduce((total, account) => total + account.balance, 0);
  const invested = assets - cash;
  const contributionBalance = accounts.reduce(
    (total, account) =>
      accountIds.has(account.id) &&
      Object.prototype.hasOwnProperty.call(investmentContributions, account.id)
        ? total + account.balance
        : total,
    0,
  );

  return {
    assets,
    debt,
    debtPayments,
    netWorth,
    monthlyBudget,
    monthlyInvestment,
    monthlySurplus,
    cash,
    invested,
    contributionBalance,
  };
};

export const getContributionAccounts = (
  accounts: Account[],
  investmentContributions: InvestmentContributions,
) =>
  accounts.filter((account) =>
    Object.prototype.hasOwnProperty.call(investmentContributions, account.id),
  );

export const getAvailableContributionAccounts = (
  accounts: Account[],
  investmentContributions: InvestmentContributions,
) =>
  accounts.filter(
    (account) =>
      !Object.prototype.hasOwnProperty.call(
        investmentContributions,
        account.id,
      ),
  );

export const calculateIncomeUsedPercent = ({
  debtPayments,
  monthlyBudget,
  monthlyIncome,
  monthlyInvestment,
}: {
  debtPayments: number;
  monthlyBudget: number;
  monthlyIncome: number;
  monthlyInvestment: number;
}) =>
  Math.round(
    ((monthlyBudget + debtPayments + monthlyInvestment) /
      Math.max(monthlyIncome, 1)) *
      100,
  );

export const calculateMonthlyContributionWeightedReturn = ({
  contributionAccounts,
  contributionReturns,
  investmentContributions,
  monthlyInvestment,
  retirementAnnualReturn,
}: {
  contributionAccounts: Account[];
  contributionReturns: ContributionReturns;
  investmentContributions: InvestmentContributions;
  monthlyInvestment: number;
  retirementAnnualReturn: number;
}) => {
  if (monthlyInvestment <= 0) {
    return 0;
  }

  return contributionAccounts.reduce((total, account) => {
    const monthlyContribution = investmentContributions[account.id] ?? 0;
    const accountReturn =
      contributionReturns[account.id] ??
      defaultReturnForAccount(account, retirementAnnualReturn);

    return total + (monthlyContribution / monthlyInvestment) * accountReturn;
  }, 0);
};

export const calculateMonthlyActualTotals = ({
  actual,
  totals,
}: {
  actual: MonthlyActual;
  totals: Pick<
    BudgetTotals,
    "debtPayments" | "monthlyBudget" | "monthlyInvestment" | "monthlySurplus"
  >;
}): MonthlyActualTotals => {
  const signedSpending = Object.values(actual.budgetActuals).reduce(
    (total, amount) => total + amount,
    0,
  );
  const spending = Object.values(actual.budgetActuals).reduce(
    (total, amount) => total - amount,
    0,
  );
  const signedOutflow =
    signedSpending + actual.transfers + actual.debtPayments + actual.contributions;
  const outflow = -signedOutflow;
  const surplus = actual.income - outflow;
  const plannedOutflow =
    totals.monthlyBudget + totals.debtPayments + totals.monthlyInvestment;

  return {
    spending,
    outflow,
    surplus,
    plannedOutflow,
    plannedSurplus: totals.monthlySurplus,
    incomeVariance: actual.income - (plannedOutflow + totals.monthlySurplus),
    spendingVariance: spending - totals.monthlyBudget,
    outflowVariance: outflow - plannedOutflow,
    surplusVariance: surplus - totals.monthlySurplus,
  };
};

export const createMonthlyActualFromTransactions = ({
  month,
  planActual,
  budgets,
  transactions,
}: {
  month: string;
  planActual: MonthlyActual;
  budgets: Budget[];
  transactions: Transaction[];
}): MonthlyActual => {
  const budgetActuals = budgets.reduce<Record<string, number>>((next, budget) => {
    next[budget.id] = 0;
    return next;
  }, {});
  const monthlyTransactions = transactions.filter((transaction) =>
    transaction.date.startsWith(month),
  );

  return monthlyTransactions.reduce<MonthlyActual>(
    (next, transaction) => {
      if (transaction.categoryType === "income") {
        next.income += transaction.amount;
        return next;
      }

      if (transaction.categoryType === "transfer") {
        next.transfers += transaction.amount;
        return next;
      }

      if (transaction.categoryType === "debtPayment") {
        next.debtPayments += transaction.amount;
        return next;
      }

      if (transaction.categoryType === "contribution") {
        next.contributions += transaction.amount;
        return next;
      }

      if (
        transaction.categoryType === "budget" &&
        transaction.budgetId &&
        Object.prototype.hasOwnProperty.call(budgetActuals, transaction.budgetId)
      ) {
        next.budgetActuals[transaction.budgetId] += transaction.amount;
      }

      return next;
    },
    {
      ...planActual,
      income: 0,
      budgetActuals,
      transfers: 0,
      debtPayments: 0,
      contributions: 0,
    },
  );
};
