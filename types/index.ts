export type AccountType = "cash" | "invested";

export type Account = {
  id: string;
  name: string;
  institution: string;
  balance: number;
  type: AccountType;
  accent: string;
};

export type Budget = {
  id: string;
  label: string;
  amount: number;
  detail: string;
  color: string;
};

export type Debt = {
  id: string;
  name: string;
  lender: string;
  balance: number;
  payment: number;
  rate: number;
  accent: string;
};

export type Goal = {
  id: string;
  title: string;
  category: string;
  cadence: string;
  amount: number;
  status: string;
};

export type RetirementPlan = {
  currentAge: number;
  targetAge: number;
  targetPortfolio: number;
  annualReturn: number;
};

export type InvestmentContributions = Record<string, number>;
export type ContributionReturns = Record<string, number>;

export type SavedBudgetState = {
  brandName: string;
  dashboardTitle: string;
  accounts: Account[];
  budgets: Budget[];
  debts: Debt[];
  goals: Goal[];
  monthlyIncome: number;
  retirementPlan: RetirementPlan;
  investmentContributions: InvestmentContributions;
  contributionReturns: ContributionReturns;
  completedActions: string[];
};

export type BudgetTotals = {
  assets: number;
  debt: number;
  debtPayments: number;
  netWorth: number;
  monthlyBudget: number;
  monthlyInvestment: number;
  monthlySurplus: number;
  cash: number;
  invested: number;
  contributionBalance: number;
};

export type RetirementProjectionAccount = {
  id: string;
  name: string;
  accent: string;
  balance: number;
  monthlyContribution: number;
  annualReturn: number;
};

export type RetirementReturnMixItem = {
  id: string;
  name: string;
  accent: string;
  annualReturn: number;
  share: number;
};

export type RetirementProjectionPoint = {
  age: number;
  balance: number;
};

export type RetirementProjection = {
  balanceAtTargetAge: number;
  goalGap: number;
  isOnTrack: boolean;
  monthsToGoal: number | null;
  projectedAge: number | null;
  projectionPoints: RetirementProjectionPoint[];
  requiredMonthlyContribution: number;
  maxChartBalance: number;
  returnMix: RetirementReturnMixItem[];
  weightedAnnualReturn: number;
  progress: number;
};
