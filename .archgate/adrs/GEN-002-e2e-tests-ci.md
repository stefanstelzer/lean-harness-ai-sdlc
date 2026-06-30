---
id: GEN-002
title: End-to-end tests exist and run in CI
status: accepted
domain: general
rules: true
files:
  - "tests/e2e/**"
  - "package.json"
---

# End-to-end tests exist and run in CI

## Context

Unit tests (GEN-005) verify modules in isolation; they cannot prove that the
package behaves correctly when its pieces are wired together and exercised the
way a consumer would use them. A thin end-to-end layer that drives the public API
through a realistic journey is the cheapest way to catch integration regressions.
The suite must exist and be runnable on demand; running it on every CI change is a
separate cost/benefit tradeoff that this project chooses not to pay (see Decision).

## Decision

- End-to-end tests live under `tests/e2e/` as `*.test.ts` files and run via
  Vitest (the same runner as the unit and smoke layers — there is no separate
  browser/Playwright stack in this single-package library).
- `tests/e2e/` is never empty: at least one journey test exercises the public API
  end to end (e.g. registering flags and evaluating a rollout across users).
- `package.json` exposes `test:e2e` (`vitest run tests/e2e`) so the suite is
  runnable in one command.
- The e2e suite is **not** wired into the push/PR pipeline. CI runs the fast
  unit + smoke gates only; the e2e journeys are run on demand (locally via
  `npm run test:e2e`, and as part of cutting a release). Keeping `tests/e2e/`
  green is therefore the author's responsibility, not a merge gate.

## Do's and Don'ts

### Do

- Put cross-module, consumer-facing journeys in `tests/e2e/`.
- Keep at least one happy-path journey green at all times.
- Wire any new e2e entry point into the `test:e2e` script so the suite stays
  runnable in one command.
- Run `npm run test:e2e` before cutting a release.

### Don't

- Don't let `tests/e2e/` go empty — that silently removes the integration layer.
- Don't put slow or flaky integration fixtures in the unit layer; keep the unit
  suite fast (GEN-005).
- Don't rely on CI to catch e2e regressions — the pipeline does not run the suite;
  run it yourself.

## Consequences

### Positive

- A runnable integration layer exists and catches cross-module regressions when
  run, without slowing the push/PR pipeline.
- One runner (Vitest) for unit, smoke, and e2e keeps the toolchain small.

### Negative

- E2E regressions are not caught automatically before merge; they surface only
  when someone runs the suite (locally or at release time).

### Risks

- A single thin journey can lull the team into false confidence; grow the e2e set
  as the public surface grows.
- Because nothing forces the suite to run, it can rot unnoticed — the "run before
  release" discipline (Do's) is the only backstop.
