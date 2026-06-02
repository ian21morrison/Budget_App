# Changelog

## 2026-06-02

- Grouped dashboard sections into Overview, Spending Plan, Balance Sheet,
  Long-Term Outlook, and Goals for clearer navigation.
- Refined grouped navigation with expandable subsection links, separate
  expand/collapse controls, scroll-following active state, and smoother
  click navigation without highlight flashing.
- Added manual transaction entry and CSV transaction import, with category
  mapping into monthly actuals.
- Added a downloadable transaction CSV template and clearer sign guidance for
  purchases, refunds, and income.
- Changed actuals to use signed cash-flow inputs: income is positive, while
  spending, transfers, debt payments, and contributions are negative.
- Added transaction persistence and backup support so imported/manual
  transactions survive refreshes and JSON export/import.
- Updated Net Worth History range selectors so weekly, monthly, and yearly
  views filter tracked days instead of collapsing them into one point per
  period, and removed the ambiguous Change metric from the All view.

## 2026-05-25

- Upgraded the dashboard visual system with a polished financial overview, more
  consistent section surfaces, refined controls, improved responsive spacing, and
  clearer hierarchy across budget, accounts, debt, contributions, retirement, and goals.
- Simplified Accounts and Debt rows, and moved expected-return editing into Monthly
  contributions to match the Add existing account flow.
- Added JSON backup export and validated import restore for local app data.
- Centralized local-first persistence defaults and saved-state normalization so
  user-entered budget data survives refreshes with graceful fallbacks.
- Refactored the budgeting app into section components, typed models, storage helpers,
  financial calculations, and retirement projection modules without changing UI behavior.

## 2026-05-23

- Expanded the Budget section and added monthly contributions.
- Added retirement goal projections with a chart.
- Added account-level expected returns used by retirement projections.
- Added editable colors for accounts, debts, budget items, and contribution rows.
- Fixed number inputs so replacing `0` does not leave a leading zero.
- Verified net worth as assets minus debt.
