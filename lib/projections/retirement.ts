import { defaultReturnForAccount } from "@/lib/calculations/returns";
import type {
  Account,
  BudgetTotals,
  ContributionReturns,
  InvestmentContributions,
  RetirementPlan,
  RetirementProjection,
} from "@/types";

export const calculateRetirementProjection = ({
  contributionAccounts,
  contributionReturns,
  investmentContributions,
  retirementPlan,
  totals,
}: {
  contributionAccounts: Account[];
  contributionReturns: ContributionReturns;
  investmentContributions: InvestmentContributions;
  retirementPlan: RetirementPlan;
  totals: Pick<BudgetTotals, "contributionBalance" | "monthlyInvestment">;
}): RetirementProjection => {
  const projectionAccounts = contributionAccounts.map((account) => ({
    id: account.id,
    name: account.name,
    accent: account.accent,
    balance: account.balance,
    monthlyContribution: investmentContributions[account.id] ?? 0,
    annualReturn:
      contributionReturns[account.id] ??
      defaultReturnForAccount(account, retirementPlan.annualReturn),
  }));
  const weightedReturnBase =
    totals.contributionBalance > 0
      ? totals.contributionBalance
      : totals.monthlyInvestment;
  const weightedAnnualReturn =
    weightedReturnBase > 0
      ? projectionAccounts.reduce(
          (total, account) =>
            total +
            ((totals.contributionBalance > 0
              ? account.balance
              : account.monthlyContribution) /
              weightedReturnBase) *
              account.annualReturn,
          0,
        )
      : 0;
  const returnMix = projectionAccounts.map((account) => ({
    id: account.id,
    name: account.name,
    accent: account.accent,
    annualReturn: account.annualReturn,
    share:
      weightedReturnBase > 0
        ? ((totals.contributionBalance > 0
            ? account.balance
            : account.monthlyContribution) /
            weightedReturnBase) *
          100
        : 0,
  }));
  const projectBalance = (
    months: number,
    monthlyContributionOverride?: number,
  ) => {
    const allocationBase = projectionAccounts.reduce(
      (total, account) => total + account.monthlyContribution + account.balance,
      0,
    );

    return projectionAccounts.reduce((total, account) => {
      const contributionShare =
        projectionAccounts.length === 0
          ? 0
          : allocationBase > 0
            ? (account.monthlyContribution + account.balance) / allocationBase
            : 1 / projectionAccounts.length;
      const monthlyContribution =
        monthlyContributionOverride === undefined
          ? account.monthlyContribution
          : monthlyContributionOverride * contributionShare;
      let balance = account.balance;
      const monthlyRate = account.annualReturn / 100 / 12;

      for (let month = 1; month <= months; month += 1) {
        balance = balance * (1 + monthlyRate) + monthlyContribution;
      }

      return total + balance;
    }, 0);
  };
  const maxMonths = 75 * 12;
  let projectedBalance = totals.contributionBalance;
  let monthsToGoal: number | null =
    projectedBalance >= retirementPlan.targetPortfolio ? 0 : null;

  for (let month = 1; month <= maxMonths; month += 1) {
    projectedBalance = projectBalance(month);

    if (
      monthsToGoal === null &&
      projectedBalance >= retirementPlan.targetPortfolio
    ) {
      monthsToGoal = month;
      break;
    }
  }

  const targetMonths = Math.max(
    0,
    Math.round((retirementPlan.targetAge - retirementPlan.currentAge) * 12),
  );
  const balanceAtTargetAge = projectBalance(targetMonths);

  let requiredMonthlyContribution = totals.monthlyInvestment;

  if (targetMonths <= 0) {
    requiredMonthlyContribution = Math.max(
      0,
      retirementPlan.targetPortfolio - totals.contributionBalance,
    );
  } else if (projectBalance(targetMonths, 0) >= retirementPlan.targetPortfolio) {
    requiredMonthlyContribution = 0;
  } else {
    let low = 0;
    let high = Math.max(100, totals.monthlyInvestment || 100);

    while (
      projectBalance(targetMonths, high) < retirementPlan.targetPortfolio &&
      high < 100000
    ) {
      high *= 2;
    }

    for (let attempt = 0; attempt < 32; attempt += 1) {
      const middle = (low + high) / 2;

      if (projectBalance(targetMonths, middle) >= retirementPlan.targetPortfolio) {
        high = middle;
      } else {
        low = middle;
      }
    }

    requiredMonthlyContribution = high;
  }

  const yearsToTarget = Math.max(0, Math.ceil(targetMonths / 12));
  const projectionPoints = Array.from(
    { length: Math.max(2, yearsToTarget + 1) },
    (_, index) => {
      const months = Math.min(targetMonths, index * 12);

      return {
        age: retirementPlan.currentAge + index,
        balance: projectBalance(months),
      };
    },
  );
  const maxChartBalance = Math.max(
    retirementPlan.targetPortfolio,
    ...projectionPoints.map((point) => point.balance),
    1,
  );

  const projectedAge =
    monthsToGoal === null
      ? null
      : retirementPlan.currentAge + monthsToGoal / 12;

  return {
    balanceAtTargetAge,
    goalGap: balanceAtTargetAge - retirementPlan.targetPortfolio,
    isOnTrack: balanceAtTargetAge >= retirementPlan.targetPortfolio,
    monthsToGoal,
    projectedAge,
    projectionPoints,
    requiredMonthlyContribution,
    maxChartBalance,
    returnMix,
    weightedAnnualReturn,
    progress: Math.min(
      100,
      Math.round(
        (balanceAtTargetAge / Math.max(retirementPlan.targetPortfolio, 1)) *
          100,
      ),
    ),
  };
};
