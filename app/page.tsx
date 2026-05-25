"use client";

import { type FocusEvent, useEffect, useMemo, useState } from "react";

const navItems = ["Overview", "Budget", "Accounts", "Debt", "Retirement", "Goals"];

type AccountType = "cash" | "invested";

type Account = {
  id: string;
  name: string;
  institution: string;
  balance: number;
  type: AccountType;
  accent: string;
};

const accountSeed: Account[] = [
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

const budgetSeed = [
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

const debtSeed = [
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

const actionSeed = [
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

const retirementSeed = {
  currentAge: 30,
  targetAge: 65,
  targetPortfolio: 1200000,
  annualReturn: 6,
};

const investmentContributionSeed: Record<string, number> = {
  "roth-ira": 625,
  brokerage: 250,
};
const contributionReturnSeed: Record<string, number> = {
  "money-market-hys": 3,
  "roth-ira": 6,
  brokerage: 6,
};
const DEFAULT_MONTHLY_INVESTING = Object.values(investmentContributionSeed).reduce(
  (total, amount) => total + amount,
  0,
);

const STORAGE_KEY = "ian-capital-budget-state-v1";
const DEFAULT_BRAND_NAME = "Ian Capital";
const DEFAULT_DASHBOARD_TITLE = "Interactive budgeting tool";
const colorOptions = [
  "bg-emerald-400",
  "bg-sky-400",
  "bg-violet-400",
  "bg-amber-300",
  "bg-cyan-300",
  "bg-rose-300",
];

const colorForIndex = (index: number) => colorOptions[index % colorOptions.length];

type Budget = (typeof budgetSeed)[number];
type Debt = (typeof debtSeed)[number];
type Goal = (typeof actionSeed)[number];
type RetirementPlan = typeof retirementSeed;
type InvestmentContributions = Record<string, number>;
type ContributionReturns = Record<string, number>;

type SavedBudgetState = {
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

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const formatPercent = (value: number) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  }).format(value);

const scrollToSection = (id: string) => {
  document.getElementById(id)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
};

const createId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const slugFromText = (prefix: string, text: string) =>
  `${prefix}-${text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const textValue = (value: unknown, fallback: string) =>
  typeof value === "string" ? value : fallback;

const numberValue = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value)
    ? value
    : typeof value === "string" && Number.isFinite(Number(value))
      ? Number(value)
      : fallback;

const accountTypeValue = (value: unknown, fallback: AccountType): AccountType => {
  const normalizedValue = typeof value === "string" ? value.toLowerCase() : value;

  return normalizedValue === "cash" || normalizedValue === "invested"
    ? normalizedValue
    : fallback;
};

const inferAccountType = (account: Record<string, unknown>, fallback: Account) => {
  const name = textValue(account.name, fallback.name).toLowerCase();
  const institution = textValue(account.institution, fallback.institution).toLowerCase();

  if (
    name.includes("hys") ||
    name.includes("checking") ||
    name.includes("cash") ||
    institution.includes("cash") ||
    institution.includes("reserve")
  ) {
    return "cash";
  }

  return fallback.type;
};

const defaultReturnForAccount = (account: Account, investedReturn: number) =>
  contributionReturnSeed[account.id] ?? (account.type === "cash" ? 3 : investedReturn);

const getInitials = (value: string) => {
  const initials = value
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || "BT";
};

const normalizeAccounts = (savedAccounts: unknown): Account[] => {
  if (!Array.isArray(savedAccounts)) {
    return accountSeed;
  }

  return savedAccounts.filter(isRecord).map((account, index) => {
    const fallback = accountSeed[index % accountSeed.length];
    const name = textValue(account.name, fallback.name);

    return {
      id: textValue(account.id, slugFromText("account", name)),
      name,
      institution: textValue(account.institution, fallback.institution),
      balance: numberValue(account.balance, fallback.balance),
      type: accountTypeValue(account.type, inferAccountType(account, fallback)),
      accent: textValue(account.accent, fallback.accent),
    };
  });
};

const normalizeBudgets = (savedBudgets: unknown): Budget[] => {
  if (!Array.isArray(savedBudgets)) {
    return budgetSeed;
  }

  return savedBudgets.filter(isRecord).map((budget, index) => {
    const fallback = budgetSeed[index % budgetSeed.length];
    const label = textValue(budget.label, fallback.label);

    return {
      id: textValue(budget.id ?? budget.key, slugFromText("budget", label)),
      label,
      amount: numberValue(budget.amount, fallback.amount),
      detail: textValue(budget.detail, fallback.detail),
      color: textValue(budget.color, fallback.color),
    };
  });
};

const normalizeDebts = (savedDebts: unknown): Debt[] => {
  if (!Array.isArray(savedDebts)) {
    return debtSeed;
  }

  return savedDebts.filter(isRecord).map((debt, index) => {
    const fallback = debtSeed[index % debtSeed.length];
    const name = textValue(debt.name, fallback.name);

    return {
      id: textValue(debt.id, slugFromText("debt", name)),
      name,
      lender: textValue(debt.lender, fallback.lender),
      balance: numberValue(debt.balance, fallback.balance),
      payment: numberValue(debt.payment, fallback.payment),
      rate: numberValue(debt.rate, fallback.rate),
      accent: textValue(debt.accent, fallback.accent),
    };
  });
};

const normalizeGoals = (savedGoals: unknown): Goal[] => {
  if (!Array.isArray(savedGoals)) {
    return actionSeed;
  }

  return savedGoals.filter(isRecord).map((goal, index) => {
    const fallback = actionSeed[index % actionSeed.length];
    const title = textValue(goal.title, fallback.title);

    return {
      id: textValue(goal.id, slugFromText("goal", title)),
      title,
      category: textValue(goal.category, fallback.category),
      cadence: textValue(goal.cadence, fallback.cadence),
      amount: numberValue(goal.amount, fallback.amount),
      status: textValue(goal.status, fallback.status),
    };
  });
};

const normalizeRetirementPlan = (savedPlan: unknown): RetirementPlan => {
  if (!isRecord(savedPlan)) {
    return retirementSeed;
  }

  return {
    currentAge: numberValue(savedPlan.currentAge, retirementSeed.currentAge),
    targetAge: numberValue(savedPlan.targetAge, retirementSeed.targetAge),
    targetPortfolio: numberValue(
      savedPlan.targetPortfolio,
      retirementSeed.targetPortfolio,
    ),
    annualReturn: numberValue(savedPlan.annualReturn, retirementSeed.annualReturn),
  };
};

const normalizeInvestmentContributions = (
  savedContributions: unknown,
  accounts: Account[],
  savedPlan: unknown,
): InvestmentContributions => {
  const migratedMonthlyContribution = isRecord(savedPlan)
    ? numberValue(savedPlan.monthlyContribution, 0)
    : 0;
  const investedAccounts = accounts.filter((account) => account.type === "invested");
  const fallbackTotal =
    investedAccounts.length > 0
      ? migratedMonthlyContribution || DEFAULT_MONTHLY_INVESTING
      : 0;

  if (isRecord(savedContributions)) {
    return accounts.reduce<InvestmentContributions>((next, account) => {
      if (account.id in savedContributions) {
        next[account.id] = numberValue(savedContributions[account.id], 0);
      }

      return next;
    }, {});
  }

  return investedAccounts.reduce<InvestmentContributions>((next, account, index) => {
    next[account.id] =
      investmentContributionSeed[account.id] ??
      (index === 0 ? fallbackTotal : 0);
    return next;
  }, {});
};

const normalizeContributionReturns = (
  savedReturns: unknown,
  accounts: Account[],
  retirementPlan: RetirementPlan,
): ContributionReturns =>
  accounts.reduce<ContributionReturns>((next, account) => {
    next[account.id] = isRecord(savedReturns)
      ? numberValue(
          savedReturns[account.id],
          defaultReturnForAccount(account, retirementPlan.annualReturn),
        )
      : defaultReturnForAccount(account, retirementPlan.annualReturn);

    return next;
  }, {});

const loadSavedBudgetState = (): SavedBudgetState | null => {
  try {
    const rawState = window.localStorage.getItem(STORAGE_KEY);

    if (!rawState) {
      return null;
    }

    const parsedState = JSON.parse(rawState) as Partial<SavedBudgetState>;

    const accounts = normalizeAccounts(parsedState.accounts);
    const retirementPlan = normalizeRetirementPlan(parsedState.retirementPlan);
    const investmentContributions = normalizeInvestmentContributions(
      parsedState.investmentContributions,
      accounts,
      parsedState.retirementPlan,
    );

    return {
      brandName: textValue(parsedState.brandName, DEFAULT_BRAND_NAME),
      dashboardTitle: textValue(
        parsedState.dashboardTitle,
        DEFAULT_DASHBOARD_TITLE,
      ),
      accounts,
      budgets: normalizeBudgets(parsedState.budgets),
      debts: normalizeDebts(parsedState.debts),
      goals: normalizeGoals(parsedState.goals),
      monthlyIncome:
        typeof parsedState.monthlyIncome === "number"
          ? parsedState.monthlyIncome
          : 6150,
      retirementPlan,
      investmentContributions,
      contributionReturns: normalizeContributionReturns(
        parsedState.contributionReturns,
        accounts,
        retirementPlan,
      ),
      completedActions: Array.isArray(parsedState.completedActions)
        ? parsedState.completedActions.filter(
            (action): action is string => typeof action === "string",
          )
        : [],
    };
  } catch {
    return null;
  }
};

const persistBudgetState = (state: SavedBudgetState) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Local storage can be unavailable in private windows or restricted contexts.
  }
};

export default function Home() {
  const [activeNav, setActiveNav] = useState(navItems[0]);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [accounts, setAccounts] = useState(accountSeed);
  const [budgets, setBudgets] = useState(budgetSeed);
  const [debts, setDebts] = useState(debtSeed);
  const [goals, setGoals] = useState(actionSeed);
  const [brandName, setBrandName] = useState(DEFAULT_BRAND_NAME);
  const [dashboardTitle, setDashboardTitle] = useState(DEFAULT_DASHBOARD_TITLE);
  const [monthlyIncome, setMonthlyIncome] = useState(6150);
  const [retirementPlan, setRetirementPlan] = useState(retirementSeed);
  const [investmentContributions, setInvestmentContributions] = useState(
    investmentContributionSeed,
  );
  const [contributionReturns, setContributionReturns] = useState(
    contributionReturnSeed,
  );
  const [completedActions, setCompletedActions] = useState<string[]>([]);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [openColorPicker, setOpenColorPicker] = useState<string | null>(null);
  const [showContributionAccountPicker, setShowContributionAccountPicker] =
    useState(false);
  const [selectedContributionAccountId, setSelectedContributionAccountId] =
    useState("");

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      const savedState = loadSavedBudgetState();

      if (savedState) {
        setBrandName(savedState.brandName);
        setDashboardTitle(savedState.dashboardTitle);
        setAccounts(savedState.accounts);
        setBudgets(savedState.budgets);
        setDebts(savedState.debts);
        setGoals(savedState.goals);
        setMonthlyIncome(savedState.monthlyIncome);
        setRetirementPlan(savedState.retirementPlan);
        setInvestmentContributions(savedState.investmentContributions);
        setContributionReturns(savedState.contributionReturns);
        setCompletedActions(savedState.completedActions);
        setLastSavedAt(new Date());
      }
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, []);

  const saveState = (nextState: Partial<SavedBudgetState>) => {
    const stateToSave: SavedBudgetState = {
      brandName,
      dashboardTitle,
      accounts,
      budgets,
      debts,
      goals,
      monthlyIncome,
      retirementPlan,
      investmentContributions,
      contributionReturns,
      completedActions,
      ...nextState,
    };

    persistBudgetState(stateToSave);
    setLastSavedAt(new Date());
  };

  const totals = useMemo(() => {
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
  }, [accounts, budgets, debts, investmentContributions, monthlyIncome]);

  const kpis = [
    {
      label: "Net Worth",
      value: formatCurrency(totals.netWorth),
      detail: "Live account total",
      tone: "emerald",
    },
    {
      label: "Total Debt",
      value: formatCurrency(totals.debt),
      detail: `${formatCurrency(totals.debtPayments)}/mo payments`,
      tone: "sky",
    },
    {
      label: "Monthly Surplus",
      value: formatCurrency(totals.monthlySurplus),
      detail: `${formatCurrency(monthlyIncome)} income`,
      tone: totals.monthlySurplus >= 0 ? "emerald" : "rose",
    },
    {
      label: "Cash vs Invested",
      value: `${Math.round((totals.cash / Math.max(totals.assets, 1)) * 100)}% cash`,
      detail: `${formatCurrency(totals.cash)} cash / ${formatCurrency(
        totals.assets,
      )} assets`,
      tone: "violet",
    },
  ];

  const toneStyles: Record<string, string> = {
    emerald: "bg-emerald-400/10 text-emerald-300",
    sky: "bg-sky-400/10 text-sky-300",
    rose: "bg-rose-400/10 text-rose-300",
    violet: "bg-violet-400/10 text-violet-300",
  };

  const contributionAccounts = useMemo(
    () =>
      accounts.filter((account) =>
        Object.prototype.hasOwnProperty.call(investmentContributions, account.id),
      ),
    [accounts, investmentContributions],
  );

  const availableContributionAccounts = useMemo(
    () =>
      accounts.filter(
        (account) =>
          !Object.prototype.hasOwnProperty.call(
            investmentContributions,
            account.id,
          ),
      ),
    [accounts, investmentContributions],
  );

  const monthlyContributionWeightedReturn = useMemo(() => {
    if (totals.monthlyInvestment <= 0) {
      return 0;
    }

    return contributionAccounts.reduce((total, account) => {
      const monthlyContribution = investmentContributions[account.id] ?? 0;
      const accountReturn =
        contributionReturns[account.id] ??
        defaultReturnForAccount(account, retirementPlan.annualReturn);

      return total + (monthlyContribution / totals.monthlyInvestment) * accountReturn;
    }, 0);
  }, [
    contributionAccounts,
    contributionReturns,
    investmentContributions,
    retirementPlan.annualReturn,
    totals.monthlyInvestment,
  ]);

  const incomeUsedPercent = Math.round(
    ((totals.monthlyBudget + totals.debtPayments + totals.monthlyInvestment) /
      Math.max(monthlyIncome, 1)) *
      100,
  );

  const retirementProjection = useMemo(() => {
    const projectionAccounts = contributionAccounts.map((account) => ({
      id: account.id,
      name: account.name,
      accent: account.accent,
      balance: account.balance,
      monthlyContribution: investmentContributions[account.id] ?? 0,
      // Account-level expected returns are edited in the Accounts section.
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
        (total, account) =>
          total + account.monthlyContribution + account.balance,
        0,
      );

      return projectionAccounts.reduce((total, account) => {
        const contributionShare =
          projectionAccounts.length === 0
            ? 0
            : allocationBase > 0
              ? ((account.monthlyContribution + account.balance) /
                  allocationBase)
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
  }, [
    contributionAccounts,
    contributionReturns,
    investmentContributions,
    retirementPlan,
    totals.contributionBalance,
    totals.monthlyInvestment,
  ]);

  const handleNavClick = (item: string) => {
    setActiveNav(item);
    scrollToSection(item.toLowerCase());
  };

  const updateBrandName = (value: string) => {
    setBrandName(value);
    saveState({ brandName: value });
  };

  const updateDashboardTitle = (value: string) => {
    setDashboardTitle(value);
    saveState({ dashboardTitle: value });
  };

  const updateAccount = (
    accountId: string,
    field: "name" | "institution" | "balance" | "type" | "accent",
    value: string | number,
  ) => {
    const nextAccounts = accounts.map((account) =>
      account.id === accountId ? { ...account, [field]: value } : account,
    );

    setAccounts(nextAccounts);
    saveState({
      accounts: nextAccounts,
      investmentContributions,
      contributionReturns,
    });
  };

  const addAccount = () => {
    const accountId = createId("account");
    const nextAccounts: Account[] = [
      ...accounts,
      {
        id: accountId,
        name: "New account",
        institution: "Account notes",
        balance: 0,
        type: "cash",
        accent: colorForIndex(accounts.length),
      },
    ];
    const nextContributionReturns = {
      ...contributionReturns,
      [accountId]: 3,
    };

    setAccounts(nextAccounts);
    setContributionReturns(nextContributionReturns);
    saveState({
      accounts: nextAccounts,
      contributionReturns: nextContributionReturns,
    });
  };

  const addInvestmentAccount = () => {
    const accountId = createId("account");
    const nextAccounts: Account[] = [
      ...accounts,
      {
        id: accountId,
        name: "New investment",
        institution: "Investment account notes",
        balance: 0,
        type: "invested",
        accent: colorForIndex(accounts.length),
      },
    ];
    const nextInvestmentContributions = {
      ...investmentContributions,
      [accountId]: 0,
    };
    const newAccount = nextAccounts[nextAccounts.length - 1];
    const nextContributionReturns = {
      ...contributionReturns,
      [accountId]: defaultReturnForAccount(
        newAccount,
        retirementPlan.annualReturn,
      ),
    };

    setAccounts(nextAccounts);
    setInvestmentContributions(nextInvestmentContributions);
    setContributionReturns(nextContributionReturns);
    saveState({
      accounts: nextAccounts,
      investmentContributions: nextInvestmentContributions,
      contributionReturns: nextContributionReturns,
    });
  };

  const deleteAccount = (accountId: string) => {
    const nextAccounts = accounts.filter((account) => account.id !== accountId);
    const nextInvestmentContributions = { ...investmentContributions };
    const nextContributionReturns = { ...contributionReturns };
    delete nextInvestmentContributions[accountId];
    delete nextContributionReturns[accountId];

    setAccounts(nextAccounts);
    setInvestmentContributions(nextInvestmentContributions);
    setContributionReturns(nextContributionReturns);
    saveState({
      accounts: nextAccounts,
      investmentContributions: nextInvestmentContributions,
      contributionReturns: nextContributionReturns,
    });
  };

  const updateBudget = (
    budgetId: string,
    field: "label" | "detail" | "amount" | "color",
    value: string | number,
  ) => {
    const nextBudgets = budgets.map((budget) =>
      budget.id === budgetId ? { ...budget, [field]: value } : budget,
    );

    setBudgets(nextBudgets);
    saveState({ budgets: nextBudgets });
  };

  const addBudget = () => {
    const nextBudgets = [
      ...budgets,
      {
        id: createId("budget"),
        label: "New budget item",
        amount: 0,
        detail: "What this covers",
        color: colorForIndex(budgets.length),
      },
    ];

    setBudgets(nextBudgets);
    saveState({ budgets: nextBudgets });
  };

  const deleteBudget = (budgetId: string) => {
    const nextBudgets = budgets.filter((budget) => budget.id !== budgetId);

    setBudgets(nextBudgets);
    saveState({ budgets: nextBudgets });
  };

  const updateDebt = (
    debtId: string,
    field: "name" | "lender" | "balance" | "payment" | "rate" | "accent",
    value: string | number,
  ) => {
    const nextDebts = debts.map((debt) =>
      debt.id === debtId ? { ...debt, [field]: value } : debt,
    );

    setDebts(nextDebts);
    saveState({ debts: nextDebts });
  };

  const addDebt = () => {
    const nextDebts = [
      ...debts,
      {
        id: createId("debt"),
        name: "New debt",
        lender: "Debt notes",
        balance: 0,
        payment: 0,
        rate: 0,
        accent: colorForIndex(debts.length),
      },
    ];

    setDebts(nextDebts);
    saveState({ debts: nextDebts });
  };

  const deleteDebt = (debtId: string) => {
    const nextDebts = debts.filter((debt) => debt.id !== debtId);

    setDebts(nextDebts);
    saveState({ debts: nextDebts });
  };

  const updateMonthlyIncome = (value: number) => {
    setMonthlyIncome(value);
    saveState({ monthlyIncome: value });
  };

  const updateRetirementPlan = (
    field: keyof RetirementPlan,
    value: number,
  ) => {
    const nextRetirementPlan = {
      ...retirementPlan,
      [field]: value,
    };

    setRetirementPlan(nextRetirementPlan);
    saveState({ retirementPlan: nextRetirementPlan });
  };

  const resetRetirementPlan = () => {
    setRetirementPlan(retirementSeed);
    saveState({ retirementPlan: retirementSeed });
  };

  const updateInvestmentContribution = (accountId: string, value: number) => {
    const nextInvestmentContributions = {
      ...investmentContributions,
      [accountId]: value,
    };

    setInvestmentContributions(nextInvestmentContributions);
    saveState({ investmentContributions: nextInvestmentContributions });
  };

  const updateContributionReturn = (accountId: string, value: number) => {
    const nextContributionReturns = {
      ...contributionReturns,
      [accountId]: value,
    };

    setContributionReturns(nextContributionReturns);
    saveState({ contributionReturns: nextContributionReturns });
  };

  const addExistingContributionAccount = () => {
    if (!selectedContributionAccountId) {
      return;
    }

    const account = accounts.find(
      (item) => item.id === selectedContributionAccountId,
    );

    const nextInvestmentContributions = {
      ...investmentContributions,
      [selectedContributionAccountId]: 0,
    };
    const nextContributionReturns = {
      ...contributionReturns,
      [selectedContributionAccountId]: account
        ? contributionReturns[selectedContributionAccountId] ??
          defaultReturnForAccount(account, retirementPlan.annualReturn)
        : retirementPlan.annualReturn,
    };

    setInvestmentContributions(nextInvestmentContributions);
    setContributionReturns(nextContributionReturns);
    setSelectedContributionAccountId("");
    setShowContributionAccountPicker(false);
    saveState({
      investmentContributions: nextInvestmentContributions,
      contributionReturns: nextContributionReturns,
    });
  };

  const removeContributionAccount = (accountId: string) => {
    const nextInvestmentContributions = { ...investmentContributions };
    delete nextInvestmentContributions[accountId];

    setInvestmentContributions(nextInvestmentContributions);
    saveState({
      investmentContributions: nextInvestmentContributions,
    });
  };

  const resetInvestmentContributions = () => {
    const nextInvestmentContributions = accounts.reduce<InvestmentContributions>(
      (next, account) => {
        if (investmentContributionSeed[account.id] === undefined) {
          return next;
        }

        next[account.id] = investmentContributionSeed[account.id] ?? 0;
        return next;
      },
      {},
    );
    const nextContributionReturns = accounts.reduce<ContributionReturns>(
      (next, account) => {
        next[account.id] =
          contributionReturns[account.id] ??
          defaultReturnForAccount(account, retirementPlan.annualReturn);
        return next;
      },
      {},
    );

    setInvestmentContributions(nextInvestmentContributions);
    setContributionReturns(nextContributionReturns);
    saveState({
      investmentContributions: nextInvestmentContributions,
      contributionReturns: nextContributionReturns,
    });
  };

  const resetAccounts = () => {
    const nextContributionReturns = accountSeed.reduce<ContributionReturns>(
      (next, account) => {
        next[account.id] = defaultReturnForAccount(
          account,
          retirementPlan.annualReturn,
        );
        return next;
      },
      {},
    );

    setAccounts(accountSeed);
    setInvestmentContributions(investmentContributionSeed);
    setContributionReturns(nextContributionReturns);
    saveState({
      accounts: accountSeed,
      investmentContributions: investmentContributionSeed,
      contributionReturns: nextContributionReturns,
    });
  };

  const resetDebts = () => {
    setDebts(debtSeed);
    saveState({ debts: debtSeed });
  };

  const resetBudget = () => {
    setBudgets(budgetSeed);
    setMonthlyIncome(6150);
    saveState({ budgets: budgetSeed, monthlyIncome: 6150 });
  };

  const updateGoal = (
    goalId: string,
    field: "title" | "category" | "cadence" | "amount" | "status",
    value: string | number,
  ) => {
    const nextGoals = goals.map((goal) =>
      goal.id === goalId ? { ...goal, [field]: value } : goal,
    );

    setGoals(nextGoals);
    saveState({ goals: nextGoals });
  };

  const addGoal = () => {
    const nextGoals = [
      ...goals,
      {
        id: createId("goal"),
        title: "New goal",
        category: "Planning",
        cadence: "Monthly",
        amount: 0,
        status: "Open",
      },
    ];

    setGoals(nextGoals);
    saveState({ goals: nextGoals });
  };

  const deleteGoal = (goalId: string) => {
    const nextGoals = goals.filter((goal) => goal.id !== goalId);
    const nextCompletedActions = completedActions.filter((item) => item !== goalId);

    setGoals(nextGoals);
    setCompletedActions(nextCompletedActions);
    saveState({ goals: nextGoals, completedActions: nextCompletedActions });
  };

  const resetGoals = () => {
    setGoals(actionSeed);
    setCompletedActions([]);
    saveState({ goals: actionSeed, completedActions: [] });
  };

  const toggleAction = (goalId: string) => {
    const nextCompletedActions = completedActions.includes(goalId)
      ? completedActions.filter((item) => item !== goalId)
      : [...completedActions, goalId];

    setCompletedActions(nextCompletedActions);
    saveState({ completedActions: nextCompletedActions });
  };

  const exportActions = () => {
    const rows = [
      ["Action", "Category", "Cadence", "Amount", "Status", "Complete"],
      ...goals.map((action) => {
        return [
          action.title,
          action.category,
          action.cadence,
          String(action.amount),
          action.status,
          completedActions.includes(action.id) ? "Yes" : "No",
        ];
      }),
    ];
    const csv = rows
      .map((row) =>
        row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "budget-actions.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderColorPicker = (
    pickerId: string,
    currentColor: string,
    label: string,
    onSelect: (color: string) => void,
    sizeClass = "size-3",
  ) => (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() =>
          setOpenColorPicker((current) => (current === pickerId ? null : pickerId))
        }
        aria-label={`Change ${label} color`}
        className={`${sizeClass} rounded-full border border-white/40 transition hover:ring-2 hover:ring-white/30 ${currentColor}`}
      />
      {openColorPicker === pickerId ? (
        <div className="absolute left-0 top-6 z-30 flex gap-1.5 rounded-lg border border-white/10 bg-neutral-950 p-2 shadow-xl">
          {colorOptions.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => {
                onSelect(color);
                setOpenColorPicker(null);
              }}
              aria-label={`Use ${color.replace("bg-", "")} for ${label}`}
              className={`size-6 rounded-full border transition ${color} ${
                currentColor === color
                  ? "border-white ring-2 ring-white/40"
                  : "border-transparent hover:border-white/70"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );

  const selectNumberInput = (event: FocusEvent<HTMLInputElement>) => {
    event.currentTarget.select();
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-neutral-950/95 px-6 py-6 lg:flex lg:flex-col">
          <div className="mb-5">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-emerald-400 text-lg font-black text-neutral-950">
                {getInitials(brandName)}
              </div>
              <div className="min-w-0">
                <p className="text-sm text-neutral-400">Budget Tool</p>
                <label className="block">
                  <span className="sr-only">Brand name</span>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(event) => updateBrandName(event.target.value)}
                    className="w-full rounded-md border border-transparent bg-transparent px-1 py-0.5 text-lg font-semibold tracking-tight text-neutral-100 outline-none transition hover:border-white/10 hover:bg-white/[0.03] focus:border-emerald-400/60 focus:bg-neutral-950/60"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="mb-6 rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm font-medium">Cash cushion</p>
            <p className="mt-1 text-2xl font-semibold">
              {formatCurrency(totals.cash)}
            </p>
            <div className="mt-4 h-2 rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-emerald-400"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(8, (totals.cash / Math.max(totals.assets, 1)) * 100),
                  )}%`,
                }}
              />
            </div>
            <p className="mt-3 text-xs text-neutral-500">
              Accounts marked as cash.
            </p>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => handleNavClick(item)}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition ${
                  item === activeNav
                    ? "bg-white text-neutral-950"
                    : "text-neutral-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span>{item}</span>
                {item === activeNav ? (
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                ) : null}
              </button>
            ))}
          </nav>

        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b border-white/10 bg-neutral-950/85 px-4 py-4 backdrop-blur md:px-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <label className="block">
                  <span className="sr-only">Brand name</span>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(event) => updateBrandName(event.target.value)}
                    className="w-full rounded-md border border-transparent bg-transparent px-1 py-0.5 text-sm text-neutral-400 outline-none transition hover:border-white/10 hover:bg-white/[0.03] focus:border-emerald-400/60 focus:bg-neutral-950/60 focus:text-neutral-200"
                  />
                </label>
                <label className="block">
                  <span className="sr-only">Dashboard title</span>
                  <input
                    type="text"
                    value={dashboardTitle}
                    size={Math.max(dashboardTitle.length, 24)}
                    onChange={(event) =>
                      updateDashboardTitle(event.target.value)
                    }
                    className="max-w-full rounded-md border border-transparent bg-transparent px-1 py-0.5 text-2xl font-semibold tracking-tight text-neutral-100 outline-none transition hover:border-white/10 hover:bg-white/[0.03] focus:border-emerald-400/60 focus:bg-neutral-950/60 md:text-3xl"
                  />
                </label>
                <p className="mt-1 text-sm text-neutral-500">
                  {lastSavedAt
                    ? `Saved locally at ${lastSavedAt.toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}`
                    : "Changes save automatically on this device."}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex overflow-x-auto rounded-lg border border-white/10 bg-white/[0.03] p-1 lg:hidden">
                  {navItems.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleNavClick(item)}
                      className={`whitespace-nowrap rounded-md px-3 py-2 text-sm ${
                        item === activeNav
                          ? "bg-white text-neutral-950"
                          : "text-neutral-400"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </header>

          <div className="px-4 py-5 md:px-6 lg:px-8">
            <section
              id="overview"
              className="scroll-mt-24 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
            >
              {kpis.map((kpi) => (
                <article
                  key={kpi.label}
                  className="rounded-lg border border-white/10 bg-white/[0.035] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm text-neutral-400">{kpi.label}</p>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${toneStyles[kpi.tone]}`}
                    >
                      {kpi.detail}
                    </span>
                  </div>
                  <p className="mt-5 text-3xl font-semibold tracking-tight">
                    {kpi.value}
                  </p>
                </article>
              ))}
            </section>

            <section className="mt-4 space-y-4">
              <article
                id="budget"
                className="scroll-mt-24 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.035]"
              >
                <div className="flex flex-col gap-4 border-b border-white/10 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">Budget</h3>
                    <p className="mt-1 text-sm text-neutral-500">
                      Monthly spending plan, contributions, debt payments, and surplus.
                    </p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2">
                      <p className="text-xs text-neutral-500">Income</p>
                      <p className="mt-1 text-lg font-semibold">
                        {formatCurrency(monthlyIncome)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2">
                      <p className="text-xs text-neutral-500">Budgeted</p>
                      <p className="mt-1 text-lg font-semibold">
                        {formatCurrency(totals.monthlyBudget)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2">
                      <p className="text-xs text-neutral-500">Contributions</p>
                      <p className="mt-1 text-lg font-semibold">
                        {formatCurrency(totals.monthlyInvestment)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2">
                      <p className="text-xs text-neutral-500">Surplus</p>
                      <p
                        className={`mt-1 text-lg font-semibold ${
                          totals.monthlySurplus >= 0
                            ? "text-emerald-300"
                            : "text-rose-300"
                        }`}
                      >
                        {formatCurrency(totals.monthlySurplus)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 p-5 xl:grid-cols-[320px_minmax(0,1fr)]">
                  <div className="space-y-4">
                    <label className="block text-sm">
                      <span className="mb-2 flex items-center justify-between">
                        <span className="text-neutral-300">Monthly income</span>
                        <span className="font-medium">
                          {formatCurrency(monthlyIncome)}
                        </span>
                      </span>
                      <input
                        type="number"
                        onFocus={selectNumberInput}
                        min="0"
                        step="100"
                        value={monthlyIncome}
                        onChange={(event) =>
                          updateMonthlyIncome(Number(event.target.value))
                        }
                        className="w-full rounded-md border border-white/10 bg-neutral-950/60 px-3 py-3 font-semibold text-neutral-100 outline-none focus:border-emerald-400/60"
                      />
                    </label>

                    <div className="rounded-lg border border-white/10 bg-neutral-950/45 p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-400">Income used</span>
                        <span className="font-semibold text-neutral-100">
                          {incomeUsedPercent}%
                        </span>
                      </div>
                      <div className="mt-3 h-3 rounded-full bg-white/10">
                        <div
                          className={`h-3 rounded-full ${
                            incomeUsedPercent > 100
                              ? "bg-rose-300"
                              : "bg-emerald-400"
                          }`}
                          style={{ width: `${Math.min(100, incomeUsedPercent)}%` }}
                        />
                      </div>
                      <p className="mt-3 text-xs text-neutral-500">
                        Includes budget, debt payments, and monthly contributions.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingBudget((current) => !current)}
                        className="rounded-md bg-emerald-400 px-3 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-emerald-300"
                      >
                        {isEditingBudget ? "Done editing" : "Edit budget"}
                      </button>
                      {isEditingBudget ? (
                        <>
                          <button
                            type="button"
                            onClick={addBudget}
                            className="rounded-md border border-emerald-300/30 px-3 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-300/10"
                          >
                            Add item
                          </button>
                          <button
                            type="button"
                            onClick={resetBudget}
                            className="rounded-md border border-white/10 px-3 py-2 text-sm text-neutral-300 transition hover:bg-white/5 hover:text-white"
                          >
                            Reset
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-3 lg:grid-cols-2">
                    {budgets.map((budget) => {
                      const percent = Math.round(
                        (budget.amount / Math.max(totals.monthlyBudget, 1)) *
                          100,
                      );

                      return (
                        <div
                          key={budget.id}
                          className="rounded-lg border border-white/10 bg-neutral-950/45 p-4"
                        >
                          <div className="mb-3 flex items-start justify-between gap-4">
                            <div className="flex min-w-0 flex-1 gap-3">
                              <div className="pt-1">
                                {renderColorPicker(
                                  `budget-${budget.id}`,
                                  budget.color,
                                  budget.label,
                                  (color) => updateBudget(budget.id, "color", color),
                                  "size-3",
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                {isEditingBudget ? (
                                  <div className="grid gap-2">
                                    <label className="block">
                                      <span className="sr-only">Budget title</span>
                                      <input
                                        type="text"
                                        value={budget.label}
                                        onChange={(event) =>
                                          updateBudget(
                                            budget.id,
                                            "label",
                                            event.target.value,
                                          )
                                        }
                                        className="w-full rounded-md border border-white/10 bg-neutral-950/60 px-2 py-2 text-sm font-medium text-neutral-100 outline-none focus:border-emerald-400/60"
                                      />
                                    </label>
                                    <label className="block">
                                      <span className="sr-only">Budget notes</span>
                                      <input
                                        type="text"
                                        value={budget.detail}
                                        onChange={(event) =>
                                          updateBudget(
                                            budget.id,
                                            "detail",
                                            event.target.value,
                                          )
                                        }
                                        className="w-full rounded-md border border-white/10 bg-neutral-950/60 px-2 py-2 text-xs text-neutral-300 outline-none focus:border-emerald-400/60"
                                      />
                                    </label>
                                  </div>
                                ) : (
                                  <>
                                    <p className="font-medium text-neutral-100">
                                      {budget.label}
                                    </p>
                                    <p className="mt-1 text-sm text-neutral-500">
                                      {budget.detail}
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-lg font-semibold text-neutral-100">
                                {formatCurrency(budget.amount)}
                              </p>
                              <p className="text-xs text-neutral-500">
                                {percent}% of budget
                              </p>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="h-3 rounded-full bg-white/10">
                              <div
                                className={`h-3 rounded-full ${budget.color}`}
                                style={{ width: `${Math.min(100, percent)}%` }}
                              />
                            </div>

                            {isEditingBudget ? (
                              <div className="grid gap-3 sm:grid-cols-[1fr_150px_auto] sm:items-center">
                                <input
                                  type="range"
                                  min="0"
                                  max={budget.id === "housing" ? 4000 : 1600}
                                  step="25"
                                  value={budget.amount}
                                  onChange={(event) =>
                                    updateBudget(
                                      budget.id,
                                      "amount",
                                      Number(event.target.value),
                                    )
                                  }
                                  className="w-full accent-emerald-400"
                                />
                                <label className="flex items-center rounded-md border border-white/10 bg-neutral-950/60 px-2 focus-within:border-emerald-400/60">
                                  <span className="text-sm text-neutral-500">
                                    $
                                  </span>
                                  <input
                                    type="number"
                                    onFocus={selectNumberInput}
                                    min="0"
                                    step="25"
                                    value={budget.amount}
                                    onChange={(event) =>
                                      updateBudget(
                                        budget.id,
                                        "amount",
                                        Number(event.target.value),
                                      )
                                    }
                                    aria-label={`${budget.label} budget amount`}
                                    className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm font-semibold text-neutral-100 outline-none"
                                  />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => deleteBudget(budget.id)}
                                  className="w-fit rounded-md border border-rose-300/20 px-3 py-2 text-sm text-rose-200 transition hover:bg-rose-300/10"
                                >
                                  Delete
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="xl:col-span-2 rounded-lg border border-white/10 bg-neutral-950/45 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h4 className="text-base font-semibold">
                          Monthly contributions
                        </h4>
                        <p className="mt-1 text-sm text-neutral-500">
                          Contributions that reduce monthly surplus and feed the
                          retirement projection.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {availableContributionAccounts.length > 0 &&
                        !showContributionAccountPicker ? (
                          <button
                            type="button"
                            onClick={() => setShowContributionAccountPicker(true)}
                            className="w-fit rounded-md border border-emerald-300/30 px-3 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-300/10"
                          >
                            Add existing
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={addInvestmentAccount}
                          className="w-fit rounded-md border border-emerald-300/30 px-3 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-300/10"
                        >
                          New account
                        </button>
                        <button
                          type="button"
                          onClick={resetInvestmentContributions}
                          className="w-fit rounded-md border border-white/10 px-3 py-2 text-sm text-neutral-300 transition hover:bg-white/5 hover:text-white"
                        >
                          Reset
                        </button>
                      </div>
                    </div>

                    {showContributionAccountPicker ? (
                      <div className="mt-4 flex flex-col gap-2 rounded-lg border border-white/10 bg-neutral-950/60 p-3 sm:flex-row sm:items-center">
                        <label className="sr-only" htmlFor="contribution-account">
                          Existing account
                        </label>
                        <select
                          id="contribution-account"
                          value={selectedContributionAccountId}
                          onChange={(event) =>
                            setSelectedContributionAccountId(event.target.value)
                          }
                          className="min-w-0 flex-1 rounded-md border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-emerald-400/60"
                        >
                          <option value="">Select an account</option>
                          {availableContributionAccounts.map((account) => (
                            <option key={account.id} value={account.id}>
                              {account.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={addExistingContributionAccount}
                          disabled={!selectedContributionAccountId}
                          className="w-fit rounded-md bg-emerald-400 px-3 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowContributionAccountPicker(false);
                            setSelectedContributionAccountId("");
                          }}
                          className="w-fit rounded-md border border-white/10 px-3 py-2 text-sm text-neutral-300 transition hover:bg-white/5 hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : null}

                    <div className="mt-4 divide-y divide-white/10">
                      {contributionAccounts.length > 0 ? (
                        <>
                          {contributionAccounts.map((account) => (
                            <div
                              key={account.id}
                              className="grid gap-3 py-3 md:grid-cols-[minmax(0,1fr)_170px_110px_110px] md:items-center"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                {renderColorPicker(
                                  `investment-${account.id}`,
                                  account.accent,
                                  account.name,
                                  (color) =>
                                    updateAccount(account.id, "accent", color),
                                  "size-2.5",
                                )}
                                <div className="min-w-0">
                                  <p className="truncate font-medium text-neutral-100">
                                    {account.name}
                                  </p>
                                  <p className="truncate text-sm text-neutral-500">
                                    {account.institution} / {account.type}
                                  </p>
                                </div>
                              </div>
                              <label className="block">
                                <span className="text-xs text-neutral-500">
                                  Monthly contribution
                                </span>
                                <div className="mt-1 flex items-center rounded-md border border-white/10 bg-neutral-950/60 px-2 focus-within:border-emerald-400/60">
                                  <span className="text-neutral-500">$</span>
                                  <input
                                    type="number"
                                    onFocus={selectNumberInput}
                                    min="0"
                                    step="25"
                                    value={investmentContributions[account.id] ?? 0}
                                    onChange={(event) =>
                                      updateInvestmentContribution(
                                        account.id,
                                        Number(event.target.value),
                                      )
                                    }
                                    aria-label={`${account.name} monthly contribution`}
                                    className="min-w-0 flex-1 bg-transparent px-1 py-2 font-semibold text-neutral-100 outline-none"
                                  />
                                </div>
                              </label>
                              <div className="rounded-md border border-white/10 bg-neutral-950/45 px-2 py-1.5">
                                <p className="text-xs text-neutral-500">
                                  Account return
                                </p>
                                <p className="mt-1 font-semibold text-neutral-100">
                                  {formatPercent(
                                    contributionReturns[account.id] ??
                                      defaultReturnForAccount(
                                        account,
                                        retirementPlan.annualReturn,
                                      ),
                                  )}
                                  %
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeContributionAccount(account.id)}
                                className="w-fit rounded-md border border-rose-300/20 px-3 py-2 text-sm text-rose-200 transition hover:bg-rose-300/10 md:justify-self-end"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                          <div className="grid gap-3 py-3 md:grid-cols-[minmax(0,1fr)_170px_110px_110px] md:items-center">
                            <div className="min-w-0">
                              <p className="font-semibold text-neutral-100">
                                Total
                              </p>
                              <p className="text-sm text-neutral-500">
                                Monthly contribution summary
                              </p>
                            </div>
                            <div className="rounded-md border border-emerald-300/20 bg-emerald-300/10 px-2 py-1.5">
                              <p className="text-xs text-emerald-200">
                                Monthly contribution
                              </p>
                              <p className="mt-1 font-semibold text-neutral-100">
                                {formatCurrency(totals.monthlyInvestment)}
                              </p>
                            </div>
                            <div className="rounded-md border border-emerald-300/20 bg-emerald-300/10 px-2 py-1.5">
                              <p className="text-xs text-emerald-200">
                                Weighted return
                              </p>
                              <p className="mt-1 font-semibold text-neutral-100">
                                {formatPercent(monthlyContributionWeightedReturn)}%
                              </p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="py-4 text-sm text-neutral-500">
                          Add an existing account or create a new account to start
                          monthly contributions.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </article>

              <div className="grid items-start gap-4 xl:grid-cols-2">
                <article
                  id="accounts"
                  className="scroll-mt-24 rounded-lg border border-white/10 bg-white/[0.035]"
                >
                  <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-base font-semibold">Accounts</h3>
                      <p className="mt-1 text-sm text-neutral-500">
                        Current balances used for net worth.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={addAccount}
                        className="w-fit rounded-md bg-emerald-400 px-3 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-emerald-300"
                      >
                        Add account
                      </button>
                      <button
                        type="button"
                        onClick={resetAccounts}
                        className="w-fit rounded-md border border-white/10 px-3 py-2 text-sm text-neutral-300 transition hover:bg-white/5 hover:text-white"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  <div className="divide-y divide-white/10">
                    {accounts.map((account) => (
                      <div
                        key={account.id}
                        className="grid gap-3 px-4 py-3 md:grid-cols-[minmax(0,1fr)_160px_130px_140px_auto] md:items-center"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-3">
                            {renderColorPicker(
                              `account-${account.id}`,
                              account.accent,
                              account.name,
                              (color) => updateAccount(account.id, "accent", color),
                              "size-2.5",
                            )}
                            <div className="grid min-w-0 flex-1 gap-2">
                              <label className="block">
                                <span className="sr-only">Account title</span>
                                <input
                                  type="text"
                                  value={account.name}
                                  onChange={(event) =>
                                    updateAccount(
                                      account.id,
                                      "name",
                                      event.target.value,
                                    )
                                  }
                                  className="w-full rounded-md border border-transparent bg-transparent px-2 py-1 font-medium text-neutral-100 outline-none transition hover:border-white/10 hover:bg-neutral-950/40 focus:border-emerald-400/60 focus:bg-neutral-950/60"
                                />
                              </label>
                              <label className="block">
                                <span className="sr-only">Account notes</span>
                                <input
                                  type="text"
                                  value={account.institution}
                                  onChange={(event) =>
                                    updateAccount(
                                      account.id,
                                      "institution",
                                      event.target.value,
                                    )
                                  }
                                  className="w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-sm text-neutral-500 outline-none transition hover:border-white/10 hover:bg-neutral-950/40 focus:border-emerald-400/60 focus:bg-neutral-950/60 focus:text-neutral-200"
                                />
                              </label>
                            </div>
                          </div>
                        </div>

                        <label className="block text-sm">
                          <span className="sr-only">{account.name} balance</span>
                          <div className="flex items-center rounded-md border border-white/10 bg-neutral-950/60 px-2 focus-within:border-emerald-400/60">
                            <span className="text-neutral-500">$</span>
                            <input
                              type="number"
                              onFocus={selectNumberInput}
                              min="0"
                              step="100"
                              value={account.balance}
                              onChange={(event) =>
                                updateAccount(
                                  account.id,
                                  "balance",
                                  Number(event.target.value),
                                )
                              }
                              className="min-w-0 flex-1 bg-transparent px-1 py-2 font-semibold text-neutral-100 outline-none"
                            />
                          </div>
                        </label>
                        <label className="block text-sm">
                          <span className="text-xs text-neutral-500">
                            Expected return
                          </span>
                          <div className="flex items-center rounded-md border border-white/10 bg-neutral-950/60 px-2 focus-within:border-emerald-400/60">
                            <input
                              type="number"
                              onFocus={selectNumberInput}
                              min="0"
                              step="0.25"
                              value={
                                contributionReturns[account.id] ??
                                defaultReturnForAccount(
                                  account,
                                  retirementPlan.annualReturn,
                                )
                              }
                              onChange={(event) =>
                                updateContributionReturn(
                                  account.id,
                                  Number(event.target.value),
                                )
                              }
                              aria-label={`${account.name} expected return`}
                              className="min-w-0 flex-1 bg-transparent px-1 py-2 font-semibold text-neutral-100 outline-none"
                            />
                            <span className="text-neutral-500">%</span>
                          </div>
                        </label>
                        <label className="block text-sm">
                          <span className="sr-only">
                            {account.name} account type
                          </span>
                          <select
                            value={account.type}
                            onChange={(event) =>
                              updateAccount(
                                account.id,
                                "type",
                                event.target.value as AccountType,
                              )
                            }
                            className="w-full rounded-md border border-white/10 bg-neutral-950/60 px-2 py-2 font-medium text-neutral-100 outline-none transition focus:border-emerald-400/60"
                          >
                            <option value="cash">Cash</option>
                            <option value="invested">Invested</option>
                          </select>
                        </label>
                        <button
                          type="button"
                          onClick={() => deleteAccount(account.id)}
                          className="w-fit rounded-md border border-rose-300/20 px-3 py-2 text-sm text-rose-200 transition hover:bg-rose-300/10"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </article>

                <article
                  id="debt"
                  className="scroll-mt-24 rounded-lg border border-white/10 bg-white/[0.035]"
                >
                  <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-base font-semibold">
                        Debt / Student loans
                      </h3>
                      <p className="mt-1 text-sm text-neutral-500">
                        Liabilities subtract from net worth and payments reduce
                        surplus.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={addDebt}
                        className="w-fit rounded-md bg-emerald-400 px-3 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-emerald-300"
                      >
                        Add debt
                      </button>
                      <button
                        type="button"
                        onClick={resetDebts}
                        className="w-fit rounded-md border border-white/10 px-3 py-2 text-sm text-neutral-300 transition hover:bg-white/5 hover:text-white"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  <div className="divide-y divide-white/10">
                    {debts.map((debt) => (
                      <div
                        key={debt.id}
                        className="grid gap-3 px-4 py-3 lg:grid-cols-[minmax(0,1fr)_150px_150px_110px_auto] lg:items-center"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          {renderColorPicker(
                            `debt-${debt.id}`,
                            debt.accent,
                            debt.name,
                            (color) => updateDebt(debt.id, "accent", color),
                            "size-2.5",
                          )}
                          <div className="grid min-w-0 flex-1 gap-2">
                            <label className="block">
                              <span className="sr-only">Debt title</span>
                              <input
                                type="text"
                                value={debt.name}
                                onChange={(event) =>
                                  updateDebt(
                                    debt.id,
                                    "name",
                                    event.target.value,
                                  )
                                }
                                className="w-full rounded-md border border-transparent bg-transparent px-2 py-1 font-medium text-neutral-100 outline-none transition hover:border-white/10 hover:bg-neutral-950/40 focus:border-rose-300/60 focus:bg-neutral-950/60"
                              />
                            </label>
                            <label className="block">
                              <span className="sr-only">Debt notes</span>
                              <input
                                type="text"
                                value={debt.lender}
                                onChange={(event) =>
                                  updateDebt(
                                    debt.id,
                                    "lender",
                                    event.target.value,
                                  )
                                }
                                className="w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-sm text-neutral-500 outline-none transition hover:border-white/10 hover:bg-neutral-950/40 focus:border-rose-300/60 focus:bg-neutral-950/60 focus:text-neutral-200"
                              />
                            </label>
                          </div>
                        </div>

                        <label className="block text-sm">
                          <span className="text-xs text-neutral-500">
                            Balance
                          </span>
                          <div className="mt-1 flex items-center rounded-md border border-white/10 bg-neutral-950/60 px-2 focus-within:border-rose-300/60">
                            <span className="text-neutral-500">$</span>
                            <input
                              type="number"
                              onFocus={selectNumberInput}
                              min="0"
                              step="100"
                              value={debt.balance}
                              onChange={(event) =>
                                updateDebt(
                                  debt.id,
                                  "balance",
                                  Number(event.target.value),
                                )
                              }
                              className="min-w-0 flex-1 bg-transparent px-1 py-2 font-semibold text-neutral-100 outline-none"
                            />
                          </div>
                        </label>

                        <label className="block text-sm">
                          <span className="text-xs text-neutral-500">
                            Payment
                          </span>
                          <div className="mt-1 flex items-center rounded-md border border-white/10 bg-neutral-950/60 px-2 focus-within:border-rose-300/60">
                            <span className="text-neutral-500">$</span>
                            <input
                              type="number"
                              onFocus={selectNumberInput}
                              min="0"
                              step="25"
                              value={debt.payment}
                              onChange={(event) =>
                                updateDebt(
                                  debt.id,
                                  "payment",
                                  Number(event.target.value),
                                )
                              }
                              className="min-w-0 flex-1 bg-transparent px-1 py-2 font-semibold text-neutral-100 outline-none"
                            />
                          </div>
                        </label>

                        <label className="block text-sm">
                          <span className="text-xs text-neutral-500">APR</span>
                          <div className="mt-1 flex items-center rounded-md border border-white/10 bg-neutral-950/60 px-2 focus-within:border-rose-300/60">
                            <input
                              type="number"
                              onFocus={selectNumberInput}
                              min="0"
                              step="0.1"
                              value={debt.rate}
                              onChange={(event) =>
                                updateDebt(
                                  debt.id,
                                  "rate",
                                  Number(event.target.value),
                                )
                              }
                              className="min-w-0 flex-1 bg-transparent px-1 py-2 font-semibold text-neutral-100 outline-none"
                            />
                            <span className="text-neutral-500">%</span>
                          </div>
                        </label>
                        <button
                          type="button"
                          onClick={() => deleteDebt(debt.id)}
                          className="w-fit rounded-md border border-rose-300/20 px-3 py-2 text-sm text-rose-200 transition hover:bg-rose-300/10"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </article>
              </div>
            </section>

            <section
              id="retirement"
              className="mt-4 scroll-mt-24 rounded-lg border border-white/10 bg-white/[0.035]"
            >
              <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-xl font-semibold">Retirement Projection</h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    Track whether contribution accounts can hit the goal portfolio by your goal age.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetRetirementPlan}
                  className="w-fit rounded-md border border-white/10 px-3 py-2 text-sm text-neutral-300 transition hover:bg-white/5 hover:text-white"
                >
                  Reset
                </button>
              </div>

              <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <label className="block">
                    <span className="text-xs text-neutral-500">Current age</span>
                    <input
                      type="number"
                      onFocus={selectNumberInput}
                      min="18"
                      step="1"
                      value={retirementPlan.currentAge}
                      onChange={(event) =>
                        updateRetirementPlan(
                          "currentAge",
                          Number(event.target.value),
                        )
                      }
                      className="mt-1 w-full rounded-md border border-white/10 bg-neutral-950/60 px-3 py-2 font-semibold text-neutral-100 outline-none focus:border-emerald-400/60"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs text-neutral-500">
                      Goal age
                    </span>
                    <input
                      type="number"
                      onFocus={selectNumberInput}
                      min="18"
                      step="1"
                      value={retirementPlan.targetAge}
                      onChange={(event) =>
                        updateRetirementPlan("targetAge", Number(event.target.value))
                      }
                      className="mt-1 w-full rounded-md border border-white/10 bg-neutral-950/60 px-3 py-2 font-semibold text-neutral-100 outline-none focus:border-emerald-400/60"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs text-neutral-500">
                      Goal portfolio by goal age
                    </span>
                    <div className="mt-1 flex items-center rounded-md border border-white/10 bg-neutral-950/60 px-2 focus-within:border-emerald-400/60">
                      <span className="text-neutral-500">$</span>
                      <input
                        type="number"
                        onFocus={selectNumberInput}
                        min="0"
                        step="10000"
                        value={retirementPlan.targetPortfolio}
                        onChange={(event) =>
                          updateRetirementPlan(
                            "targetPortfolio",
                            Number(event.target.value),
                          )
                        }
                        className="min-w-0 flex-1 bg-transparent px-1 py-2 font-semibold text-neutral-100 outline-none"
                      />
                    </div>
                  </label>
                  <label className="block">
                    <span className="text-xs text-neutral-500">
                      Default return for new invested accounts
                    </span>
                    <div className="mt-1 flex items-center rounded-md border border-white/10 bg-neutral-950/60 px-2 focus-within:border-emerald-400/60">
                      <input
                        type="number"
                        onFocus={selectNumberInput}
                        min="0"
                        step="0.25"
                        value={retirementPlan.annualReturn}
                        onChange={(event) =>
                          updateRetirementPlan(
                            "annualReturn",
                            Number(event.target.value),
                          )
                        }
                        className="min-w-0 flex-1 bg-transparent px-1 py-2 font-semibold text-neutral-100 outline-none"
                      />
                      <span className="text-neutral-500">%</span>
                    </div>
                  </label>
                  <div className="rounded-lg border border-white/10 bg-neutral-950/45 px-3 py-2">
                    <p className="text-xs text-neutral-500">Contribution balance</p>
                    <p className="mt-1 text-lg font-semibold text-neutral-100">
                      {formatCurrency(totals.contributionBalance)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-neutral-950/45 px-3 py-2">
                    <p className="text-xs text-neutral-500">Monthly contributions</p>
                    <p className="mt-1 text-lg font-semibold text-neutral-100">
                      {formatCurrency(totals.monthlyInvestment)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-neutral-950/45 px-3 py-2">
                    <p className="text-xs text-neutral-500">
                      Overall weighted return
                    </p>
                    <p className="mt-1 text-lg font-semibold text-neutral-100">
                      {formatPercent(retirementProjection.weightedAnnualReturn)}%
                    </p>
                  </div>
                </div>

                <aside className="rounded-lg border border-white/10 bg-neutral-950/45 p-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      retirementProjection.isOnTrack
                        ? "bg-emerald-400/10 text-emerald-300"
                        : "bg-amber-300/10 text-amber-200"
                    }`}
                  >
                    {retirementProjection.isOnTrack ? "On track" : "Needs more"}
                  </span>
                  <p className="mt-4 text-sm text-neutral-400">
                    Projected at age {retirementPlan.targetAge}
                  </p>
                  <p className="mt-1 text-3xl font-semibold tracking-tight">
                    {formatCurrency(retirementProjection.balanceAtTargetAge)}
                  </p>
                  <div className="mt-4 h-3 rounded-full bg-white/10">
                    <div
                      className={`h-3 rounded-full ${
                        retirementProjection.isOnTrack
                          ? "bg-emerald-400"
                          : "bg-amber-300"
                      }`}
                      style={{ width: `${retirementProjection.progress}%` }}
                    />
                  </div>
                  <div className="mt-4 grid gap-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-neutral-500">Goal date</span>
                      <span className="font-medium text-neutral-100">
                        {retirementProjection.projectedAge === null
                          ? "Past 75 years"
                          : `Age ${formatPercent(retirementProjection.projectedAge)}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-neutral-500">Needed monthly</span>
                      <span className="font-medium text-neutral-100">
                        {formatCurrency(
                          retirementProjection.requiredMonthlyContribution,
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-neutral-500">Current monthly</span>
                      <span className="font-medium text-neutral-100">
                        {formatCurrency(totals.monthlyInvestment)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 rounded-lg border border-white/10 bg-neutral-950/50 p-3">
                    <p className="text-xs font-medium text-neutral-400">
                      Return mix
                    </p>
                    <div className="mt-3 grid gap-2">
                      {retirementProjection.returnMix.length > 0 ? (
                        retirementProjection.returnMix.map((account) => (
                          <div
                            key={account.id}
                            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-xs"
                          >
                            <span className="flex min-w-0 items-center gap-2 text-neutral-400">
                              <span
                                className={`size-2 shrink-0 rounded-full ${account.accent}`}
                              />
                              <span className="truncate">{account.name}</span>
                            </span>
                            <span className="font-medium text-neutral-100">
                              {formatPercent(account.share)}% at{" "}
                              {formatPercent(account.annualReturn)}%
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-neutral-500">
                          Add monthly contribution accounts to see the blended return.
                        </p>
                      )}
                    </div>
                  </div>
                </aside>
              </div>

              <div className="border-t border-white/10 p-5">
                <div className="rounded-lg border border-white/10 bg-neutral-950/45 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h4 className="text-base font-semibold">
                        Projection to Age {retirementPlan.targetAge}
                      </h4>
                      <p className="mt-1 text-sm text-neutral-500">
                        Current contribution balances plus monthly contributions.
                      </p>
                    </div>
                    <div className="text-sm text-neutral-400">
                      Goal {formatCurrency(retirementPlan.targetPortfolio)}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-4 text-xs text-neutral-400">
                    <span className="flex items-center gap-2">
                      <span className="h-1 w-8 rounded-full bg-emerald-400" />
                      Projected portfolio
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="h-0.5 w-8 border-t-2 border-dashed border-amber-300" />
                      Target portfolio
                    </span>
                  </div>

                  <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px] xl:items-stretch">
                    <div className="overflow-hidden rounded-lg border border-white/10 bg-neutral-950/60 p-3">
                      <div className="aspect-[16/9] w-full">
                        <svg
                          aria-label="Retirement portfolio projection chart"
                          role="img"
                          viewBox="0 0 720 260"
                          className="h-full w-full"
                          preserveAspectRatio="xMidYMid meet"
                        >
                          <line
                            x1="48"
                            y1="24"
                            x2="48"
                            y2="218"
                            stroke="rgba(255,255,255,0.16)"
                            strokeWidth="1"
                          />
                          <line
                            x1="48"
                            y1="218"
                            x2="690"
                            y2="218"
                            stroke="rgba(255,255,255,0.16)"
                            strokeWidth="1"
                          />
                          {[0.25, 0.5, 0.75].map((tick) => (
                        <line
                          key={tick}
                          x1="48"
                          y1={218 - 194 * tick}
                          x2="690"
                          y2={218 - 194 * tick}
                          stroke="rgba(255,255,255,0.08)"
                          strokeWidth="1"
                        />
                      ))}
                      <line
                        x1="48"
                        y1={
                          218 -
                          (retirementPlan.targetPortfolio /
                            retirementProjection.maxChartBalance) *
                            194
                        }
                        x2="690"
                        y2={
                          218 -
                          (retirementPlan.targetPortfolio /
                            retirementProjection.maxChartBalance) *
                            194
                        }
                        stroke="rgba(251,191,36,0.85)"
                        strokeDasharray="6 6"
                        strokeWidth="2"
                      />
                      <polyline
                        fill="none"
                        stroke="rgb(52,211,153)"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="4"
                        points={retirementProjection.projectionPoints
                          .map((point, index, points) => {
                            const x =
                              48 +
                              (points.length === 1
                                ? 0
                                : (index / (points.length - 1)) * 642);
                            const y =
                              218 -
                              (point.balance /
                                retirementProjection.maxChartBalance) *
                                194;

                            return `${x},${y}`;
                          })
                          .join(" ")}
                      />
                      {retirementProjection.projectionPoints.map(
                        (point, index, points) => {
                          const x =
                            48 +
                            (points.length === 1
                              ? 0
                              : (index / (points.length - 1)) * 642);
                          const y =
                            218 -
                            (point.balance /
                              retirementProjection.maxChartBalance) *
                              194;

                          return (
                            <circle
                              key={`${point.age}-${point.balance}`}
                              cx={x}
                              cy={y}
                              r={index === points.length - 1 ? 5 : 3}
                              fill="rgb(52,211,153)"
                            />
                          );
                        },
                      )}
                      <text x="48" y="246" fill="rgb(163,163,163)" fontSize="13">
                        Age {retirementPlan.currentAge}
                      </text>
                      <text
                        x="690"
                        y="246"
                        fill="rgb(163,163,163)"
                        fontSize="13"
                        textAnchor="end"
                      >
                        Age {retirementPlan.targetAge}
                      </text>
                      <text x="52" y="36" fill="rgb(163,163,163)" fontSize="13">
                        {formatCurrency(retirementProjection.maxChartBalance)}
                      </text>
                        </svg>
                      </div>
                    </div>

                    <div className="grid gap-3 rounded-lg border border-white/10 bg-neutral-950/60 p-4 text-sm">
                      <div>
                        <p className="text-xs text-neutral-500">At goal age</p>
                        <p className="mt-1 text-2xl font-semibold tracking-tight text-neutral-100">
                          {formatCurrency(retirementProjection.balanceAtTargetAge)}
                        </p>
                      </div>
                      <div className="h-px bg-white/10" />
                      <div className="grid gap-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-neutral-500">
                            {retirementProjection.goalGap >= 0
                              ? "Projected surplus"
                              : "Projected gap"}
                          </span>
                          <span
                            className={`font-semibold ${
                              retirementProjection.goalGap >= 0
                                ? "text-emerald-300"
                                : "text-amber-200"
                            }`}
                          >
                            {formatCurrency(Math.abs(retirementProjection.goalGap))}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-neutral-500">Goal portfolio</span>
                          <span className="font-semibold text-neutral-100">
                            {formatCurrency(retirementPlan.targetPortfolio)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-neutral-500">Monthly pace</span>
                          <span className="font-semibold text-neutral-100">
                            {formatCurrency(totals.monthlyInvestment)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-neutral-500">
                            Overall weighted return
                          </span>
                          <span className="font-semibold text-neutral-100">
                            {formatPercent(retirementProjection.weightedAnnualReturn)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section
              id="goals"
              className="mt-4 scroll-mt-24 rounded-lg border border-white/10 bg-white/[0.035]"
            >
              <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold">Goals</h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    Track the next actions that keep the plan moving.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={addGoal}
                    className="w-fit rounded-md bg-emerald-400 px-3 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-emerald-300"
                  >
                    Add goal
                  </button>
                  <button
                    type="button"
                    onClick={resetGoals}
                    className="w-fit rounded-md border border-white/10 px-3 py-2 text-sm text-neutral-300 transition hover:bg-white/5 hover:text-white"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={exportActions}
                    className="w-fit rounded-md border border-white/10 px-3 py-2 text-sm text-neutral-300 transition hover:bg-white/5 hover:text-white"
                  >
                    Export
                  </button>
                </div>
              </div>

              <div className="divide-y divide-white/10">
                {goals.map((goal) => {
                  const isDone = completedActions.includes(goal.id);

                  return (
                    <div
                      key={goal.id}
                      className="grid w-full gap-3 px-4 py-3 text-left transition hover:bg-white/[0.03] lg:grid-cols-[1fr_150px_140px_120px_auto_auto] lg:items-center"
                    >
                      <div className="min-w-0">
                        <label className="block">
                          <span className="sr-only">Goal title</span>
                          <input
                            type="text"
                            value={goal.title}
                            onChange={(event) =>
                              updateGoal(goal.id, "title", event.target.value)
                            }
                            className={`w-full rounded-md border border-transparent bg-transparent px-2 py-1 font-medium outline-none transition hover:border-white/10 hover:bg-neutral-950/40 focus:border-emerald-400/60 focus:bg-neutral-950/60 ${
                              isDone
                                ? "text-neutral-500 line-through"
                                : "text-neutral-100"
                            }`}
                          />
                        </label>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          <label className="block">
                            <span className="sr-only">Goal category</span>
                            <input
                              type="text"
                              value={goal.category}
                              onChange={(event) =>
                                updateGoal(
                                  goal.id,
                                  "category",
                                  event.target.value,
                                )
                              }
                              className="w-full rounded-md border border-white/10 bg-neutral-950/60 px-2 py-1.5 text-sm text-neutral-300 outline-none focus:border-emerald-400/60"
                            />
                          </label>
                          <label className="block">
                            <span className="sr-only">Goal cadence</span>
                            <input
                              type="text"
                              value={goal.cadence}
                              onChange={(event) =>
                                updateGoal(
                                  goal.id,
                                  "cadence",
                                  event.target.value,
                                )
                              }
                              className="w-full rounded-md border border-white/10 bg-neutral-950/60 px-2 py-1.5 text-sm text-neutral-300 outline-none focus:border-emerald-400/60"
                            />
                          </label>
                        </div>
                      </div>
                      <label className="block">
                        <span className="text-xs text-neutral-500">Status</span>
                        <input
                          type="text"
                          value={goal.status}
                          onChange={(event) =>
                            updateGoal(goal.id, "status", event.target.value)
                          }
                          className="mt-1 w-full rounded-md border border-white/10 bg-neutral-950/60 px-2 py-2 text-sm text-neutral-100 outline-none focus:border-emerald-400/60"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs text-neutral-500">Amount</span>
                        <div className="mt-1 flex items-center rounded-md border border-white/10 bg-neutral-950/60 px-2 focus-within:border-emerald-400/60">
                          <span className="text-neutral-500">$</span>
                          <input
                            type="number"
                            onFocus={selectNumberInput}
                            min="0"
                            step="25"
                            value={goal.amount}
                            onChange={(event) =>
                              updateGoal(
                                goal.id,
                                "amount",
                                Number(event.target.value),
                              )
                            }
                            className="min-w-0 flex-1 bg-transparent px-1 py-2 font-semibold text-neutral-100 outline-none"
                          />
                        </div>
                      </label>
                      <span
                        className={`w-fit rounded-full border px-2.5 py-1 text-xs ${
                          isDone
                            ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                            : "border-white/10 text-neutral-400"
                        }`}
                      >
                        {isDone ? "Done" : "Open"}
                      </span>
                      <p className="text-left font-semibold text-emerald-300 sm:min-w-28 sm:text-right">
                        +{formatCurrency(goal.amount)}
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => toggleAction(goal.id)}
                          className="rounded-md border border-white/10 px-3 py-2 text-sm text-neutral-300 transition hover:bg-white/5 hover:text-white"
                        >
                          {isDone ? "Reopen" : "Done"}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteGoal(goal.id)}
                          className="rounded-md border border-rose-300/20 px-3 py-2 text-sm text-rose-200 transition hover:bg-rose-300/10"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

          </div>
        </section>
      </div>
    </main>
  );
}
