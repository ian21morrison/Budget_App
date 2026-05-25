import type { Account, Budget, Debt, Goal, RetirementPlan } from "@/types";

export const navItems = [
  "Overview",
  "Budget",
  "Accounts",
  "Debt",
  "Retirement",
  "Goals",
];

export const accountSeed: Account[] = [
  {
    id: "money-market-hys",
    name: "Money Market / HYS",
    institution: "Emergency fund + cash reserve",
    balance: 15000,
    type: "cash",
    accent: "bg-emerald-400",
  },
  {
    id: "roth-ira",
    name: "Roth IRA",
    institution: "Retirement investing",
    balance: 17400,
    type: "invested",
    accent: "bg-violet-400",
  },
  {
    id: "pnc-checking",
    name: "PNC Checking",
    institution: "Operating cash",
    balance: 5000,
    type: "cash",
    accent: "bg-sky-400",
  },
  {
    id: "brokerage",
    name: "Brokerage",
    institution: "Taxable investing",
    balance: 3000,
    type: "invested",
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
export const DEFAULT_BRAND_NAME = "Ian Capital";
export const DEFAULT_DASHBOARD_TITLE = "Interactive budgeting tool";
export const DEFAULT_MONTHLY_INCOME = 6150;

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
