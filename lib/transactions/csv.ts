import type { Account, Budget, Transaction, TransactionCategoryType } from "@/types";

export type TransactionImportResult = {
  transactions: Transaction[];
  skippedRows: number;
};

const normalizeHeader = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "");

const normalizeText = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const parseCsv = (csv: string) => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let isQuoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const nextChar = csv[index + 1];

    if (char === '"' && isQuoted && nextChar === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      isQuoted = !isQuoted;
      continue;
    }

    if (char === "," && !isQuoted) {
      row.push(cell.trim());
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !isQuoted) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }

      row.push(cell.trim());
      if (row.some((value) => value.length > 0)) {
        rows.push(row);
      }
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell.trim());
  if (row.some((value) => value.length > 0)) {
    rows.push(row);
  }

  return rows;
};

const parseAmount = (value: string) => {
  const normalizedValue = value
    .replaceAll("$", "")
    .replaceAll(",", "")
    .replace(/^\((.*)\)$/, "-$1")
    .trim();
  const amount = Number(normalizedValue);

  return Number.isFinite(amount) ? amount : null;
};

const parseDate = (value: string) => {
  const trimmedValue = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
    return trimmedValue;
  }

  const parsedDate = new Date(trimmedValue);

  return Number.isNaN(parsedDate.getTime())
    ? ""
    : parsedDate.toISOString().slice(0, 10);
};

const getCell = (
  row: string[],
  headers: Record<string, number>,
  candidates: string[],
) => {
  const header = candidates.map(normalizeHeader).find((candidate) =>
    Object.prototype.hasOwnProperty.call(headers, candidate),
  );

  return header === undefined ? "" : row[headers[header]] ?? "";
};

const categoryFromText = (
  value: string,
  budgets: Budget[],
): Pick<Transaction, "categoryType" | "budgetId"> => {
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) {
    return {
      categoryType: "uncategorized",
      budgetId: "",
    };
  }

  const specialCategories: Array<{
    keywords: string[];
    type: TransactionCategoryType;
  }> = [
    { keywords: ["income", "payroll", "paycheck", "salary"], type: "income" },
    { keywords: ["transfer", "set aside"], type: "transfer" },
    { keywords: ["debt", "loan", "credit card payment"], type: "debtPayment" },
    { keywords: ["investment", "contribution", "ira", "brokerage"], type: "contribution" },
  ];
  const specialCategory = specialCategories.find((category) =>
    category.keywords.some((keyword) => normalizedValue.includes(keyword)),
  );

  if (specialCategory) {
    return {
      categoryType: specialCategory.type,
      budgetId: "",
    };
  }

  const matchedBudget = budgets.find((budget) => {
    const label = normalizeText(budget.label);
    const detail = normalizeText(budget.detail);

    return (
      label === normalizedValue ||
      normalizedValue.includes(label) ||
      detail.includes(normalizedValue)
    );
  });

  return matchedBudget
    ? {
        categoryType: "budget",
        budgetId: matchedBudget.id,
      }
    : {
        categoryType: "uncategorized",
        budgetId: "",
      };
};

const accountIdFromText = (value: string, accounts: Account[]) => {
  const normalizedValue = normalizeText(value);
  const matchedAccount = accounts.find((account) => {
    const name = normalizeText(account.name);
    const institution = normalizeText(account.institution);

    return normalizedValue === name || normalizedValue === institution;
  });

  return matchedAccount?.id ?? "";
};

export const parseTransactionCsv = ({
  accounts,
  budgets,
  csv,
  idPrefix,
}: {
  accounts: Account[];
  budgets: Budget[];
  csv: string;
  idPrefix: string;
}): TransactionImportResult => {
  const rows = parseCsv(csv);
  const headerRow = rows[0] ?? [];
  const headers = headerRow.reduce<Record<string, number>>((next, header, index) => {
    next[normalizeHeader(header)] = index;
    return next;
  }, {});
  const dataRows = rows.slice(1);
  let skippedRows = 0;

  const transactions = dataRows.flatMap((row, index) => {
    const date = parseDate(getCell(row, headers, ["date", "posted date", "transaction date"]));
    const description =
      getCell(row, headers, ["description", "name", "merchant", "memo", "payee"]) ||
      "Imported transaction";
    const amountCell = getCell(row, headers, ["amount"]);
    const debitCell = getCell(row, headers, ["debit", "withdrawal", "spent"]);
    const creditCell = getCell(row, headers, ["credit", "deposit", "received"]);
    const debit = parseAmount(debitCell);
    const credit = parseAmount(creditCell);
    const amount =
      parseAmount(amountCell) ??
      (credit !== null ? Math.abs(credit) : debit !== null ? -Math.abs(debit) : null);

    if (!date || amount === null || amount === 0) {
      skippedRows += 1;
      return [];
    }

    const category = categoryFromText(
      getCell(row, headers, ["category", "type"]),
      budgets,
    );
    const inferredCategory =
      category.categoryType === "uncategorized" && amount > 0
        ? { categoryType: "income" as const, budgetId: "" }
        : category;

    return [
      {
        id: `${idPrefix}-${index}`,
        date,
        description,
        amount,
        categoryType: inferredCategory.categoryType,
        budgetId: inferredCategory.budgetId,
        accountId: accountIdFromText(
          getCell(row, headers, ["account", "account name"]),
          accounts,
        ),
        notes: getCell(row, headers, ["notes", "note"]),
      },
    ];
  });

  return {
    transactions,
    skippedRows,
  };
};
