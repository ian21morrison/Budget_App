# Markdown Workflow

Use Markdown to keep product decisions, implementation notes, and release-ready summaries close to
the app code.

## Daily Flow

1. Before a meaningful change, create a note from
   [`templates/change-note.md`](templates/change-note.md).
2. For product or calculation decisions, add an ADR in
   [`decisions/`](decisions/) using [`templates/adr.md`](templates/adr.md).
3. After implementation, update [`CHANGELOG.md`](CHANGELOG.md) with user-facing changes.
4. Run the checks before handing off:

   ```bash
   npm run lint
   npm run docs:lint
   npm run build
   ```

## File Map

- [`CHANGELOG.md`](CHANGELOG.md): user-facing changes grouped by date.
- [`decisions/`](decisions/): architectural and product decisions that should survive chat history.
- [`notes/`](notes/): temporary implementation notes, investigations, and test records.
- [`templates/`](templates/): copyable starting points for common Markdown documents.

## Naming

- ADRs: `YYYY-MM-DD-short-title.md`
- Notes: `YYYY-MM-DD-short-title.md`
- Keep names lowercase with hyphens.

## Style

- Start each document with one `#` title.
- Prefer short sections and scannable bullets.
- Link local files with relative paths.
- Keep financial formulas and assumptions explicit.
