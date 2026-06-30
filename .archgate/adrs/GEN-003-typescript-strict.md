---
id: GEN-003
title: TypeScript strict mode
status: accepted
domain: general
rules: true
files:
  - "src/**"
  - "tests/**"
  - "tsconfig.json"
---

# TypeScript strict mode

## Context

The codebase is changed by humans and AI agents together. Strong static type
checking eliminates whole classes of regressions before any test runs, and it is
a precondition for the layered architecture (ARCH-001): clean boundaries are only
trustworthy if the types across them are sound.

## Decision

The package compiles under TypeScript strict mode with a tightened flag set,
configured in the single root `tsconfig.json`:

- `strict: true` — implies `noImplicitAny`, `strictNullChecks`,
  `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`,
  and `alwaysStrict`.
- Additional safety flags, all enabled:
  - `noUncheckedIndexedAccess` — indexed access yields `T | undefined`.
  - `noImplicitOverride` — overrides must be marked `override`.
  - `noUnusedLocals` and `noUnusedParameters` — no dead bindings.
- `verbatimModuleSyntax` and `isolatedModules` keep emit predictable for the
  ESM/`Bundler` resolution this package uses.
- Target/module: ES2022 / ESNext.

## Do's and Don'ts

### Do

- Add explicit types instead of reaching for `any`.
- Handle the `undefined` arm that `noUncheckedIndexedAccess` surfaces on array and
  record access.
- Mark intentionally unused parameters with a leading underscore where the lint
  config allows it, rather than deleting a required positional argument.

### Don't

- Don't disable strict flags locally or paper over a type error with `@ts-ignore`
  (use `@ts-expect-error` with a justification and a TODO if truly unavoidable).
- Don't return `any` from exported functions — it erodes the public type surface.
- Don't loosen `tsconfig.json` to make a build pass; fix the underlying type.

## Consequences

### Positive

- Earlier detection of type errors; safer refactors; consistent null/undefined
  semantics across the package.

### Negative

- Higher initial writing effort; third-party libraries with weak typings may need
  thin wrappers.

### Risks

- Upgrading TypeScript can enable new strict checks that surface latent issues —
  plan those migrations as part of routine dependency updates.
