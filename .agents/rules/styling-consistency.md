---
description: Code-style and consistency guidelines for this TypeScript package. Load this whenever planning or modifying source, tests, or tooling so that new code matches the conventions already established in the repo. These are consistency guardrails, not a substitute for the binding ADRs in `.archgate/adrs/`.
---

# Code Style and Consistency Rule

This rule captures the day-to-day style and consistency conventions for working in
this single-package TypeScript repo. It complements — and never overrides — the
binding ADRs in `.archgate/adrs/` (routed by `general-adrs.md` and
`architecture-adrs.md`). When in doubt, match the surrounding code.

## Guidelines

### 1. Match the existing toolchain — don't reinvent it

- Formatting is owned by **Prettier** (`.prettierrc.json`); linting by **ESLint**
  (flat config in `eslint.config.js`). Do not hand-format against the formatter or
  add competing config. Run `npm run format` / `npm run lint` before pushing.
- Respect `.editorconfig` (indentation, line endings, final newline).
- Don't introduce a second formatter, linter, or test runner; the toolchain is
  deliberately small.

### 2. TypeScript conventions

- Code compiles under strict mode (see `GEN-003`). Add explicit types instead of
  `any`; handle the `undefined` arm that `noUncheckedIndexedAccess` surfaces.
- Prefer `interface` for object shapes and `type` for unions/aliases, following
  what `src/types.ts` already does.
- Use `import type { … }` for type-only imports (`verbatimModuleSyntax` is on).
- Keep ESM import specifiers with the `.js` extension on relative imports
  (matching `src/index.ts`), as the `Bundler`/ESM setup expects.

### 3. Module and naming consistency

- Files are kebab-case (`feature-flags.ts`); exported classes/types are
  PascalCase; functions and variables are camelCase.
- A module's test mirrors its name (`feature-flags.ts` ⇄
  `tests/unit/feature-flags.test.ts`) — this keeps the `GEN-004` pairing obvious.
- Respect the layering in `ARCH-001`: the public surface is re-exported only from
  `src/index.ts`; shared types live in `src/types.ts`.

### 4. Comments and documentation

- Write doc comments (`/** … */`) on exported symbols, matching the style already
  in `src/`. Explain *why*, not *what* the code obviously does.
- All prose — code comments, ADRs, READMEs, plans — is in **English**.

### 5. Reuse over duplication

- Before adding a helper, check whether one already exists in `src/`; extend the
  existing module rather than copy-pasting logic.
- Keep functions small and dependency-free where the domain allows (the demo
  `FeatureFlags` engine is intentionally zero-dependency — preserve that).

## Maintenance

This rule is a consistency layer, not a gate. Genuine, enforceable invariants
belong in an ADR under `.archgate/adrs/` with a matching `.rules.ts`, not here.
