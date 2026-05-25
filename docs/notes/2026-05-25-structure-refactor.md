# Structure Refactor

## Summary

Refactored the single-page budgeting app so `app/page.tsx` owns state and event wiring while
components and library modules own display, persistence, calculations, and projections.

## Files

- `components/`: extracted budget, accounts, debts, contributions, and retirement projection UI.
- `lib/calculations/`: net worth, budget totals, contribution account selection, and return helpers.
- `lib/projections/`: retirement projection math.
- `lib/storage/`: default data and local-storage normalization.
- `types/`: shared domain and projection types.

## Verification

- `npm run lint`
- `npm run build`
