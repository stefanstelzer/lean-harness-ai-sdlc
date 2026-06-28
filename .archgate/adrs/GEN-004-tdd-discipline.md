---
id: GEN-004
title: TDD discipline — red, green, refactor
status: accepted
domain: general
rules: true
---

# TDD discipline — red, green, refactor

## Context

When humans and AI agents change code together, the safest specification of
"what this code should do" is an executable test written *before* the code. Test-
first development keeps modules honest, documents intent, and gives every change a
regression net from the moment it lands. The `tdd` skill drives this loop; this
ADR makes the resulting invariant explicit and checkable.

## Decision

- Production modules are developed test-first using the red → green → refactor
  loop: write a failing test, write the minimal code to pass it, then refactor
  with the test green.
- Every domain module under `src/` carries a matching automated test. A module
  `src/<name>.ts` has a counterpart `tests/**/<name>.test.ts` (in the unit, smoke,
  or e2e layer) that exercises it.
- Pure structural modules are exempt because there is no behaviour to test:
  - `src/index.ts` — the re-export-only barrel (ARCH-001).
  - `src/types.ts` — type declarations only.
  - any `*.d.ts` declaration file.
- The first commit on a feature branch is the spec (PRD + plan); the failing test
  follows before the implementation (see WORKFLOW.md).

## Do's and Don'ts

### Do

- Write the failing test first, watch it fail, then make it pass.
- Name a module's test after the module (`feature-flags.ts` →
  `feature-flags.test.ts`) so the pairing is obvious and machine-checkable.
- Keep refactors green — never refactor with a red bar.

### Don't

- Don't add a behavioural `src/` module with no test counterpart.
- Don't write the implementation first and backfill a test that merely asserts
  the code it already sees.
- Don't delete or skip a test to make a change land.

## Consequences

### Positive

- Every behavioural module ships with a regression net and an executable spec.
- Refactoring is safe because the tests pin behaviour.

### Negative

- Test-first feels slower on trivial changes; the payoff is fewer regressions and
  faster, more confident refactors.

### Risks

- Name-based pairing is a heuristic: a well-tested module could be flagged if its
  test is named differently. The rule is a `warning`, not a hard error, so it
  nudges without blocking.
