"use client";

import {
  type ChangeEvent,
  type FocusEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AccountsSection } from "@/components/AccountsSection";
import { BudgetSection } from "@/components/BudgetSection";
import { ContributionsSection } from "@/components/ContributionsSection";
import { DebtsSection } from "@/components/DebtsSection";
import { FinancialOverview } from "@/components/FinancialOverview";
import { RetirementProjectionSection } from "@/components/RetirementProjectionSection";
import {
  dangerButton,
  divider,
  inputBase,
  primaryButton,
  rowHover,
  secondaryButton,
  sectionDescription,
  sectionHeader,
  sectionTitle,
  surface,
  transparentInput,
} from "@/components/uiStyles";
import {
  calculateBudgetTotals,
  calculateIncomeUsedPercent,
  calculateMonthlyContributionWeightedReturn,
  getAvailableContributionAccounts,
  getContributionAccounts,
} from "@/lib/calculations/budget";
import { defaultReturnForAccount } from "@/lib/calculations/returns";
import { formatCurrency, getInitials } from "@/lib/formatting";
import { calculateRetirementProjection } from "@/lib/projections/retirement";
import {
  DEFAULT_BRAND_NAME,
  DEFAULT_DASHBOARD_TITLE,
  DEFAULT_MONTHLY_INCOME,
  accountSeed,
  actionSeed,
  budgetSeed,
  colorForIndex,
  colorOptions,
  debtSeed,
  investmentContributionSeed,
  navItems,
  retirementSeed,
} from "@/lib/storage/defaults";
import {
  createBudgetBackupFileName,
  createBudgetBackupJson,
  createDefaultBudgetState,
  loadSavedBudgetState,
  parseBudgetBackupJson,
  persistBudgetState,
} from "@/lib/storage/state";
import type {
  Account,
  ContributionReturns,
  InvestmentContributions,
  RetirementPlan,
  SavedBudgetState,
} from "@/types";

const scrollToSection = (id: string) => {
  document.getElementById(id)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
};

const createId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const defaultBudgetState = createDefaultBudgetState();
const THEME_STORAGE_KEY = "ian-capital-budget-theme";

type InterfaceTheme = "dark" | "light";

const isInterfaceTheme = (value: string | null): value is InterfaceTheme =>
  value === "dark" || value === "light";

export default function Home() {
  const [activeNav, setActiveNav] = useState(navItems[0]);
  const [interfaceTheme, setInterfaceTheme] =
    useState<InterfaceTheme>("dark");
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [accounts, setAccounts] = useState(defaultBudgetState.accounts);
  const [budgets, setBudgets] = useState(defaultBudgetState.budgets);
  const [debts, setDebts] = useState(defaultBudgetState.debts);
  const [goals, setGoals] = useState(defaultBudgetState.goals);
  const [brandName, setBrandName] = useState(DEFAULT_BRAND_NAME);
  const [dashboardTitle, setDashboardTitle] = useState(DEFAULT_DASHBOARD_TITLE);
  const [monthlyIncome, setMonthlyIncome] = useState(
    defaultBudgetState.monthlyIncome,
  );
  const [retirementPlan, setRetirementPlan] = useState(
    defaultBudgetState.retirementPlan,
  );
  const [investmentContributions, setInvestmentContributions] = useState(
    defaultBudgetState.investmentContributions,
  );
  const [contributionReturns, setContributionReturns] = useState(
    defaultBudgetState.contributionReturns,
  );
  const [completedActions, setCompletedActions] = useState<string[]>([]);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [openColorPicker, setOpenColorPicker] = useState<string | null>(null);
  const [showContributionAccountPicker, setShowContributionAccountPicker] =
    useState(false);
  const [selectedContributionAccountId, setSelectedContributionAccountId] =
    useState("");
  const importFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      const savedState = loadSavedBudgetState();
      const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

      if (isInterfaceTheme(savedTheme)) {
        setInterfaceTheme(savedTheme);
      }

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

  useEffect(() => {
    document.documentElement.dataset.theme = interfaceTheme;
  }, [interfaceTheme]);

  const getCurrentState = (
    nextState: Partial<SavedBudgetState> = {},
  ): SavedBudgetState => ({
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
    });

  const restoreState = (nextState: SavedBudgetState) => {
    setBrandName(nextState.brandName);
    setDashboardTitle(nextState.dashboardTitle);
    setAccounts(nextState.accounts);
    setBudgets(nextState.budgets);
    setDebts(nextState.debts);
    setGoals(nextState.goals);
    setMonthlyIncome(nextState.monthlyIncome);
    setRetirementPlan(nextState.retirementPlan);
    setInvestmentContributions(nextState.investmentContributions);
    setContributionReturns(nextState.contributionReturns);
    setCompletedActions(nextState.completedActions);
    persistBudgetState(nextState);
    setLastSavedAt(new Date());
  };

  const saveState = (nextState: Partial<SavedBudgetState>) => {
    const stateToSave = getCurrentState(nextState);

    persistBudgetState(stateToSave);
    setLastSavedAt(new Date());
  };

  const updateInterfaceTheme = (theme: InterfaceTheme) => {
    setInterfaceTheme(theme);

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Local storage can be unavailable in private windows or restricted contexts.
    }
  };

  const exportData = () => {
    const backupJson = createBudgetBackupJson(getCurrentState());
    const blob = new Blob([backupJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = createBudgetBackupFileName();
    link.click();
    URL.revokeObjectURL(url);
  };

  const startImportData = () => {
    importFileInputRef.current?.click();
  };

  const importData = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const importResult = parseBudgetBackupJson(await file.text());

    if (!importResult.ok) {
      window.alert(`Import failed: ${importResult.error}`);
      return;
    }

    const shouldImport = window.confirm(
      "Importing this backup will overwrite your current local Budget App data on this device. Continue?",
    );

    if (!shouldImport) {
      return;
    }

    restoreState(importResult.state);
  };

  const totals = useMemo(
    () =>
      calculateBudgetTotals({
        accounts,
        budgets,
        debts,
        investmentContributions,
        monthlyIncome,
      }),
    [accounts, budgets, debts, investmentContributions, monthlyIncome],
  );

  const contributionAccounts = useMemo(
    () => getContributionAccounts(accounts, investmentContributions),
    [accounts, investmentContributions],
  );

  const availableContributionAccounts = useMemo(
    () => getAvailableContributionAccounts(accounts, investmentContributions),
    [accounts, investmentContributions],
  );

  const monthlyContributionWeightedReturn = useMemo(
    () =>
      calculateMonthlyContributionWeightedReturn({
        contributionAccounts,
        contributionReturns,
        investmentContributions,
        monthlyInvestment: totals.monthlyInvestment,
        retirementAnnualReturn: retirementPlan.annualReturn,
      }),
    [
      contributionAccounts,
      contributionReturns,
      investmentContributions,
      retirementPlan.annualReturn,
      totals.monthlyInvestment,
    ],
  );

  const incomeUsedPercent = calculateIncomeUsedPercent({
    debtPayments: totals.debtPayments,
    monthlyBudget: totals.monthlyBudget,
    monthlyIncome,
    monthlyInvestment: totals.monthlyInvestment,
  });

  const retirementProjection = useMemo(
    () =>
      calculateRetirementProjection({
        contributionAccounts,
        contributionReturns,
        investmentContributions,
        retirementPlan,
        totals,
      }),
    [
      contributionAccounts,
      contributionReturns,
      investmentContributions,
      retirementPlan,
      totals,
    ],
  );

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
    setMonthlyIncome(DEFAULT_MONTHLY_INCOME);
    saveState({ budgets: budgetSeed, monthlyIncome: DEFAULT_MONTHLY_INCOME });
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
        className={`${sizeClass} rounded-full border border-white/50 shadow-sm transition hover:ring-2 hover:ring-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-300/40 ${currentColor}`}
      />
      {openColorPicker === pickerId ? (
        <div className="absolute left-0 top-6 z-30 flex gap-1.5 rounded-lg border border-white/10 bg-neutral-950/95 p-2 shadow-2xl backdrop-blur">
          {colorOptions.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => {
                onSelect(color);
                setOpenColorPicker(null);
              }}
              aria-label={`Use ${color.replace("bg-", "")} for ${label}`}
            className={`size-6 rounded-full border shadow-sm transition ${color} ${
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
    <main
      data-theme={interfaceTheme}
      className="min-h-screen bg-neutral-950 text-neutral-100"
    >
      <div className="flex min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.08),transparent_34%),linear-gradient(180deg,#0b0b0e_0%,#09090b_42%,#0b0b0d_100%)]">
        <aside className="sticky top-0 hidden h-screen w-72 shrink-0 overflow-y-auto border-r border-white/10 bg-neutral-950/80 px-6 py-6 backdrop-blur-xl lg:flex lg:flex-col">
          <div className="mb-5">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-emerald-400 text-lg font-black text-neutral-950">
                {getInitials(brandName)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-neutral-500">
                  Budget Tool
                </p>
                <label className="block">
                  <span className="sr-only">Brand name</span>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(event) => updateBrandName(event.target.value)}
                    className="w-full rounded-md border border-transparent bg-transparent px-1 py-0.5 text-lg font-semibold tracking-tight text-neutral-100 outline-none transition hover:border-white/10 hover:bg-white/[0.04] focus:border-emerald-300/60 focus:bg-neutral-950/70"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="mb-6 rounded-lg border border-white/10 bg-white/[0.04] p-4 shadow-[0_16px_50px_rgba(0,0,0,0.22)]">
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">
              Appearance
            </p>
            <div className="mt-3 grid grid-cols-2 gap-1 rounded-lg border border-white/10 bg-neutral-950/55 p-1">
              {(["dark", "light"] as const).map((theme) => (
                <button
                  key={theme}
                  type="button"
                  onClick={() => updateInterfaceTheme(theme)}
                  aria-pressed={interfaceTheme === theme}
                  className={`flex min-h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold capitalize transition ${
                    interfaceTheme === theme
                      ? "bg-white text-neutral-950 shadow-sm"
                      : "text-neutral-400 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="size-3 rounded-full"
                    style={{
                      backgroundColor: theme === "dark" ? "#1d1d1f" : "#0071e3",
                    }}
                  />
                  {theme}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-neutral-500">
              Current mode: {interfaceTheme}
            </p>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => handleNavClick(item)}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm transition ${
                  item === activeNav
                    ? "bg-white text-neutral-950 shadow-sm"
                    : "text-neutral-400 hover:bg-white/[0.06] hover:text-white"
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
          <header className="sticky top-0 z-10 border-b border-white/10 bg-neutral-950/78 px-4 py-4 backdrop-blur-xl md:px-8">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <label className="block">
                  <span className="sr-only">Brand name</span>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(event) => updateBrandName(event.target.value)}
                    className="w-full rounded-md border border-transparent bg-transparent px-1 py-0.5 text-sm font-medium text-neutral-400 outline-none transition hover:border-white/10 hover:bg-white/[0.04] focus:border-emerald-300/60 focus:bg-neutral-950/70 focus:text-neutral-200"
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
                    className="max-w-full rounded-md border border-transparent bg-transparent px-1 py-0.5 text-2xl font-semibold tracking-tight text-neutral-50 outline-none transition hover:border-white/10 hover:bg-white/[0.04] focus:border-emerald-300/60 focus:bg-neutral-950/70 md:text-3xl"
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
                <input
                  ref={importFileInputRef}
                  type="file"
                  accept="application/json,.json"
                  onChange={importData}
                  className="hidden"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={exportData}
                    className={secondaryButton}
                  >
                    Export Data
                  </button>
                  <button
                    type="button"
                    onClick={startImportData}
                    className={secondaryButton}
                  >
                    Import Data
                  </button>
                </div>
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

          <div className="mx-auto w-full max-w-7xl px-4 py-5 md:px-6 lg:px-8">
            <FinancialOverview
              retirementPlan={retirementPlan}
              retirementProjection={retirementProjection}
              totals={totals}
            />

            <section className="mt-4 space-y-4">
              <BudgetSection
                budgets={budgets}
                incomeUsedPercent={incomeUsedPercent}
                isEditingBudget={isEditingBudget}
                monthlyIncome={monthlyIncome}
                totals={totals}
                onAddBudget={addBudget}
                onDeleteBudget={deleteBudget}
                onResetBudget={resetBudget}
                onToggleEditingBudget={() =>
                  setIsEditingBudget((current) => !current)
                }
                onUpdateBudget={updateBudget}
                onUpdateMonthlyIncome={updateMonthlyIncome}
                renderColorPicker={renderColorPicker}
                selectNumberInput={selectNumberInput}
                contributionsSection={
                  <ContributionsSection
                    availableContributionAccounts={availableContributionAccounts}
                    contributionAccounts={contributionAccounts}
                    contributionReturns={contributionReturns}
                    investmentContributions={investmentContributions}
                    isAccountPickerOpen={showContributionAccountPicker}
                    monthlyContributionWeightedReturn={
                      monthlyContributionWeightedReturn
                    }
                    retirementPlan={retirementPlan}
                    selectedContributionAccountId={selectedContributionAccountId}
                    totals={totals}
                    onAddExistingContributionAccount={
                      addExistingContributionAccount
                    }
                    onAddInvestmentAccount={addInvestmentAccount}
                    onCancelAccountPicker={() => {
                      setShowContributionAccountPicker(false);
                      setSelectedContributionAccountId("");
                    }}
                    onRemoveContributionAccount={removeContributionAccount}
                    onResetInvestmentContributions={
                      resetInvestmentContributions
                    }
                    onSelectContributionAccount={setSelectedContributionAccountId}
                    onShowAccountPicker={() =>
                      setShowContributionAccountPicker(true)
                    }
                    onUpdateAccount={updateAccount}
                    onUpdateContributionReturn={updateContributionReturn}
                    onUpdateInvestmentContribution={updateInvestmentContribution}
                    renderColorPicker={renderColorPicker}
                    selectNumberInput={selectNumberInput}
                  />
                }
              />

              <div className="grid items-start gap-4">
                <AccountsSection
                  accounts={accounts}
                  contributionReturns={contributionReturns}
                  retirementPlan={retirementPlan}
                  onAddAccount={addAccount}
                  onResetAccounts={resetAccounts}
                  onUpdateAccount={updateAccount}
                  onUpdateContributionReturn={updateContributionReturn}
                  onDeleteAccount={deleteAccount}
                  renderColorPicker={renderColorPicker}
                  selectNumberInput={selectNumberInput}
                />

                <DebtsSection
                  debts={debts}
                  onAddDebt={addDebt}
                  onResetDebts={resetDebts}
                  onUpdateDebt={updateDebt}
                  onDeleteDebt={deleteDebt}
                  renderColorPicker={renderColorPicker}
                  selectNumberInput={selectNumberInput}
                />
              </div>
            </section>

            <RetirementProjectionSection
              retirementPlan={retirementPlan}
              retirementProjection={retirementProjection}
              totals={totals}
              onResetRetirementPlan={resetRetirementPlan}
              onUpdateRetirementPlan={updateRetirementPlan}
              selectNumberInput={selectNumberInput}
            />

            <section id="goals" className={`mt-4 scroll-mt-24 ${surface}`}>
              <div className={sectionHeader}>
                <div>
                  <h3 className={sectionTitle}>Goals</h3>
                  <p className={sectionDescription}>
                    Track the next actions that keep the plan moving.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={addGoal}
                    className={primaryButton}
                  >
                    Add goal
                  </button>
                  <button
                    type="button"
                    onClick={resetGoals}
                    className={secondaryButton}
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={exportActions}
                    className={secondaryButton}
                  >
                    Export
                  </button>
                </div>
              </div>

              <div className={divider}>
                {goals.map((goal) => {
                  const isDone = completedActions.includes(goal.id);

                  return (
                    <div
                      key={goal.id}
                      className={`grid w-full gap-3 px-4 py-3 text-left lg:grid-cols-[1fr_150px_140px_120px_auto_auto] lg:items-center ${rowHover}`}
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
                            className={`${transparentInput} w-full px-2 py-1 font-medium ${
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
                              className={`${inputBase} w-full px-2 py-1.5 text-sm text-neutral-300`}
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
                              className={`${inputBase} w-full px-2 py-1.5 text-sm text-neutral-300`}
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
                          className={`${inputBase} mt-1 w-full px-2 py-2 text-sm text-neutral-100`}
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs text-neutral-500">Amount</span>
                        <div className={`${inputBase} mt-1 flex items-center px-2`}>
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
                          className={secondaryButton}
                        >
                          {isDone ? "Reopen" : "Done"}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteGoal(goal.id)}
                          className={dangerButton}
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
