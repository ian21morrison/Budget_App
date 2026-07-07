export type AccountType = "cash" | "invested";

export type AccountTaxTreatment =
  | "taxable"
  | "traditionalRetirement"
  | "rothRetirement"
  | "hsa"
  | "education"
  | "other";

export type AccountPurpose =
  | "operating"
  | "emergency"
  | "retirement"
  | "taxableInvesting"
  | "shortTermSavings"
  | "other";

export type AccountAssetAllocation = {
  stocks: number;
  bonds: number;
  cash: number;
  alternatives: number;
};

export type Account = {
  id: string;
  name: string;
  institution: string;
  balance: number;
  type: AccountType;
  taxTreatment: AccountTaxTreatment;
  purpose: AccountPurpose;
  allocation: AccountAssetAllocation;
  emergencyFundTarget: number;
  annualContributionLimit: number;
  yearToDateContribution: number;
  projectedAnnualIncomeRate: number;
  notes: string;
  accent: string;
};

export type Budget = {
  id: string;
  label: string;
  amount: number;
  detail: string;
  color: string;
};

export type RecurringBillCadence =
  | "weekly"
  | "biweekly"
  | "monthly"
  | "quarterly"
  | "annual";

export type RecurringBill = {
  id: string;
  name: string;
  category: string;
  dueDate: string;
  cadence: RecurringBillCadence;
  expectedAmount: number;
  isPaid: boolean;
  autopay: boolean;
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

export type MonthlyActual = {
  month: string;
  income: number;
  budgetActuals: Record<string, number>;
  transfers: number;
  debtPayments: number;
  contributions: number;
};

export type TransactionCategoryType =
  | "budget"
  | "income"
  | "transfer"
  | "debtPayment"
  | "contribution"
  | "uncategorized";

export type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  categoryType: TransactionCategoryType;
  budgetId: string;
  accountId: string;
  notes: string;
};

export type NetWorthSnapshot = {
  date: string;
  accountBalances: Record<string, number>;
  debtBalances: Record<string, number>;
};

export type SavedBudgetState = {
  brandName: string;
  dashboardTitle: string;
  accounts: Account[];
  budgets: Budget[];
  debts: Debt[];
  goals: Goal[];
  recurringBills: RecurringBill[];
  nextPaycheckDate: string;
  monthlyIncome: number;
  retirementPlan: RetirementPlan;
  investmentContributions: InvestmentContributions;
  contributionReturns: ContributionReturns;
  monthlyActuals: MonthlyActual[];
  transactions: Transaction[];
  netWorthSnapshots: NetWorthSnapshot[];
  completedActions: string[];
};

export type FinanceProfile = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  data: SavedBudgetState;
};

export type MonthlyActualTotals = {
  spending: number;
  outflow: number;
  surplus: number;
  plannedOutflow: number;
  plannedSurplus: number;
  incomeVariance: number;
  spendingVariance: number;
  outflowVariance: number;
  surplusVariance: number;
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

export type RecurringBillsSummary = {
  nextPaycheckDate: string;
  unpaidDueBeforePaycheck: RecurringBill[];
  paidDueBeforePaycheck: RecurringBill[];
  upcomingAfterPaycheck: RecurringBill[];
  totalDueBeforePaycheck: number;
  totalPaidBeforePaycheck: number;
  monthlyExpectedTotal: number;
  unpaidTotal: number;
  paidTotal: number;
  overdueTotal: number;
  dueTodayTotal: number;
  nextUnpaidBill: RecurringBill | null;
};

export type CashFlowForecastHorizon = {
  days: number;
  income: number;
  bills: number;
  debtPayments: number;
  transfers: number;
  contributions: number;
  totalOutflow: number;
  netCashFlow: number;
  endingCash: number;
};

export type CashFlowForecast = {
  startingCash: number;
  nextPaycheckDate: string;
  monthlyIncome: number;
  monthlyDebtPayments: number;
  monthlyTransfers: number;
  monthlyContributions: number;
  monthlyPlannedCashFlow: number;
  runwayDays: number | null;
  horizons: CashFlowForecastHorizon[];
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
