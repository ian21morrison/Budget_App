# Changelog

## 2026-05-25

- Refactored the budgeting app into section components, typed models, storage helpers,
  financial calculations, and retirement projection modules without changing UI behavior.

## 2026-05-23

- Expanded the Budget section and added monthly contributions.
- Added retirement goal projections with a chart.
- Added account-level expected returns used by retirement projections.
- Added editable colors for accounts, debts, budget items, and contribution rows.
- Fixed number inputs so replacing `0` does not leave a leading zero.
- Verified net worth as assets minus debt.
