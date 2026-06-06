import type {
  Account,
  Budget,
  Debt,
  Goal,
  MonthlyActual,
  NetWorthSnapshot,
  RecurringBill,
  RetirementPlan,
} from "@/types";

export const navItems = [
  "Overview",
  "Spending Plan",
  "Balance Sheet",
  "Long-Term Outlook",
  "Goals",
];

export const getCurrentMonthKey = (date = new Date()) =>
  date.toISOString().slice(0, 7);

export const getCurrentDateKey = (date = new Date()) =>
  date.toISOString().slice(0, 10);

export const getDefaultNextPaycheckDate = (date = new Date()) => {
  const nextPaycheck = new Date(date);
  nextPaycheck.setDate(nextPaycheck.getDate() + 14);

  return nextPaycheck.toISOString().slice(0, 10);
};

export const accountSeed: Account[] = [
  {
    id: "money-market-hys",
    name: "Money Market / HYS",
    institution: "Emergency fund + cash reserve",
    balance: 15000,
    type: "cash",
    taxTreatment: "taxable",
    purpose: "emergency",
    allocation: {
      stocks: 0,
      bonds: 0,
      cash: 100,
      alternatives: 0,
    },
    emergencyFundTarget: 18000,
    annualContributionLimit: 0,
    yearToDateContribution: 0,
    projectedAnnualIncomeRate: 3.5,
    notes: "Keep 3-6 months of essential expenses available.",
    accent: "bg-emerald-400",
  },
  {
    id: "roth-ira",
    name: "Roth IRA",
    institution: "Retirement investing",
    balance: 17400,
    type: "invested",
    taxTreatment: "rothRetirement",
    purpose: "retirement",
    allocation: {
      stocks: 90,
      bonds: 5,
      cash: 5,
      alternatives: 0,
    },
    emergencyFundTarget: 0,
    annualContributionLimit: 7000,
    yearToDateContribution: 0,
    projectedAnnualIncomeRate: 1.5,
    notes: "Track annual IRA limit and long-term allocation.",
    accent: "bg-violet-400",
  },
  {
    id: "pnc-checking",
    name: "PNC Checking",
    institution: "Operating cash",
    balance: 5000,
    type: "cash",
    taxTreatment: "taxable",
    purpose: "operating",
    allocation: {
      stocks: 0,
      bonds: 0,
      cash: 100,
      alternatives: 0,
    },
    emergencyFundTarget: 0,
    annualContributionLimit: 0,
    yearToDateContribution: 0,
    projectedAnnualIncomeRate: 0,
    notes: "Bill pay and month-to-month cash flow.",
    accent: "bg-sky-400",
  },
  {
    id: "brokerage",
    name: "Brokerage",
    institution: "Taxable investing",
    balance: 3000,
    type: "invested",
    taxTreatment: "taxable",
    purpose: "taxableInvesting",
    allocation: {
      stocks: 85,
      bonds: 5,
      cash: 5,
      alternatives: 5,
    },
    emergencyFundTarget: 0,
    annualContributionLimit: 0,
    yearToDateContribution: 0,
    projectedAnnualIncomeRate: 2,
    notes: "Flexible investing outside retirement accounts.",
    accent: "bg-amber-300",
  },
];

export const budgetSeed: Budget[] = [
  {
    id: "housing",
    label: "Rent / Utilities / Parking",
    amount: 2240,
    detail: "Rent, utilities, internet, phone, insurance, parking",
    color: "bg-sky-400",
  },
  {
    id: "groceries",
    label: "Groceries",
    amount: 350,
    detail: "Home cooking and household basics",
    color: "bg-emerald-400",
  },
  {
    id: "fun",
    label: "Fun",
    amount: 400,
    detail: "Travel, hobbies, subscriptions, gifts",
    color: "bg-violet-400",
  },
  {
    id: "dining",
    label: "Eating Out / Coffee",
    amount: 250,
    detail: "Restaurants, cafes, quick meals",
    color: "bg-amber-300",
  },
  {
    id: "transportation",
    label: "Transportation / Health",
    amount: 350,
    detail: "Transit, rideshare, maintenance, health costs",
    color: "bg-cyan-300",
  },
  {
    id: "other",
    label: "Other",
    amount: 300,
    detail: "Anything variable that needs a little room",
    color: "bg-rose-300",
  },
];

export const recurringBillSeed: RecurringBill[] = [
  {
    id: "rent",
    name: "Rent",
    category: "Housing",
    dueDate: `${getCurrentMonthKey()}-01`,
    cadence: "monthly",
    expectedAmount: 1900,
    isPaid: false,
    autopay: false,
  },
  {
    id: "internet",
    name: "Internet",
    category: "Utilities",
    dueDate: `${getCurrentMonthKey()}-10`,
    cadence: "monthly",
    expectedAmount: 70,
    isPaid: false,
    autopay: true,
  },
  {
    id: "phone",
    name: "Phone",
    category: "Utilities",
    dueDate: `${getCurrentMonthKey()}-18`,
    cadence: "monthly",
    expectedAmount: 85,
    isPaid: false,
    autopay: true,
  },
  {
    id: "streaming",
    name: "Streaming",
    category: "Subscriptions",
    dueDate: `${getCurrentMonthKey()}-22`,
    cadence: "monthly",
    expectedAmount: 25,
    isPaid: false,
    autopay: true,
  },
];

export const debtSeed: Debt[] = [
  {
    id: "student-loans",
    name: "Student Loans",
    lender: "Federal / private loan balance",
    balance: 0,
    payment: 0,
    rate: 5.5,
    accent: "bg-rose-300",
  },
  {
    id: "credit-card",
    name: "Credit Card",
    lender: "Revolving debt",
    balance: 0,
    payment: 0,
    rate: 22.0,
    accent: "bg-amber-300",
  },
];

export const actionSeed: Goal[] = [
  {
    id: "check-pnc-balance",
    title: "Check PNC balance",
    category: "Accounts",
    cadence: "Weekly",
    amount: 5000,
    status: "Target",
  },
  {
    id: "move-excess-cash",
    title: "Move excess cash to Money Market / HYS",
    category: "Savings",
    cadence: "Monthly",
    amount: 300,
    status: "Review",
  },
  {
    id: "fund-roth-ira",
    title: "Fund Roth IRA",
    category: "Investing",
    cadence: "Monthly",
    amount: 625,
    status: "Contribution",
  },
  {
    id: "review-brokerage",
    title: "Review Brokerage allocation",
    category: "Investing",
    cadence: "Monthly",
    amount: 250,
    status: "Optional",
  },
];

export const retirementSeed: RetirementPlan = {
  currentAge: 30,
  targetAge: 65,
  targetPortfolio: 1200000,
  annualReturn: 6,
};

export const investmentContributionSeed: Record<string, number> = {
  "roth-ira": 625,
  brokerage: 250,
};

export const contributionReturnSeed: Record<string, number> = {
  "money-market-hys": 3,
  "roth-ira": 6,
  brokerage: 6,
};

export const DEFAULT_MONTHLY_INVESTING = Object.values(
  investmentContributionSeed,
).reduce((total, amount) => total + amount, 0);

export const STORAGE_KEY = "ian-capital-budget-state-v1";
export const DEFAULT_BRAND_NAME = "Crow's Nest";
export const DEFAULT_DASHBOARD_TITLE = "Portfolio Lookout";
export const DEFAULT_MONTHLY_INCOME = 6150;

export const createMonthlyActualFromPlan = (
  month = getCurrentMonthKey(),
): MonthlyActual => ({
  month,
  income: DEFAULT_MONTHLY_INCOME,
  budgetActuals: budgetSeed.reduce<Record<string, number>>((next, budget) => {
    next[budget.id] = -budget.amount;
    return next;
  }, {}),
  transfers: 0,
  debtPayments: -debtSeed.reduce((total, debt) => total + debt.payment, 0),
  contributions: -DEFAULT_MONTHLY_INVESTING,
});

export const createNetWorthSnapshot = (
  date = getCurrentDateKey(),
  accounts = accountSeed,
  debts = debtSeed,
): NetWorthSnapshot => ({
  date,
  accountBalances: accounts.reduce<Record<string, number>>((next, account) => {
    next[account.id] = account.balance;
    return next;
  }, {}),
  debtBalances: debts.reduce<Record<string, number>>((next, debt) => {
    next[debt.id] = debt.balance;
    return next;
  }, {}),
});

export const colorOptions = [
  "bg-emerald-400",
  "bg-sky-400",
  "bg-violet-400",
  "bg-amber-300",
  "bg-cyan-300",
  "bg-rose-300",
];

export const colorForIndex = (index: number) =>
  colorOptions[index % colorOptions.length];
