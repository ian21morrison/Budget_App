# Changelog

## 2026-05-25

- Upgraded the dashboard visual system with a polished financial overview, more
  consistent section surfaces, refined controls, improved responsive spacing, and
  clearer hierarchy across budget, accounts, debt, contributions, retirement, and goals.
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
