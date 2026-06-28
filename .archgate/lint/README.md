# Linter Rules

This directory hosts linter-specific rules that enforce your ADRs at the linter level.

## Convention

Place linter plugin files here, named by tool:

- `eslint.js` — Custom ESLint rules
- `oxlint.js` — Custom oxlint rules (JavaScript plugin)
- `biome.js` — Custom Biome rules

This repo lints with ESLint (flat config in `eslint.config.js`). If you add custom
ESLint rules that encode an ADR, drop them here as `eslint.js` and reference them
from the flat config.

## Why here?

Archgate standardizes `.archgate/lint/` as the location for linter rules that
complement ADR checks. This keeps governance artifacts together — ADRs in
`adrs/`, executable archgate rules alongside each ADR as `<ID>-<slug>.rules.ts`,
and linter rules in `lint/`.

Note: most architectural fitness functions in this repo are expressed as archgate
rules (`.archgate/adrs/*.rules.ts`), not linter plugins. Reach for a linter rule
only when the constraint is genuinely a lint-level concern (syntax, imports,
formatting) that the linter is better placed to catch inline in the editor.
