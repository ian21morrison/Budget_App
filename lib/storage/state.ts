import { defaultReturnForAccount } from "@/lib/calculations/returns";
import {
  DEFAULT_BRAND_NAME,
  DEFAULT_DASHBOARD_TITLE,
  DEFAULT_MONTHLY_INCOME,
  DEFAULT_MONTHLY_INVESTING,
  STORAGE_KEY,
  accountSeed,
  actionSeed,
  budgetSeed,
  createMonthlyActualFromPlan,
  debtSeed,
  investmentContributionSeed,
  retirementSeed,
} from "@/lib/storage/defaults";
import type {
  Account,
  AccountType,
  Budget,
  ContributionReturns,
  Debt,
  Goal,
  InvestmentContributions,
  MonthlyActual,
  RetirementPlan,
  SavedBudgetState,
} from "@/types";

const BACKUP_APP_ID = "ian-capital-budget-app";
const BACKUP_VERSION = 1;
const BACKUP_STATE_KEYS = [
  "accounts",
  "budgets",
  "debts",
  "goals",
  "monthlyIncome",
  "retirementPlan",
  "investmentContributions",
  "contributionReturns",
  "monthlyActuals",
  "completedActions",
  "brandName",
  "dashboardTitle",
];

type ImportBudgetBackupResult =
  | {
      ok: true;
      state: SavedBudgetState;
    }
  | {
      ok: false;
      error: string;
    };

const slugFromText = (prefix: string, text: string) =>
  `${prefix}-${text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const hasBudgetStateShape = (value: Record<string, unknown>) =>
  BACKUP_STATE_KEYS.some((key) => key in value);

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

export const normalizeAccounts = (savedAccounts: unknown): Account[] => {
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

export const normalizeBudgets = (savedBudgets: unknown): Budget[] => {
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

export const normalizeDebts = (savedDebts: unknown): Debt[] => {
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

export const normalizeGoals = (savedGoals: unknown): Goal[] => {
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

export const normalizeRetirementPlan = (
  savedPlan: unknown,
): RetirementPlan => {
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

export const normalizeInvestmentContributions = (
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

export const normalizeContributionReturns = (
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

export const normalizeMonthlyActuals = (
  savedActuals: unknown,
): MonthlyActual[] => {
  if (!Array.isArray(savedActuals)) {
    return [createMonthlyActualFromPlan()];
  }

  const normalizedActuals = savedActuals
    .filter(isRecord)
    .map((actual) => {
      const month = textValue(actual.month, createMonthlyActualFromPlan().month);
      const budgetActuals = isRecord(actual.budgetActuals)
        ? Object.fromEntries(
            Object.entries(actual.budgetActuals).map(([budgetId, amount]) => [
              budgetId,
              numberValue(amount, 0),
            ]),
          )
        : {};

      return {
        month,
        income: numberValue(actual.income, DEFAULT_MONTHLY_INCOME),
        budgetActuals,
        transfers: numberValue(actual.transfers, 0),
        debtPayments: numberValue(actual.debtPayments, 0),
        contributions: numberValue(actual.contributions, DEFAULT_MONTHLY_INVESTING),
      };
    });

  return normalizedActuals.length > 0
    ? normalizedActuals
    : [createMonthlyActualFromPlan()];
};

export const createDefaultBudgetState = (): SavedBudgetState => ({
  brandName: DEFAULT_BRAND_NAME,
  dashboardTitle: DEFAULT_DASHBOARD_TITLE,
  accounts: accountSeed.map((account) => ({ ...account })),
  budgets: budgetSeed.map((budget) => ({ ...budget })),
  debts: debtSeed.map((debt) => ({ ...debt })),
  goals: actionSeed.map((goal) => ({ ...goal })),
  monthlyIncome: DEFAULT_MONTHLY_INCOME,
  retirementPlan: { ...retirementSeed },
  investmentContributions: { ...investmentContributionSeed },
  contributionReturns: normalizeContributionReturns(
    undefined,
    accountSeed,
    retirementSeed,
  ),
  monthlyActuals: [createMonthlyActualFromPlan()],
  completedActions: [],
});

export const normalizeSavedBudgetState = (
  savedState: unknown,
): SavedBudgetState | null => {
  if (!isRecord(savedState)) {
    return null;
  }

  const parsedState = savedState as Partial<SavedBudgetState>;
  const accounts = normalizeAccounts(parsedState.accounts);
  const retirementPlan = normalizeRetirementPlan(parsedState.retirementPlan);
  const investmentContributions = normalizeInvestmentContributions(
    parsedState.investmentContributions,
    accounts,
    parsedState.retirementPlan,
  );

  return {
    brandName: textValue(parsedState.brandName, DEFAULT_BRAND_NAME),
    dashboardTitle: textValue(parsedState.dashboardTitle, DEFAULT_DASHBOARD_TITLE),
    accounts,
    budgets: normalizeBudgets(parsedState.budgets),
    debts: normalizeDebts(parsedState.debts),
    goals: normalizeGoals(parsedState.goals),
    monthlyIncome:
      typeof parsedState.monthlyIncome === "number"
        ? parsedState.monthlyIncome
        : DEFAULT_MONTHLY_INCOME,
    retirementPlan,
    investmentContributions,
    contributionReturns: normalizeContributionReturns(
      parsedState.contributionReturns,
      accounts,
      retirementPlan,
    ),
    monthlyActuals: normalizeMonthlyActuals(parsedState.monthlyActuals),
    completedActions: Array.isArray(parsedState.completedActions)
      ? parsedState.completedActions.filter(
          (action): action is string => typeof action === "string",
        )
      : [],
  };
};

export const loadSavedBudgetState = (): SavedBudgetState | null => {
  try {
    const rawState = window.localStorage.getItem(STORAGE_KEY);

    if (!rawState) {
      return null;
    }

    return normalizeSavedBudgetState(JSON.parse(rawState));
  } catch {
    return null;
  }
};

export const persistBudgetState = (state: SavedBudgetState) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Local storage can be unavailable in private windows or restricted contexts.
  }
};

export const createBudgetBackupJson = (state: SavedBudgetState) =>
  JSON.stringify(
    {
      app: BACKUP_APP_ID,
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      state,
    },
    null,
    2,
  );

export const createBudgetBackupFileName = (date = new Date()) => {
  const stamp = date.toISOString().slice(0, 10);

  return `budget-app-backup-${stamp}.json`;
};

export const parseBudgetBackupJson = (
  backupJson: string,
): ImportBudgetBackupResult => {
  try {
    const parsedBackup = JSON.parse(backupJson) as unknown;

    if (!isRecord(parsedBackup)) {
      return {
        ok: false,
        error: "Backup must be a JSON object.",
      };
    }

    const candidateState =
      isRecord(parsedBackup.state) && parsedBackup.app === BACKUP_APP_ID
        ? parsedBackup.state
        : parsedBackup;

    if (!isRecord(candidateState) || !hasBudgetStateShape(candidateState)) {
      return {
        ok: false,
        error: "Backup does not look like Budget App data.",
      };
    }

    const state = normalizeSavedBudgetState(candidateState);

    if (!state) {
      return {
        ok: false,
        error: "Backup data could not be normalized.",
      };
    }

    return {
      ok: true,
      state,
    };
  } catch {
    return {
      ok: false,
      error: "Backup must be valid JSON.",
    };
  }
};
