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
  createNetWorthSnapshot,
  debtSeed,
  getDefaultNextPaycheckDate,
  investmentContributionSeed,
  recurringBillSeed,
  retirementSeed,
} from "@/lib/storage/defaults";
import type {
  Account,
  AccountAssetAllocation,
  AccountPurpose,
  AccountTaxTreatment,
  AccountType,
  Budget,
  ContributionReturns,
  Debt,
  Goal,
  InvestmentContributions,
  MonthlyActual,
  NetWorthSnapshot,
  RecurringBill,
  RecurringBillCadence,
  FinanceProfile,
  RetirementPlan,
  SavedBudgetState,
  Transaction,
  TransactionCategoryType,
} from "@/types";

const BACKUP_APP_ID = "ian-capital-budget-app";
const BACKUP_VERSION = 1;
export const PROFILE_STORAGE_KEY = "financeAppProfiles";
export const ACTIVE_PROFILE_STORAGE_KEY = "activeFinanceProfileId";
const BACKUP_STATE_KEYS = [
  "accounts",
  "budgets",
  "debts",
  "goals",
  "recurringBills",
  "nextPaycheckDate",
  "monthlyIncome",
  "retirementPlan",
  "investmentContributions",
  "contributionReturns",
  "monthlyActuals",
  "transactions",
  "netWorthSnapshots",
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

const createId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

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

const outflowValue = (value: unknown, fallback: number) => {
  const amount = numberValue(value, fallback);

  return amount === 0 ? 0 : -Math.abs(amount);
};

const accountTypeValue = (value: unknown, fallback: AccountType): AccountType => {
  const normalizedValue = typeof value === "string" ? value.toLowerCase() : value;

  return normalizedValue === "cash" || normalizedValue === "invested"
    ? normalizedValue
    : fallback;
};

const accountTaxTreatmentValue = (
  value: unknown,
  fallback: AccountTaxTreatment,
): AccountTaxTreatment => {
  const normalizedValue = typeof value === "string" ? value : "";

  return [
    "taxable",
    "traditionalRetirement",
    "rothRetirement",
    "hsa",
    "education",
    "other",
  ].includes(normalizedValue)
    ? (normalizedValue as AccountTaxTreatment)
    : fallback;
};

const accountPurposeValue = (
  value: unknown,
  fallback: AccountPurpose,
): AccountPurpose => {
  const normalizedValue = typeof value === "string" ? value : "";

  return [
    "operating",
    "emergency",
    "retirement",
    "taxableInvesting",
    "shortTermSavings",
    "other",
  ].includes(normalizedValue)
    ? (normalizedValue as AccountPurpose)
    : fallback;
};

const normalizeAllocation = (
  savedAllocation: unknown,
  fallback: AccountAssetAllocation,
): AccountAssetAllocation => {
  if (!isRecord(savedAllocation)) {
    return fallback;
  }

  return {
    stocks: numberValue(savedAllocation.stocks, fallback.stocks),
    bonds: numberValue(savedAllocation.bonds, fallback.bonds),
    cash: numberValue(savedAllocation.cash, fallback.cash),
    alternatives: numberValue(
      savedAllocation.alternatives,
      fallback.alternatives,
    ),
  };
};

const transactionCategoryTypeValue = (
  value: unknown,
  fallback: TransactionCategoryType,
): TransactionCategoryType => {
  const normalizedValue = typeof value === "string" ? value : "";

  return [
    "budget",
    "income",
    "transfer",
    "debtPayment",
    "contribution",
    "uncategorized",
  ].includes(normalizedValue)
    ? (normalizedValue as TransactionCategoryType)
    : fallback;
};

const recurringBillCadenceValue = (
  value: unknown,
  fallback: RecurringBillCadence,
): RecurringBillCadence => {
  const normalizedValue = typeof value === "string" ? value : "";

  return ["weekly", "biweekly", "monthly", "quarterly", "annual"].includes(
    normalizedValue,
  )
    ? (normalizedValue as RecurringBillCadence)
    : fallback;
};

const dateValue = (value: unknown, fallback: string) => {
  if (typeof value !== "string") {
    return fallback;
  }

  const date = new Date(`${value}T00:00:00`);

  return Number.isNaN(date.getTime()) ? fallback : value.slice(0, 10);
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

const inferTaxTreatment = (
  account: Record<string, unknown>,
  fallback: Account,
): AccountTaxTreatment => {
  const name = textValue(account.name, fallback.name).toLowerCase();
  const institution = textValue(account.institution, fallback.institution).toLowerCase();

  if (name.includes("roth")) {
    return "rothRetirement";
  }

  if (
    name.includes("401") ||
    name.includes("403") ||
    name.includes("ira") ||
    institution.includes("retirement")
  ) {
    return "traditionalRetirement";
  }

  return fallback.taxTreatment;
};

const inferAccountPurpose = (
  account: Record<string, unknown>,
  fallback: Account,
): AccountPurpose => {
  const name = textValue(account.name, fallback.name).toLowerCase();
  const institution = textValue(account.institution, fallback.institution).toLowerCase();

  if (
    name.includes("hys") ||
    name.includes("emergency") ||
    institution.includes("emergency") ||
    institution.includes("reserve")
  ) {
    return "emergency";
  }

  if (name.includes("checking") || institution.includes("operating")) {
    return "operating";
  }

  if (
    name.includes("ira") ||
    name.includes("401") ||
    institution.includes("retirement")
  ) {
    return "retirement";
  }

  return fallback.purpose;
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
      taxTreatment: accountTaxTreatmentValue(
        account.taxTreatment,
        inferTaxTreatment(account, fallback),
      ),
      purpose: accountPurposeValue(
        account.purpose,
        inferAccountPurpose(account, fallback),
      ),
      allocation: normalizeAllocation(account.allocation, fallback.allocation),
      emergencyFundTarget: numberValue(
        account.emergencyFundTarget,
        fallback.emergencyFundTarget,
      ),
      annualContributionLimit: numberValue(
        account.annualContributionLimit,
        fallback.annualContributionLimit,
      ),
      yearToDateContribution: numberValue(
        account.yearToDateContribution,
        fallback.yearToDateContribution,
      ),
      projectedAnnualIncomeRate: numberValue(
        account.projectedAnnualIncomeRate,
        fallback.projectedAnnualIncomeRate,
      ),
      notes: textValue(account.notes, fallback.notes),
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

export const normalizeRecurringBills = (
  savedRecurringBills: unknown,
): RecurringBill[] => {
  if (!Array.isArray(savedRecurringBills)) {
    return recurringBillSeed.map((bill) => ({ ...bill }));
  }

  const normalizedBills = savedRecurringBills
    .filter(isRecord)
    .map((bill, index) => {
      const fallback = recurringBillSeed[index % recurringBillSeed.length];
      const name = textValue(bill.name ?? bill.label, fallback.name);

      return {
        id: textValue(bill.id, slugFromText("bill", name)),
        name,
        category: textValue(bill.category, fallback.category),
        dueDate: dateValue(bill.dueDate, fallback.dueDate),
        cadence: recurringBillCadenceValue(bill.cadence, fallback.cadence),
        expectedAmount: Math.max(
          0,
          numberValue(bill.expectedAmount ?? bill.amount, fallback.expectedAmount),
        ),
        isPaid: Boolean(bill.isPaid ?? bill.paid),
        autopay: Boolean(bill.autopay),
      };
    });

  return normalizedBills;
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
              outflowValue(amount, 0),
            ]),
          )
        : {};

      return {
        month,
        income: numberValue(actual.income, DEFAULT_MONTHLY_INCOME),
        budgetActuals,
        transfers: outflowValue(actual.transfers, 0),
        debtPayments: outflowValue(actual.debtPayments, 0),
        contributions: outflowValue(
          actual.contributions,
          DEFAULT_MONTHLY_INVESTING,
        ),
      };
    });

  return normalizedActuals;
};

export const normalizeTransactions = (
  savedTransactions: unknown,
): Transaction[] => {
  if (!Array.isArray(savedTransactions)) {
    return [];
  }

  return savedTransactions.filter(isRecord).map((transaction, index) => {
    const description = textValue(transaction.description, "Transaction");
    const date = textValue(transaction.date, new Date().toISOString().slice(0, 10));
    const categoryType = transactionCategoryTypeValue(
      transaction.categoryType,
      "uncategorized",
    );

    return {
      id: textValue(transaction.id, `transaction-${date}-${index}`),
      date,
      description,
      amount: numberValue(transaction.amount, 0),
      categoryType,
      budgetId:
        categoryType === "budget" ? textValue(transaction.budgetId, "") : "",
      accountId: textValue(transaction.accountId, ""),
      notes: textValue(transaction.notes, ""),
    };
  });
};

const normalizeBalanceRecord = (
  savedBalances: unknown,
  fallbackBalances: Record<string, number>,
) => {
  if (!isRecord(savedBalances)) {
    return fallbackBalances;
  }

  const normalizedBalances = Object.entries(savedBalances).reduce<
    Record<string, number>
  >((next, [itemId, balance]) => {
    next[itemId] = numberValue(balance, fallbackBalances[itemId] ?? 0);
    return next;
  }, {});

  return Object.keys(normalizedBalances).length > 0
    ? normalizedBalances
    : fallbackBalances;
};

export const normalizeNetWorthSnapshots = (
  savedSnapshots: unknown,
  accounts: Account[],
  debts: Debt[],
): NetWorthSnapshot[] => {
  const fallbackSnapshot = createNetWorthSnapshot(
    undefined,
    accounts,
    debts,
  );

  if (!Array.isArray(savedSnapshots)) {
    return [fallbackSnapshot];
  }

  const normalizedSnapshots = savedSnapshots
    .filter(isRecord)
    .map((snapshot) => ({
      date: textValue(
        snapshot.date,
        textValue(snapshot.month, fallbackSnapshot.date).length === 7
          ? `${textValue(snapshot.month, fallbackSnapshot.date)}-01`
          : textValue(snapshot.month, fallbackSnapshot.date),
      ),
      accountBalances: normalizeBalanceRecord(
        snapshot.accountBalances,
        fallbackSnapshot.accountBalances,
      ),
      debtBalances: normalizeBalanceRecord(
        snapshot.debtBalances,
        fallbackSnapshot.debtBalances,
      ),
    }))
    .sort((first, second) => first.date.localeCompare(second.date));

  return normalizedSnapshots;
};

export const createDefaultBudgetState = (): SavedBudgetState => ({
  brandName: DEFAULT_BRAND_NAME,
  dashboardTitle: DEFAULT_DASHBOARD_TITLE,
  accounts: accountSeed.map((account) => ({ ...account })),
  budgets: budgetSeed.map((budget) => ({ ...budget })),
  debts: debtSeed.map((debt) => ({ ...debt })),
  goals: actionSeed.map((goal) => ({ ...goal })),
  recurringBills: recurringBillSeed.map((bill) => ({ ...bill })),
  nextPaycheckDate: getDefaultNextPaycheckDate(),
  monthlyIncome: DEFAULT_MONTHLY_INCOME,
  retirementPlan: { ...retirementSeed },
  investmentContributions: { ...investmentContributionSeed },
  contributionReturns: normalizeContributionReturns(
    undefined,
    accountSeed,
    retirementSeed,
  ),
  monthlyActuals: [createMonthlyActualFromPlan()],
  transactions: [],
  netWorthSnapshots: [createNetWorthSnapshot()],
  completedActions: [],
});

export const createBlankBudgetState = (): SavedBudgetState => ({
  brandName: DEFAULT_BRAND_NAME,
  dashboardTitle: DEFAULT_DASHBOARD_TITLE,
  accounts: [],
  budgets: [],
  debts: [],
  goals: [],
  recurringBills: [],
  nextPaycheckDate: getDefaultNextPaycheckDate(),
  monthlyIncome: 0,
  retirementPlan: {
    currentAge: 0,
    targetAge: 0,
    targetPortfolio: 0,
    annualReturn: 0,
  },
  investmentContributions: {},
  contributionReturns: {},
  monthlyActuals: [],
  transactions: [],
  netWorthSnapshots: [],
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
  const debts = normalizeDebts(parsedState.debts);
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
    debts,
    goals: normalizeGoals(parsedState.goals),
    recurringBills: normalizeRecurringBills(parsedState.recurringBills),
    nextPaycheckDate: dateValue(
      parsedState.nextPaycheckDate,
      getDefaultNextPaycheckDate(),
    ),
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
    transactions: normalizeTransactions(parsedState.transactions),
    netWorthSnapshots: normalizeNetWorthSnapshots(
      parsedState.netWorthSnapshots,
      accounts,
      debts,
    ),
    completedActions: Array.isArray(parsedState.completedActions)
      ? parsedState.completedActions.filter(
          (action): action is string => typeof action === "string",
        )
      : [],
  };
};

const normalizeFinanceProfile = (
  profile: unknown,
  fallbackIndex: number,
): FinanceProfile | null => {
  if (!isRecord(profile)) {
    return null;
  }

  const data = normalizeSavedBudgetState(profile.data);

  if (!data) {
    return null;
  }

  const now = new Date().toISOString();
  const name = textValue(profile.name, `Profile ${fallbackIndex + 1}`).trim();

  return {
    id: textValue(profile.id, createId("profile")),
    name: name || `Profile ${fallbackIndex + 1}`,
    createdAt: textValue(profile.createdAt, now),
    updatedAt: textValue(profile.updatedAt, now),
    data,
  };
};

export const createFinanceProfile = (name: string): FinanceProfile => {
  const now = new Date().toISOString();

  return {
    id: createId("profile"),
    name: name.trim(),
    createdAt: now,
    updatedAt: now,
    data: createBlankBudgetState(),
  };
};

export const loadFinanceProfiles = (): FinanceProfile[] => {
  try {
    const rawProfiles = window.localStorage.getItem(PROFILE_STORAGE_KEY);

    if (rawProfiles) {
      const parsedProfiles = JSON.parse(rawProfiles) as unknown;

      if (Array.isArray(parsedProfiles)) {
        return parsedProfiles
          .map((profile, index) => normalizeFinanceProfile(profile, index))
          .filter((profile): profile is FinanceProfile => profile !== null);
      }
    }

    const legacyState = loadSavedBudgetState();

    return legacyState
      ? [
          {
            id: "legacy-default-profile",
            name: "Default Profile",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            data: legacyState,
          },
        ]
      : [];
  } catch {
    return [];
  }
};

export const persistFinanceProfiles = (profiles: FinanceProfile[]) => {
  try {
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profiles));
  } catch {
    // Local storage can be unavailable in private windows or restricted contexts.
  }
};

export const loadActiveProfileId = () => {
  try {
    return window.localStorage.getItem(ACTIVE_PROFILE_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const persistActiveProfileId = (profileId: string | null) => {
  try {
    if (profileId) {
      window.localStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, profileId);
    } else {
      window.localStorage.removeItem(ACTIVE_PROFILE_STORAGE_KEY);
    }
  } catch {
    // Local storage can be unavailable in private windows or restricted contexts.
  }
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
