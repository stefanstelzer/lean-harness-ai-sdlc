---
id: GEN-002
title: End-to-end tests exist and run in CI
status: accepted
domain: general
rules: true
---

# End-to-end tests exist and run in CI

## Context

Unit tests (GEN-005) verify modules in isolation; they cannot prove that the
package behaves correctly when its pieces are wired together and exercised the
way a consumer would use them. A thin end-to-end layer that drives the public API
through a realistic journey is the cheapest way to catch integration regressions —
and it only protects the project if CI actually runs it on every change.

## Decision

- End-to-end tests live under `tests/e2e/` as `*.test.ts` files and run via
  Vitest (the same runner as the unit and smoke layers — there is no separate
  browser/Playwright stack in this single-package library).
- `tests/e2e/` is never empty: at least one journey test exercises the public API
  end to end (e.g. registering flags and evaluating a rollout across users).
- `package.json` exposes `test:e2e` (`vitest run tests/e2e`) so the suite is
  runnable in one command.
- CI runs the end-to-end suite. The nightly workflow runs the full suite
  including e2e on a schedule; push/PR workflows run the fast gates and the
  broader test run. An e2e regression therefore blocks merge.

## Do's and Don'ts

### Do

- Put cross-module, consumer-facing journeys in `tests/e2e/`.
- Keep at least one happy-path journey green at all times.
- Wire any new e2e entry point into the `test:e2e` script and the CI workflows.

### Don't

- Don't let `tests/e2e/` go empty — that silently removes the integration gate.
- Don't put slow or flaky integration fixtures in the unit layer; keep the unit
  suite fast (GEN-005).
- Don't disable the e2e job to make CI green; fix the regression instead.

## Consequences

### Positive

- Integration regressions surface in CI before merge, not in consumers' projects.
- One runner (Vitest) for unit, smoke, and e2e keeps the toolchain small.

### Negative

- E2E runs are slower than unit runs; the nightly schedule absorbs the heavier
  pass so day-to-day pushes stay fast.

### Risks

- A single thin journey can lull the team into false confidence; grow the e2e set
  as the public surface grows.
