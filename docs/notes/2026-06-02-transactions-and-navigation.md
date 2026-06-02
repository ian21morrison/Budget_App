# Transactions And Navigation

## Goal

Make the dashboard easier to use day to day by adding transaction entry/import,
making actuals match bank-style signed cash flow, and grouping navigation into
clearer sections.

## Scope

- In: transaction import/manual entry, transaction persistence, signed actuals,
  grouped dashboard navigation, Net Worth History range behavior.
- Out: bank API integrations, multi-device sync, and automated categorization
  rules beyond simple CSV category matching.

## Implementation Notes

- Files touched:
  - `app/page.tsx`
  - `components/MonthlyActualsSection.tsx`
  - `components/NetWorthHistorySection.tsx`
  - `components/TransactionsSection.tsx`
  - `lib/calculations/budget.ts`
  - `lib/storage/defaults.ts`
  - `lib/storage/state.ts`
  - `lib/transactions/csv.ts`
  - `types/index.ts`
- State or data changes:
  - Added `transactions` to saved budget state and JSON backup/restore.
  - Added signed transaction amounts with income positive and purchases/outflows
    negative.
  - Migrates old positive monthly actual outflows to signed negative values on
    load/import.
- UI changes:
  - Added Transactions section with manual rows, CSV import, CSV template
    download, and partial apply-to-actuals behavior.
  - Grouped the page into Overview, Spending Plan, Balance Sheet,
    Long-Term Outlook, and Goals.
  - Added grouped navigation dropdowns with separate scroll and expand/collapse
    controls.
  - Net Worth History range selectors now filter tracked daily points instead of
    collapsing by period.

## Verification

- [x] `npm run lint`
- [x] `npm run docs:lint`
- [x] `npm run build`
- [x] Browser smoke test attempted during transaction work; blocked by local
  Playwright package resolution, then covered with full lint/type/build checks.

## Follow-Ups

- Consider a dedicated transaction category rule editor once more CSV formats
  are used.
- Consider visual verification with an available browser automation path after
  the next UI-heavy pass.
