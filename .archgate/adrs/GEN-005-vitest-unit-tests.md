---
id: GEN-005
title: Vitest as the unit-test runner
status: accepted
domain: general
rules: true
---

# Vitest as the unit-test runner

## Context

A fast unit-test layer is required so that small logic regressions surface as
quickly as the type-checker surfaces type errors. GEN-003 (strict TypeScript)
caps how far a static type system can catch logic mistakes; runtime behaviour
needs a dedicated tool. The end-to-end layer (GEN-002) is slower and gives a
coarse signal — it rarely points at the specific function that broke.

## Decision

- **Vitest** is the single unit-test runner for the package. There is no second
  runner (Jest, Mocha, Karma).
- Configuration lives in the root `vitest.config.ts`. The test environment is
  `node`; specs are discovered via `tests/**/*.test.ts`.
- Unit tests live under `tests/unit/` as `*.test.ts`, next-to-feature in spirit
  (one spec per domain module — see GEN-004). The smoke (`tests/smoke/`) and e2e
  (`tests/e2e/`) layers use the same runner.
- Coverage uses `@vitest/coverage-v8` with `text` and `lcov` reporters and an
  80% line/function/branch/statement threshold, surfaced via `test:coverage`.
- `package.json` exposes `test` (full run) and `test:unit`
  (`vitest run tests/unit`).

## Do's and Don'ts

### Do

- Place new unit specs under `tests/unit/` as `<module>.test.ts`.
- Use `vi.fn()` / `vi.mock()` from `vitest` for type-safe test doubles.
- Run `npm run test:unit` locally for fast feedback before pushing.

### Don't

- Don't introduce a second unit-test runner — Vitest is the only approved choice.
- Don't let `tests/unit/` go empty; the unit gate must stay populated.
- Don't put slow integration fixtures in the unit layer — those belong in
  `tests/e2e/` (GEN-002).

## Consequences

### Positive

- Fast feedback for logic regressions, separate from the slower e2e loop.
- One runner and one coverage report family across unit, smoke, and e2e.

### Negative

- An additional dependency surface (`vitest`, `@vitest/coverage-v8`) to keep
  current.

### Risks

- A high coverage threshold can tempt low-value tests; aim for meaningful
  assertions over raw percentage.
