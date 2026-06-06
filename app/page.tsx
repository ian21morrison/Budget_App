"use client";

import {
  type ChangeEvent,
  type FocusEvent,
  useCallback,
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
import { MonthlyActualsSection } from "@/components/MonthlyActualsSection";
import { NetWorthHistorySection } from "@/components/NetWorthHistorySection";
import { RecurringBillsSection } from "@/components/RecurringBillsSection";
import { ReportSection } from "@/components/ReportSection";
import { RetirementProjectionSection } from "@/components/RetirementProjectionSection";
import { TransactionsSection } from "@/components/TransactionsSection";
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
  createMonthlyActualFromTransactions,
  calculateMonthlyActualTotals,
  calculateMonthlyContributionWeightedReturn,
  getAvailableContributionAccounts,
  getContributionAccounts,
} from "@/lib/calculations/budget";
import { calculateRecurringBillsSummary } from "@/lib/calculations/recurringBills";
import {
  createFinancialReport,
  createFinancialReportCsv,
} from "@/lib/calculations/reporting";
import { defaultReturnForAccount } from "@/lib/calculations/returns";
import { formatCurrency } from "@/lib/formatting";
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
  createNetWorthSnapshot,
  debtSeed,
  getCurrentDateKey,
  getCurrentMonthKey,
  getDefaultNextPaycheckDate,
  investmentContributionSeed,
  navItems,
  recurringBillSeed,
  retirementSeed,
} from "@/lib/storage/defaults";
import {
  createBudgetBackupFileName,
  createBudgetBackupJson,
  createDefaultBudgetState,
  createFinanceProfile,
  loadActiveProfileId,
  loadFinanceProfiles,
  parseBudgetBackupJson,
  persistActiveProfileId,
  persistFinanceProfiles,
} from "@/lib/storage/state";
import { parseTransactionCsv } from "@/lib/transactions/csv";
import type {
  Account,
  AccountAssetAllocation,
  AccountPurpose,
  AccountTaxTreatment,
  AccountType,
  ContributionReturns,
  FinanceProfile,
  InvestmentContributions,
  MonthlyActual,
  NetWorthSnapshot,
  RecurringBill,
  RetirementPlan,
  SavedBudgetState,
  Transaction,
} from "@/types";

const scrollToSection = (id: string) => {
  document.getElementById(id)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
};

const getNavItemId = (item: string) =>
  item.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const createId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const downloadFile = ({
  contents,
  fileName,
  type,
}: {
  contents: string;
  fileName: string;
  type: string;
}) => {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

const navGroups = [
  {
    label: "Overview",
    children: [],
  },
  {
    label: "Spending Plan",
    children: [
      { label: "Budget", id: "budget" },
      { label: "Recurring Bills", id: "recurring-bills" },
      { label: "Actuals", id: "actuals" },
      { label: "Transactions", id: "transactions" },
    ],
  },
  {
    label: "Balance Sheet",
    children: [
      { label: "Accounts", id: "accounts" },
      { label: "Debt", id: "debt" },
    ],
  },
  {
    label: "Long-Term Outlook",
    children: [
      { label: "Retirement", id: "retirement" },
      { label: "Net Worth History", id: "net-worth-history" },
    ],
  },
  {
    label: "Goals",
    children: [],
  },
] satisfies Array<{
  label: string;
  children: Array<{
    label: string;
    id: string;
  }>;
}>;

const getNextMonthKey = (month: string) => {
  const [year, monthIndex] = month.split("-").map(Number);
  const date = new Date(year, monthIndex, 1);

  return date.toISOString().slice(0, 7);
};

const getPreviousMonthKey = (month: string) => {
  const [year, monthIndex] = month.split("-").map(Number);
  const date = new Date(year, monthIndex - 2, 1);

  return date.toISOString().slice(0, 7);
};

const areBalanceRecordsEqual = (
  first: Record<string, number>,
  second: Record<string, number>,
) => {
  const keys = new Set([...Object.keys(first), ...Object.keys(second)]);

  return [...keys].every((key) => first[key] === second[key]);
};

const areSnapshotsEqual = (
  first: NetWorthSnapshot,
  second: NetWorthSnapshot,
) =>
  first.date === second.date &&
  areBalanceRecordsEqual(first.accountBalances, second.accountBalances) &&
  areBalanceRecordsEqual(first.debtBalances, second.debtBalances);

const defaultBudgetState = createDefaultBudgetState();
const THEME_STORAGE_KEY = "ian-capital-budget-theme";
const LEGACY_BRAND_NAMES = ["Ian Capital", "Compass"];

type InterfaceTheme = "dark" | "light";

const isInterfaceTheme = (value: string | null): value is InterfaceTheme =>
  value === "dark" || value === "light";

function AppLogo() {
  return (
    <div
      className="grid size-20 place-items-center rounded-lg border border-white/20 bg-[#fff] text-neutral-950 shadow-[0_18px_45px_rgba(0,0,0,0.22)]"
      aria-hidden="true"
    >
      <svg viewBox="0 0 32 32" className="size-14" fill="none">
        <path d="M5 21h22l-3.5 5H8.5L5 21Z" fill="#18181b" />
        <path
          d="M9 23.5h14"
          stroke="#ffffff"
          strokeLinecap="round"
          strokeWidth="1.6"
        />
        <path d="M15 6h2v15h-2V6Z" fill="#18181b" />
        <path d="M9 19h5V9l-5 10Z" fill="#18181b" />
        <path d="M18 19h6l-6-8v8Z" fill="#18181b" />
        <path d="M17 6h9l-2 3 2 3h-9V6Z" fill="#10b981" />
      </svg>
    </div>
  );
}

export default function Home() {
  const [activeNav, setActiveNav] = useState(navItems[0]);
  const [openNavGroups, setOpenNavGroups] = useState<string[]>([]);
  const [interfaceTheme, setInterfaceTheme] =
    useState<InterfaceTheme>("light");
  const [profiles, setProfiles] = useState<FinanceProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [lastActiveProfileId, setLastActiveProfileId] = useState<string | null>(
    null,
  );
  const [newProfileName, setNewProfileName] = useState("");
  const [profileError, setProfileError] = useState("");
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editingProfileName, setEditingProfileName] = useState("");
  const [profileRenameError, setProfileRenameError] = useState("");
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [accounts, setAccounts] = useState(defaultBudgetState.accounts);
  const [budgets, setBudgets] = useState(defaultBudgetState.budgets);
  const [debts, setDebts] = useState(defaultBudgetState.debts);
  const [goals, setGoals] = useState(defaultBudgetState.goals);
  const [recurringBills, setRecurringBills] = useState(
    defaultBudgetState.recurringBills,
  );
  const [nextPaycheckDate, setNextPaycheckDate] = useState(
    defaultBudgetState.nextPaycheckDate,
  );
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
  const [monthlyActuals, setMonthlyActuals] = useState(
    defaultBudgetState.monthlyActuals,
  );
  const [transactions, setTransactions] = useState(
    defaultBudgetState.transactions,
  );
  const [netWorthSnapshots, setNetWorthSnapshots] = useState(
    defaultBudgetState.netWorthSnapshots,
  );
  const [selectedActualMonth, setSelectedActualMonth] = useState(
    defaultBudgetState.monthlyActuals[0]?.month ?? getCurrentMonthKey(),
  );
  const [hasLoadedBudgetState, setHasLoadedBudgetState] = useState(false);
  const [completedActions, setCompletedActions] = useState<string[]>([]);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [openColorPicker, setOpenColorPicker] = useState<string | null>(null);
  const [showContributionAccountPicker, setShowContributionAccountPicker] =
    useState(false);
  const [selectedContributionAccountId, setSelectedContributionAccountId] =
    useState("");
  const importFileInputRef = useRef<HTMLInputElement>(null);
  const pendingNavItemRef = useRef<string | null>(null);
  const pendingNavTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      const savedProfiles = loadFinanceProfiles();
      const savedActiveProfileId = loadActiveProfileId();
      const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

      if (isInterfaceTheme(savedTheme)) {
        setInterfaceTheme(savedTheme);
      }

      setProfiles(savedProfiles);
      setLastActiveProfileId(savedActiveProfileId);
      setHasLoadedBudgetState(true);
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = interfaceTheme;
  }, [interfaceTheme]);

  useEffect(() => {
    const updateActiveNavFromScroll = () => {
      if (pendingNavItemRef.current) {
        return;
      }

      const scrollMarker = window.scrollY + 140;
      const currentItem = navItems.reduce((current, item) => {
        const section = document.getElementById(getNavItemId(item));

        if (!section || section.offsetTop > scrollMarker) {
          return current;
        }

        return item;
      }, navItems[0]);

      setActiveNav((current) =>
        current === currentItem ? current : currentItem,
      );
    };

    updateActiveNavFromScroll();
    window.addEventListener("scroll", updateActiveNavFromScroll, {
      passive: true,
    });
    window.addEventListener("resize", updateActiveNavFromScroll);

    return () => {
      window.removeEventListener("scroll", updateActiveNavFromScroll);
      window.removeEventListener("resize", updateActiveNavFromScroll);
      if (pendingNavTimerRef.current) {
        window.clearTimeout(pendingNavTimerRef.current);
      }
    };
  }, []);

  const getCurrentState = useCallback((
    nextState: Partial<SavedBudgetState> = {},
  ): SavedBudgetState => ({
      brandName: DEFAULT_BRAND_NAME,
      dashboardTitle: DEFAULT_DASHBOARD_TITLE,
      accounts,
      budgets,
      debts,
      goals,
      recurringBills,
      nextPaycheckDate,
      monthlyIncome,
      retirementPlan,
      investmentContributions,
      contributionReturns,
      monthlyActuals,
      transactions,
      netWorthSnapshots,
      completedActions,
      ...nextState,
    }), [
      accounts,
      budgets,
      debts,
      goals,
      recurringBills,
      nextPaycheckDate,
      monthlyIncome,
      retirementPlan,
      investmentContributions,
      contributionReturns,
      monthlyActuals,
      transactions,
      netWorthSnapshots,
      completedActions,
    ]);

  const applyStateToDashboard = (nextState: SavedBudgetState) => {
    const stateToRestore = {
      ...nextState,
      dashboardTitle: DEFAULT_DASHBOARD_TITLE,
    };

    setAccounts(stateToRestore.accounts);
    setBudgets(stateToRestore.budgets);
    setDebts(stateToRestore.debts);
    setGoals(stateToRestore.goals);
    setRecurringBills(stateToRestore.recurringBills);
    setNextPaycheckDate(stateToRestore.nextPaycheckDate);
    setMonthlyIncome(stateToRestore.monthlyIncome);
    setRetirementPlan(stateToRestore.retirementPlan);
    setInvestmentContributions(stateToRestore.investmentContributions);
    setContributionReturns(stateToRestore.contributionReturns);
    setMonthlyActuals(stateToRestore.monthlyActuals);
    setTransactions(stateToRestore.transactions);
    setNetWorthSnapshots(stateToRestore.netWorthSnapshots);
    setSelectedActualMonth(
      stateToRestore.monthlyActuals[0]?.month ?? getCurrentMonthKey(),
    );
    setCompletedActions(stateToRestore.completedActions);
    setLastSavedAt(new Date());
  };

  const saveState = (nextState: Partial<SavedBudgetState>) => {
    if (!activeProfileId) {
      return;
    }

    const stateToSave = getCurrentState(nextState);
    const now = new Date().toISOString();
    const nextProfiles = profiles.map((profile) =>
      profile.id === activeProfileId
        ? {
            ...profile,
            updatedAt: now,
            data: stateToSave,
          }
        : profile,
    );

    setProfiles(nextProfiles);
    persistFinanceProfiles(nextProfiles);
    setLastSavedAt(new Date());
  };

  const activeProfile = useMemo(
    () => profiles.find((profile) => profile.id === activeProfileId) ?? null,
    [activeProfileId, profiles],
  );

  const selectProfile = (profileId: string) => {
    const selectedProfile = profiles.find((profile) => profile.id === profileId);

    if (!selectedProfile) {
      return;
    }

    const profileData = {
      ...selectedProfile.data,
      brandName: DEFAULT_BRAND_NAME,
      dashboardTitle: DEFAULT_DASHBOARD_TITLE,
    };
    const shouldNormalizeBrand =
      LEGACY_BRAND_NAMES.includes(selectedProfile.data.brandName) ||
      selectedProfile.data.brandName !== DEFAULT_BRAND_NAME ||
      selectedProfile.data.dashboardTitle !== DEFAULT_DASHBOARD_TITLE;
    const nextProfiles = shouldNormalizeBrand
      ? profiles.map((profile) =>
          profile.id === profileId
            ? {
                ...profile,
                data: profileData,
              }
            : profile,
        )
      : profiles;

    setProfiles(nextProfiles);
    persistFinanceProfiles(nextProfiles);
    setActiveProfileId(profileId);
    setLastActiveProfileId(profileId);
    persistActiveProfileId(profileId);
    applyStateToDashboard(profileData);
    setActiveNav(navItems[0]);
    setOpenNavGroups([]);
  };

  const createProfile = () => {
    const trimmedName = newProfileName.trim();

    if (!trimmedName) {
      setProfileError("Enter a profile name.");
      return;
    }

    if (
      profiles.some(
        (profile) => profile.name.toLowerCase() === trimmedName.toLowerCase(),
      )
    ) {
      setProfileError("A profile with that name already exists.");
      return;
    }

    const nextProfile = createFinanceProfile(trimmedName);
    const nextProfiles = [...profiles, nextProfile];

    setProfiles(nextProfiles);
    persistFinanceProfiles(nextProfiles);
    setNewProfileName("");
    setProfileError("");
    setActiveProfileId(nextProfile.id);
    setLastActiveProfileId(nextProfile.id);
    persistActiveProfileId(nextProfile.id);
    applyStateToDashboard(nextProfile.data);
    setActiveNav(navItems[0]);
    setOpenNavGroups([]);
  };

  const startEditingProfile = (profile: FinanceProfile) => {
    setEditingProfileId(profile.id);
    setEditingProfileName(profile.name);
    setProfileRenameError("");
  };

  const cancelEditingProfile = () => {
    setEditingProfileId(null);
    setEditingProfileName("");
    setProfileRenameError("");
  };

  const saveProfileName = (profileId: string) => {
    const trimmedName = editingProfileName.trim();

    if (!trimmedName) {
      setProfileRenameError("Enter a profile name.");
      return;
    }

    if (
      profiles.some(
        (profile) =>
          profile.id !== profileId &&
          profile.name.toLowerCase() === trimmedName.toLowerCase(),
      )
    ) {
      setProfileRenameError("A profile with that name already exists.");
      return;
    }

    const now = new Date().toISOString();
    const nextProfiles = profiles.map((profile) =>
      profile.id === profileId
        ? {
            ...profile,
            name: trimmedName,
            updatedAt: now,
          }
        : profile,
    );

    setProfiles(nextProfiles);
    persistFinanceProfiles(nextProfiles);
    cancelEditingProfile();
  };

  const returnToProfiles = () => {
    setActiveProfileId(null);
    setOpenColorPicker(null);
    setShowContributionAccountPicker(false);
    setSelectedContributionAccountId("");
  };

  useEffect(() => {
    if (!hasLoadedBudgetState) {
      return;
    }

    const trackTimer = window.setTimeout(() => {
      if (!activeProfileId || (accounts.length === 0 && debts.length === 0)) {
        return;
      }

      const todaySnapshot = createNetWorthSnapshot(
        getCurrentDateKey(),
        accounts,
        debts,
      );
      const existingSnapshot = netWorthSnapshots.find(
        (snapshot) => snapshot.date === todaySnapshot.date,
      );

      if (existingSnapshot && areSnapshotsEqual(existingSnapshot, todaySnapshot)) {
        return;
      }

      const nextSnapshots = [
        todaySnapshot,
        ...netWorthSnapshots.filter(
          (snapshot) => snapshot.date !== todaySnapshot.date,
        ),
      ].sort((first, second) => first.date.localeCompare(second.date));

      setNetWorthSnapshots(nextSnapshots);
      const stateToSave = getCurrentState({ netWorthSnapshots: nextSnapshots });
      const now = new Date().toISOString();
      const nextProfiles = profiles.map((profile) =>
        profile.id === activeProfileId
          ? {
              ...profile,
              updatedAt: now,
              data: stateToSave,
            }
          : profile,
      );

      setProfiles(nextProfiles);
      persistFinanceProfiles(nextProfiles);
      setLastSavedAt(new Date());
    }, 0);

    return () => window.clearTimeout(trackTimer);
  }, [
    accounts,
    activeProfileId,
    debts,
    getCurrentState,
    hasLoadedBudgetState,
    netWorthSnapshots,
    profiles,
  ]);

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

    downloadFile({
      contents: backupJson,
      fileName: createBudgetBackupFileName(),
      type: "application/json",
    });
  };

  const generateReport = () => {
    scrollToSection("reporting");
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

    applyStateToDashboard(importResult.state);
    saveState(importResult.state);
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

  const createActualFromCurrentPlan = useCallback(
    (month: string): MonthlyActual => ({
      month,
      income: monthlyIncome,
      budgetActuals: budgets.reduce<Record<string, number>>((next, budget) => {
        next[budget.id] = -budget.amount;
        return next;
      }, {}),
      transfers: 0,
      debtPayments: -totals.debtPayments,
      contributions: -totals.monthlyInvestment,
    }),
    [budgets, monthlyIncome, totals.debtPayments, totals.monthlyInvestment],
  );

  const selectedMonthlyActual = useMemo(() => {
    const existingActual = monthlyActuals.find(
      (actual) => actual.month === selectedActualMonth,
    );

    return existingActual ?? createActualFromCurrentPlan(selectedActualMonth);
  }, [
    createActualFromCurrentPlan,
    monthlyActuals,
    selectedActualMonth,
  ]);

  const monthlyActualTotals = useMemo(
    () =>
      calculateMonthlyActualTotals({
        actual: selectedMonthlyActual,
        totals,
      }),
    [selectedMonthlyActual, totals],
  );

  const recurringBillsSummary = useMemo(
    () =>
      calculateRecurringBillsSummary({
        recurringBills,
        nextPaycheckDate,
      }),
    [nextPaycheckDate, recurringBills],
  );

  const transactionMonthlyActual = useMemo(
    () =>
      createMonthlyActualFromTransactions({
        month: selectedActualMonth,
        planActual: createActualFromCurrentPlan(selectedActualMonth),
        budgets,
        transactions,
      }),
    [budgets, createActualFromCurrentPlan, selectedActualMonth, transactions],
  );

  const minimumActualMonth = useMemo(() => {
    const monthKeys = [
      getCurrentMonthKey(),
      ...monthlyActuals.map((actual) => actual.month),
      ...transactions.map((transaction) => transaction.date.slice(0, 7)),
    ].filter(Boolean);

    return monthKeys.reduce((earliest, month) =>
      month < earliest ? month : earliest,
    );
  }, [monthlyActuals, transactions]);
  const canGoToPreviousActualMonth = selectedActualMonth > minimumActualMonth;

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

  const financialReport = useMemo(
    () =>
      createFinancialReport({
        budgets,
        debts,
        monthlyActual: selectedMonthlyActual,
        monthlyActualTotals,
        monthlyIncome,
        netWorthSnapshots,
        retirementPlan,
        retirementProjection,
        selectedMonth: selectedActualMonth,
        totals,
      }),
    [
      budgets,
      debts,
      monthlyActualTotals,
      monthlyIncome,
      netWorthSnapshots,
      retirementPlan,
      retirementProjection,
      selectedActualMonth,
      selectedMonthlyActual,
      totals,
    ],
  );

  const downloadReportCsv = () => {
    downloadFile({
      contents: createFinancialReportCsv(financialReport),
      fileName: `financial-report-${selectedActualMonth}.csv`,
      type: "text/csv;charset=utf-8",
    });
  };

  const exportReportPdf = () => {
    scrollToSection("reporting");
    window.setTimeout(() => window.print(), 150);
  };

  const scrollToNavTarget = (activeItem: string, targetId: string) => {
    if (pendingNavTimerRef.current) {
      window.clearTimeout(pendingNavTimerRef.current);
    }

    pendingNavItemRef.current = activeItem;
    setActiveNav(activeItem);
    scrollToSection(targetId);
    pendingNavTimerRef.current = window.setTimeout(() => {
      pendingNavItemRef.current = null;
      pendingNavTimerRef.current = null;
    }, 700);
  };

  const handleNavClick = (item: string) => {
    scrollToNavTarget(item, getNavItemId(item));
  };

  const toggleNavGroup = (item: string) => {
    setOpenNavGroups((current) =>
      current.includes(item)
        ? current.filter((group) => group !== item)
        : [...current, item],
    );
  };

  const handleNavChildClick = (parentItem: string, childId: string) => {
    scrollToNavTarget(parentItem, childId);
  };

  const updateAccount = (
    accountId: string,
    field:
      | "name"
      | "institution"
      | "balance"
      | "type"
      | "taxTreatment"
      | "purpose"
      | "emergencyFundTarget"
      | "annualContributionLimit"
      | "yearToDateContribution"
      | "projectedAnnualIncomeRate"
      | "notes"
      | "accent",
    value: string | number | AccountType | AccountTaxTreatment | AccountPurpose,
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

  const updateAccountAllocation = (
    accountId: string,
    field: keyof AccountAssetAllocation,
    value: number,
  ) => {
    const nextAccounts = accounts.map((account) =>
      account.id === accountId
        ? {
            ...account,
            allocation: {
              ...account.allocation,
              [field]: value,
            },
          }
        : account,
    );

    setAccounts(nextAccounts);
    saveState({ accounts: nextAccounts });
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
        notes: "",
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
        taxTreatment: "taxable",
        purpose: "taxableInvesting",
        allocation: {
          stocks: 80,
          bonds: 10,
          cash: 5,
          alternatives: 5,
        },
        emergencyFundTarget: 0,
        annualContributionLimit: 0,
        yearToDateContribution: 0,
        projectedAnnualIncomeRate: 2,
        notes: "",
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

  const updateRecurringBill = (
    billId: string,
    field:
      | "name"
      | "category"
      | "dueDate"
      | "cadence"
      | "expectedAmount"
      | "isPaid"
      | "autopay",
    value: string | number | boolean,
  ) => {
    const nextRecurringBills = recurringBills.map((bill) =>
      bill.id === billId ? { ...bill, [field]: value } : bill,
    );

    setRecurringBills(nextRecurringBills);
    saveState({ recurringBills: nextRecurringBills });
  };

  const addRecurringBill = () => {
    const nextRecurringBills: RecurringBill[] = [
      ...recurringBills,
      {
        id: createId("bill"),
        name: "New recurring bill",
        category: "Bills",
        dueDate: getCurrentDateKey(),
        cadence: "monthly",
        expectedAmount: 0,
        isPaid: false,
        autopay: false,
      },
    ];

    setRecurringBills(nextRecurringBills);
    saveState({ recurringBills: nextRecurringBills });
  };

  const deleteRecurringBill = (billId: string) => {
    const nextRecurringBills = recurringBills.filter((bill) => bill.id !== billId);

    setRecurringBills(nextRecurringBills);
    saveState({ recurringBills: nextRecurringBills });
  };

  const updateNextPaycheckDate = (date: string) => {
    const nextDate = date || getDefaultNextPaycheckDate();

    setNextPaycheckDate(nextDate);
    saveState({ nextPaycheckDate: nextDate });
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

  const updateMonthlyActuals = (nextActual: MonthlyActual) => {
    const hasExistingActual = monthlyActuals.some(
      (actual) => actual.month === nextActual.month,
    );
    const nextActuals = hasExistingActual
      ? monthlyActuals.map((actual) =>
          actual.month === nextActual.month ? nextActual : actual,
        )
      : [nextActual, ...monthlyActuals];

    setMonthlyActuals(nextActuals);
    setSelectedActualMonth(nextActual.month);
    saveState({ monthlyActuals: nextActuals });
  };

  const updateActualField = (
    field: "income" | "transfers" | "debtPayments" | "contributions",
    value: number,
  ) => {
    updateMonthlyActuals({
      ...selectedMonthlyActual,
      [field]: value,
    });
  };

  const updateActualBudget = (budgetId: string, amount: number) => {
    updateMonthlyActuals({
      ...selectedMonthlyActual,
      budgetActuals: {
        ...selectedMonthlyActual.budgetActuals,
        [budgetId]: amount,
      },
    });
  };

  const resetSelectedActualMonthFromPlan = () => {
    updateMonthlyActuals(createActualFromCurrentPlan(selectedActualMonth));
  };

  const addTransaction = () => {
    const nextTransactions: Transaction[] = [
      {
        id: createId("transaction"),
        date: `${selectedActualMonth}-01`,
        description: "New transaction",
        amount: 0,
        categoryType: "uncategorized",
        budgetId: "",
        accountId: "",
        notes: "",
      },
      ...transactions,
    ];

    setTransactions(nextTransactions);
    saveState({ transactions: nextTransactions });
  };

  const updateTransaction = (
    transactionId: string,
    nextTransaction: Partial<Transaction>,
  ) => {
    const nextTransactions = transactions.map((transaction) =>
      transaction.id === transactionId
        ? {
            ...transaction,
            ...nextTransaction,
          }
        : transaction,
    );

    setTransactions(nextTransactions);
    saveState({ transactions: nextTransactions });
  };

  const deleteTransaction = (transactionId: string) => {
    const nextTransactions = transactions.filter(
      (transaction) => transaction.id !== transactionId,
    );

    setTransactions(nextTransactions);
    saveState({ transactions: nextTransactions });
  };

  const importTransactionCsv = (csv: string) => {
    const importResult = parseTransactionCsv({
      accounts,
      budgets,
      csv,
      idPrefix: createId("import"),
    });

    if (importResult.transactions.length === 0) {
      window.alert("No valid transactions were found in that CSV.");
      return;
    }

    const nextTransactions = [
      ...importResult.transactions,
      ...transactions,
    ].sort((first, second) => second.date.localeCompare(first.date));

    setTransactions(nextTransactions);
    setSelectedActualMonth(importResult.transactions[0].date.slice(0, 7));
    saveState({ transactions: nextTransactions });

    if (importResult.skippedRows > 0) {
      window.alert(
        `Imported ${importResult.transactions.length} transactions and skipped ${importResult.skippedRows} rows.`,
      );
    }
  };

  const downloadTransactionCsvTemplate = () => {
    const sampleBudget = budgets[0];
    const sampleAccount = accounts[0];
    const rows = [
      ["date", "description", "amount", "category", "account", "notes"],
      [
        getCurrentDateKey(),
        "Paycheck",
        "2500",
        "Income",
        sampleAccount?.name ?? "",
        "Income is imported as actual income",
      ],
      [
        getCurrentDateKey(),
        sampleBudget ? `${sampleBudget.label} purchase` : "Budget purchase",
        "-45.67",
        sampleBudget?.label ?? "Groceries",
        sampleAccount?.name ?? "",
        "Use an existing budget category name",
      ],
      [
        getCurrentDateKey(),
        "Roth IRA contribution",
        "-625",
        "Investment contribution",
        sampleAccount?.name ?? "",
        "Special categories also include Transfer and Debt payment",
      ],
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
    link.download = "transaction-import-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const applyTransactionsToActuals = () => {
    const monthlyTransactions = transactions.filter((transaction) =>
      transaction.date.startsWith(selectedActualMonth),
    );
    const budgetSums = monthlyTransactions.reduce<Record<string, number>>(
      (next, transaction) => {
        if (transaction.categoryType === "budget" && transaction.budgetId) {
          next[transaction.budgetId] =
            (next[transaction.budgetId] ?? 0) + transaction.amount;
        }

        return next;
      },
      {},
    );
    const sumByCategory = (categoryType: Transaction["categoryType"]) =>
      monthlyTransactions
        .filter((transaction) => transaction.categoryType === categoryType)
        .reduce((total, transaction) => total + transaction.amount, 0);
    const hasCategory = (categoryType: Transaction["categoryType"]) =>
      monthlyTransactions.some(
        (transaction) => transaction.categoryType === categoryType,
      );

    updateMonthlyActuals({
      ...selectedMonthlyActual,
      income: hasCategory("income")
        ? sumByCategory("income")
        : selectedMonthlyActual.income,
      transfers: hasCategory("transfer")
        ? sumByCategory("transfer")
        : selectedMonthlyActual.transfers,
      debtPayments: hasCategory("debtPayment")
        ? sumByCategory("debtPayment")
        : selectedMonthlyActual.debtPayments,
      contributions: hasCategory("contribution")
        ? sumByCategory("contribution")
        : selectedMonthlyActual.contributions,
      budgetActuals: {
        ...selectedMonthlyActual.budgetActuals,
        ...budgetSums,
      },
    });
  };

  const selectActualMonth = (month: string) => {
    if (!month) {
      return;
    }

    setSelectedActualMonth(
      month < minimumActualMonth ? minimumActualMonth : month,
    );
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

  const resetRecurringBills = () => {
    const nextPaycheck = getDefaultNextPaycheckDate();

    setRecurringBills(recurringBillSeed);
    setNextPaycheckDate(nextPaycheck);
    saveState({
      recurringBills: recurringBillSeed,
      nextPaycheckDate: nextPaycheck,
    });
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

  if (!hasLoadedBudgetState) {
    return (
      <main
        data-theme={interfaceTheme}
        className="grid min-h-screen place-items-center bg-neutral-950 px-4 text-neutral-100"
      >
        <div className={`${surface} w-full max-w-md p-6 text-center`}>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-50">
            {DEFAULT_BRAND_NAME}
          </h1>
          <p className="mt-2 text-sm text-neutral-500">Loading profiles...</p>
        </div>
      </main>
    );
  }

  if (!activeProfileId) {
    return (
      <main
        data-theme={interfaceTheme}
        className="min-h-screen bg-neutral-950 text-neutral-100"
      >
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.08),transparent_34%),linear-gradient(180deg,#0b0b0e_0%,#09090b_42%,#0b0b0d_100%)] px-4 py-6 md:py-10">
          <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col justify-center gap-6">
            <div className="flex justify-end">
              <div className="flex w-fit gap-1.5 rounded-lg border border-white/10 bg-neutral-950/45 p-1.5 shadow-[0_12px_35px_rgba(0,0,0,0.18)]">
                {(["light", "dark"] as InterfaceTheme[]).map((theme) => (
                  <button
                    key={theme}
                    type="button"
                    onClick={() => updateInterfaceTheme(theme)}
                    className={`min-h-9 rounded-md px-3 text-sm font-semibold capitalize transition duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-300/40 ${
                      interfaceTheme === theme
                        ? "bg-white text-neutral-950 shadow-sm"
                        : "text-neutral-400 hover:-translate-y-0.5 hover:bg-white/[0.06] hover:text-neutral-100 hover:shadow-lg"
                    }`}
                  >
                    {theme}
                  </button>
                ))}
              </div>
            </div>

            <section className="overflow-hidden rounded-lg border border-white/10 bg-neutral-900/75 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
              <div className="grid gap-8 border-b border-white/10 px-5 py-8 md:px-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
                <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:text-left">
                  <AppLogo />
                  <div className="mt-5 sm:ml-5 sm:mt-0">
                    <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-300">
                      {DEFAULT_BRAND_NAME}
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-50 md:text-4xl">
                      A clear view of your finances.
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-400">
                      Choose a profile to keep each person, household, or
                      scenario completely separate.
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-white/10 bg-neutral-950/45 p-4">
                  <p className="text-sm font-semibold text-neutral-100">
                    Private local profiles
                  </p>
                  <p className="mt-2 text-sm leading-6 text-neutral-500">
                    Profiles save separately on this device, so one profile
                    never mixes accounts, budgets, transactions, or goals with
                    another.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 p-4 md:p-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                <div>
                  <div className="mb-3 flex flex-col gap-1 px-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h2 className={sectionTitle}>Select Profile</h2>
                      <p className={sectionDescription}>
                        Open a saved profile or rename it before entering.
                      </p>
                    </div>
                    <p className="text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">
                      {profiles.length} saved
                    </p>
                  </div>

                  <div className="grid gap-3">
                  {profiles.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-white/15 bg-neutral-950/45 px-5 py-10 text-center shadow-inner">
                      <div
                        className="mx-auto grid size-12 place-items-center rounded-lg border border-emerald-300/20 bg-emerald-300/10 text-2xl font-semibold text-emerald-300"
                        aria-hidden="true"
                      >
                        +
                      </div>
                      <p className="text-base font-semibold text-neutral-100">
                        No profiles yet
                      </p>
                      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">
                        Create your first profile to start with a blank budget,
                        empty accounts, and no previous dashboard values.
                      </p>
                    </div>
                  ) : (
                    profiles.map((profile) => {
                      const isEditingProfile = editingProfileId === profile.id;

                      return (
                        <div
                          key={profile.id}
                          className="group rounded-lg border border-white/10 bg-neutral-950/45 px-4 py-4 shadow-[0_10px_35px_rgba(0,0,0,0.14)] transition duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.04] hover:shadow-[0_18px_45px_rgba(0,0,0,0.2)]"
                        >
                          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                            <div className="min-w-0">
                              {isEditingProfile ? (
                                <form
                                  onSubmit={(event) => {
                                    event.preventDefault();
                                    saveProfileName(profile.id);
                                  }}
                                  className="grid gap-2"
                                >
                                  <label className="block">
                                    <span className="sr-only">
                                      Edit profile name
                                    </span>
                                    <input
                                      type="text"
                                      value={editingProfileName}
                                      onChange={(event) => {
                                        setEditingProfileName(event.target.value);
                                        setProfileRenameError("");
                                      }}
                                      className={`${inputBase} w-full px-3 py-2 text-base font-semibold`}
                                    />
                                  </label>
                                  {profileRenameError ? (
                                    <p className="text-sm text-rose-300">
                                      {profileRenameError}
                                    </p>
                                  ) : null}
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="submit"
                                      className="inline-flex min-h-9 items-center justify-center rounded-md bg-emerald-300 px-3 py-2 text-sm font-semibold text-neutral-950 transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-300/40"
                                    >
                                      Save
                                    </button>
                                    <button
                                      type="button"
                                      onClick={cancelEditingProfile}
                                      className="inline-flex min-h-9 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-medium text-neutral-300 transition duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.07] hover:text-white hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-white/15"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </form>
                              ) : (
                                <>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="truncate text-lg font-semibold text-neutral-50">
                                      {profile.name}
                                    </p>
                            {profile.id === lastActiveProfileId ? (
                              <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                                Last used
                              </span>
                            ) : null}
                                  </div>
                                  <p className="mt-1 text-sm text-neutral-500">
                                    Updated{" "}
                                    {new Date(
                                      profile.updatedAt,
                                    ).toLocaleDateString([], {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </p>
                                </>
                              )}
                            </div>

                            {!isEditingProfile ? (
                              <div className="flex flex-wrap gap-2 sm:justify-end">
                                <button
                                  type="button"
                                  onClick={() => startEditingProfile(profile)}
                                  className="inline-flex min-h-9 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-medium text-neutral-300 transition duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.07] hover:text-white hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-white/15"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => selectProfile(profile.id)}
                                  className="inline-flex min-h-9 items-center justify-center rounded-md bg-emerald-300 px-3 py-2 text-sm font-semibold text-neutral-950 transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-300/40"
                                >
                                  Open
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      );
                    })
                  )}
                  </div>
                </div>

                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    createProfile();
                  }}
                  className="h-fit rounded-lg border border-white/10 bg-neutral-950/45 p-4 shadow-[0_16px_50px_rgba(0,0,0,0.16)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-semibold text-neutral-100">
                        Create New Profile
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-neutral-500">
                        Start with a blank workspace.
                      </p>
                    </div>
                    <span className="rounded-md border border-white/10 px-2 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">
                      New
                    </span>
                  </div>
                  <label className="mt-4 block">
                    <span className="text-xs text-neutral-500">
                      Profile name
                    </span>
                    <input
                      type="text"
                      value={newProfileName}
                      onChange={(event) => {
                        setNewProfileName(event.target.value);
                        setProfileError("");
                      }}
                      className={`${inputBase} mt-1 w-full px-3 py-3 text-sm font-semibold`}
                      placeholder="Personal, Household, Rental..."
                    />
                  </label>
                  {profileError ? (
                    <p className="mt-2 text-sm text-rose-300">{profileError}</p>
                  ) : null}
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <button
                      type="submit"
                      className="inline-flex min-h-10 flex-1 items-center justify-center rounded-md bg-emerald-300 px-4 py-2 text-sm font-semibold text-neutral-950 transition duration-200 hover:bg-emerald-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-300/40"
                    >
                      Create Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNewProfileName("");
                        setProfileError("");
                      }}
                      className="inline-flex min-h-10 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-neutral-300 transition duration-200 hover:border-white/20 hover:bg-white/[0.07] hover:text-white focus:outline-none focus:ring-2 focus:ring-white/15"
                    >
                      Clear
                    </button>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-neutral-600">
                    No accounts, income, budgets, transactions, goals, or
                    history are copied in.
                  </p>
                </form>
              </div>
            </section>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      data-theme={interfaceTheme}
      className="min-h-screen bg-neutral-950 text-neutral-100"
    >
      <div className="flex min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.08),transparent_34%),linear-gradient(180deg,#0b0b0e_0%,#09090b_42%,#0b0b0d_100%)]">
        <aside
          data-report-hidden="true"
          className="sticky top-0 hidden h-screen w-72 shrink-0 overflow-y-auto border-r border-white/10 bg-neutral-950/80 px-6 py-6 backdrop-blur-xl lg:flex lg:flex-col"
        >
          <div className="mb-5">
            <div className="flex items-center gap-3">
              <div
                className="grid size-16 place-items-center rounded-lg border border-white/20 bg-[#fff] text-neutral-950 shadow-sm"
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 32 32"
                  className="size-12"
                  fill="none"
                >
                  <path
                    d="M5 21h22l-3.5 5H8.5L5 21Z"
                    fill="#18181b"
                  />
                  <path
                    d="M9 23.5h14"
                    stroke="#ffffff"
                    strokeLinecap="round"
                    strokeWidth="1.6"
                  />
                  <path d="M15 6h2v15h-2V6Z" fill="#18181b" />
                  <path d="M9 19h5V9l-5 10Z" fill="#18181b" />
                  <path d="M18 19h6l-6-8v8Z" fill="#18181b" />
                  <path d="M17 6h9l-2 3 2 3h-9V6Z" fill="#10b981" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-semibold tracking-tight text-neutral-50">
                  Crow&apos;s Nest
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6 rounded-lg border border-white/10 bg-white/[0.04] p-4 shadow-[0_16px_50px_rgba(0,0,0,0.22)]">
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">
              Appearance
            </p>
            <div className="mt-3 grid grid-cols-2 gap-1 rounded-lg border border-white/10 bg-neutral-950/55 p-1">
              {(["light", "dark"] as const).map((theme) => (
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

          <nav className="space-y-2">
            {navGroups.map((group) => {
              const isActive = group.label === activeNav;
              const hasChildren = group.children.length > 0;
              const isOpen = openNavGroups.includes(group.label);

              return (
                <div key={group.label} className="relative">
                  <div
                    className={`group flex w-full items-center justify-between rounded-lg border text-sm transition ${
                      isActive
                        ? "border-white/15 bg-white text-neutral-950 shadow-[0_12px_30px_rgba(0,0,0,0.22)]"
                        : "border-transparent bg-transparent text-neutral-400 hover:border-white/10 hover:bg-white/[0.055] hover:text-neutral-100"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`absolute left-0 top-2 h-6 w-1 rounded-r-full transition ${
                        isActive ? "bg-emerald-400" : "bg-transparent"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => handleNavClick(group.label)}
                      className="min-h-11 min-w-0 flex-1 px-3.5 py-2.5 text-left font-semibold"
                    >
                      {group.label}
                    </button>
                    <span className="flex items-center gap-1.5 pr-1.5">
                      {isActive ? (
                        <span className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.16)]" />
                      ) : null}
                      {hasChildren ? (
                        <button
                          type="button"
                          onClick={() => toggleNavGroup(group.label)}
                          aria-expanded={isOpen}
                          aria-label={`${isOpen ? "Collapse" : "Expand"} ${group.label}`}
                          className={`grid min-h-9 w-9 place-items-center rounded-md transition focus:outline-none focus:ring-2 focus:ring-emerald-300/30 ${
                            isActive
                              ? "hover:bg-black/5"
                              : "hover:bg-white/[0.07] hover:text-white"
                          }`}
                        >
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 20 20"
                            className={`size-4 transition ${
                              isOpen ? "rotate-180" : ""
                            }`}
                            fill="none"
                          >
                            <path
                              d="M5.5 8 10 12.5 14.5 8"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="1.8"
                            />
                          </svg>
                        </button>
                      ) : null}
                    </span>
                  </div>
                  {hasChildren && isOpen ? (
                    <div className="ml-4 mt-1.5 grid gap-1 border-l border-white/10 pl-3">
                      {group.children.map((child) => (
                        <button
                          key={child.id}
                          type="button"
                          onClick={() =>
                            handleNavChildClick(group.label, child.id)
                          }
                          className="rounded-md px-3 py-2 text-left text-xs font-semibold text-neutral-500 transition hover:bg-white/[0.055] hover:text-neutral-100"
                        >
                          {child.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>

        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b border-white/10 bg-neutral-950/78 px-4 py-4 backdrop-blur-xl md:px-8">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h1 className="px-1 py-0.5 text-2xl font-semibold tracking-tight text-neutral-50 md:text-3xl">
                  {DEFAULT_DASHBOARD_TITLE}
                </h1>
                <p className="mt-1 px-1 text-sm text-neutral-500">
                  {activeProfile
                    ? `${activeProfile.name} profile`
                    : "Profile selected"}{" "}
                  ·{" "}
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
                <div data-report-hidden="true" className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={returnToProfiles}
                    className={secondaryButton}
                  >
                    Switch Profile
                  </button>
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
                  <button
                    type="button"
                    onClick={generateReport}
                    className={primaryButton}
                  >
                    Generate Report
                  </button>
                </div>
                <div
                  data-report-hidden="true"
                  className="flex max-w-full gap-1.5 overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/45 p-1.5 shadow-[0_12px_35px_rgba(0,0,0,0.18)] lg:hidden"
                >
                  {navGroups.flatMap((group) => {
                    const isActive = group.label === activeNav;
                    const hasChildren = group.children.length > 0;
                    const isOpen = openNavGroups.includes(group.label);
                    const parentButton = (
                      <div
                        key={group.label}
                        className={`flex min-h-10 shrink-0 items-center whitespace-nowrap rounded-md border text-sm transition ${
                          isActive
                            ? "border-white/15 bg-white text-neutral-950 shadow-sm"
                            : "border-transparent text-neutral-400 hover:border-white/10 hover:bg-white/[0.055] hover:text-neutral-100"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleNavClick(group.label)}
                          className="min-h-10 px-3 py-2 text-left font-semibold"
                        >
                          {group.label}
                        </button>
                        {hasChildren ? (
                          <button
                            type="button"
                            onClick={() => toggleNavGroup(group.label)}
                            aria-expanded={isOpen}
                            aria-label={`${isOpen ? "Collapse" : "Expand"} ${group.label}`}
                            className={`grid min-h-10 w-9 place-items-center rounded-md transition ${
                              isActive
                                ? "hover:bg-black/5"
                                : "hover:bg-white/[0.07] hover:text-white"
                            }`}
                          >
                            <svg
                              aria-hidden="true"
                              viewBox="0 0 20 20"
                              className={`size-4 transition ${
                                isOpen ? "rotate-180" : ""
                              }`}
                              fill="none"
                            >
                              <path
                                d="M5.5 8 10 12.5 14.5 8"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.8"
                              />
                            </svg>
                          </button>
                        ) : null}
                      </div>
                    );

                    if (!hasChildren || !isOpen) {
                      return [parentButton];
                    }

                    return [
                      parentButton,
                      ...group.children.map((child) => (
                        <button
                          key={`${group.label}-${child.id}`}
                          type="button"
                          onClick={() =>
                            handleNavChildClick(group.label, child.id)
                          }
                          className="min-h-10 shrink-0 whitespace-nowrap rounded-md border border-white/10 bg-white/[0.025] px-3 py-2 text-xs font-semibold text-neutral-500 transition hover:border-white/15 hover:bg-white/[0.055] hover:text-neutral-100"
                        >
                          {child.label}
                        </button>
                      )),
                    ];
                  })}
                </div>
              </div>
            </div>
          </header>

          <div
            data-dashboard-report="true"
            className="mx-auto w-full max-w-7xl px-4 py-5 md:px-6 lg:px-8"
          >
            <FinancialOverview
              netWorthSnapshots={netWorthSnapshots}
              recurringBillsSummary={recurringBillsSummary}
              retirementPlan={retirementPlan}
              retirementProjection={retirementProjection}
              totals={totals}
            />

            <div className="mt-5">
              <ReportSection
                report={financialReport}
                onDownloadCsv={downloadReportCsv}
                onExportPdf={exportReportPdf}
              />
            </div>

            <section id="spending-plan" className="mt-5 scroll-mt-24">
              <div className="mb-3 px-1">
                <h2 className="text-lg font-semibold tracking-tight text-neutral-50">
                  Spending Plan
                </h2>
                <p className="mt-1 text-sm leading-6 text-neutral-500">
                  Plan the month, record actuals, and apply transaction detail.
                </p>
              </div>

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

              <RecurringBillsSection
                nextPaycheckDate={nextPaycheckDate}
                recurringBills={recurringBills}
                summary={recurringBillsSummary}
                onAddBill={addRecurringBill}
                onDeleteBill={deleteRecurringBill}
                onResetBills={resetRecurringBills}
                onUpdateBill={updateRecurringBill}
                onUpdateNextPaycheckDate={updateNextPaycheckDate}
                selectNumberInput={selectNumberInput}
              />

              <MonthlyActualsSection
                actual={selectedMonthlyActual}
                actualTotals={monthlyActualTotals}
                budgets={budgets}
                canGoToPreviousMonth={canGoToPreviousActualMonth}
                minMonth={minimumActualMonth}
                totals={totals}
                onGoToNextMonth={() =>
                  selectActualMonth(getNextMonthKey(selectedActualMonth))
                }
                onGoToPreviousMonth={() =>
                  selectActualMonth(
                    getPreviousMonthKey(selectedActualMonth),
                  )
                }
                onResetMonthFromPlan={resetSelectedActualMonthFromPlan}
                onSelectMonth={selectActualMonth}
                onUpdateActualBudget={updateActualBudget}
                onUpdateActualField={updateActualField}
                selectNumberInput={selectNumberInput}
              />

              <TransactionsSection
                accounts={accounts}
                budgets={budgets}
                selectedMonth={selectedActualMonth}
                transactionActual={transactionMonthlyActual}
                transactions={transactions}
                onAddTransaction={addTransaction}
                onApplyToActuals={applyTransactionsToActuals}
                onDeleteTransaction={deleteTransaction}
                onDownloadCsvTemplate={downloadTransactionCsvTemplate}
                onImportCsv={importTransactionCsv}
                onUpdateTransaction={updateTransaction}
                selectNumberInput={selectNumberInput}
              />
            </section>

            <section id="balance-sheet" className="mt-5 scroll-mt-24">
              <div className="mb-3 px-1">
                <h2 className="text-lg font-semibold tracking-tight text-neutral-50">
                  Balance Sheet
                </h2>
                <p className="mt-1 text-sm leading-6 text-neutral-500">
                  Maintain account balances, cash, investments, and liabilities.
                </p>
              </div>
              <div className="grid items-start gap-4">
                <AccountsSection
                  accounts={accounts}
                  contributionReturns={contributionReturns}
                  retirementPlan={retirementPlan}
                  onAddAccount={addAccount}
                  onResetAccounts={resetAccounts}
                  onUpdateAccount={updateAccount}
                  onUpdateAccountAllocation={updateAccountAllocation}
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

            <section id="long-term-outlook" className="mt-5 scroll-mt-24">
              <div className="mb-3 px-1">
                <h2 className="text-lg font-semibold tracking-tight text-neutral-50">
                  Long-Term Outlook
                </h2>
                <p className="mt-1 text-sm leading-6 text-neutral-500">
                  Review retirement progress and how net worth is changing.
                </p>
              </div>

              <RetirementProjectionSection
                retirementPlan={retirementPlan}
                retirementProjection={retirementProjection}
                totals={totals}
                onResetRetirementPlan={resetRetirementPlan}
                onUpdateRetirementPlan={updateRetirementPlan}
                selectNumberInput={selectNumberInput}
              />

              <NetWorthHistorySection snapshots={netWorthSnapshots} />
            </section>

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
