# Plan: PLN-2 Per-user targeting overrides

**Upstream PRD:** [prd/PRD-2-user-targeting-overrides.md](../prd/PRD-2-user-targeting-overrides.md)
Branch: feat/user-targeting-overrides off main

## Context

Add per-user targeting overrides to the feature-flag engine: a flag may name
user ids that always pass its percentage gate (allow list) and user ids that
never see it (deny list). Deny wins over allow, the master `enabled` switch wins
over everything, and prerequisites keep their meaning. Targeting is declared
once on the flag definition and resolved by the engine, removing the caller-side
user-id branching that re-encodes release policy at call sites. See the upstream
PRD for the full problem framing and the review-resolved decisions (kill-switch
precedence, no prerequisite bypass, flat field naming).

## Architectural decisions

- **Deep module, one seam.** All behaviour lands behind the existing public seam
  `FeatureFlags` — `isEnabled` is the evaluation contract under change;
  `register`/constructor keep their existing validation contract. No new public
  symbol; no new module.
- **Lowest-layer type change.** `FeatureFlag` gains `allowUsers?: string[]` and
  `denyUsers?: string[]` in the types module, which stays import-free
  (`ARCH-001`).
- **Overrides live inside the flag's own decision.** Precedence within the own
  decision: unknown/`enabled: false` → `false`; deny match → `false`; allow
  match → `true` (bypasses only the percentage gate); else the existing rollout
  decision. The prerequisite gate from PLN-1 runs after the own decision,
  unchanged — so overrides on a prerequisite propagate to dependents through
  the shared evaluation path, and overrides never bypass `requires`.
- **Matching is exact string equality** on the raw `context.userId`; an absent
  `userId` matches no list. The `anonymous` rollout fallback never participates
  in override matching.
- **No new registration-time validation** (PRD review decision): overlapping
  lists are legitimate (deny wins at evaluation), empty arrays are inert.
- **Binding ADRs:** `ARCH-001` (layering: types lowest, barrel re-export-only),
  `GEN-003` (strict TS — `noUncheckedIndexedAccess` on any list/map access),
  `GEN-004`/`GEN-005` (test-first, Vitest at the seam), `GEN-002` (keep the e2e
  journey green).

## Phases (TDD red→green)

## Phase 1: Own-decision precedence core (tracer bullet)

The riskiest slice: the precedence order of the flag's own enablement decision —
master switch > deny > allow > rollout — where a wrong ordering silently breaks
the kill switch or lets an override leak past the percentage gate in the wrong
direction. Prove the full precedence chain end-to-end before composing with
prerequisites.

- **Seam + interface.** `FeatureFlags.isEnabled(key, ctx)` — extended to consult
  the new lists inside the flag's own decision. `FeatureFlag.allowUsers?:
  string[]` and `FeatureFlag.denyUsers?: string[]` added to the flag type.

### Modules touched

- `src/types.ts` — add optional `allowUsers` / `denyUsers` to `FeatureFlag`.
- `src/feature-flags.ts` — override checks in the own-decision step of
  `isEnabled`.
- `tests/unit/feature-flags.test.ts` — new `user targeting overrides` describe
  block.

### Binding ADRs

`ARCH-001`, `GEN-003`, `GEN-004`, `GEN-005`.

### Red behaviours

- A deny-listed user evaluates `false` on a flag with `rollout: 100` and on a
  flag with no rollout. _(highest risk: exclusion must work on fully released
  flags)_
- A user on both lists evaluates `false` (deny > allow).
- `enabled: false` evaluates `false` for an allow-listed user (kill switch beats
  allow).
- An allow-listed user evaluates `true` on a flag with `rollout: 0`; a
  non-listed user still evaluates `false` there.
- An evaluation without `userId` ignores both lists (falls through to the
  rollout decision).

### Manual Test Plan

- [ ] `npm test -- feature-flags --reporter=verbose` is green; the new
      `user targeting overrides` specs (deny at full rollout, deny > allow,
      kill switch, allow at rollout 0, anonymous fall-through) pass.
- [ ] In a node REPL:
      `new FeatureFlags([{key:'x',enabled:true,rollout:0,allowUsers:['beta-1']}])`
      answers `isEnabled('x',{userId:'beta-1'})` → `true` and
      `isEnabled('x',{userId:'someone-else'})` → `false`.

### Acceptance criteria

- The precedence chain master switch > deny > allow > rollout is demonstrated by
  passing tests at the seam, both directions.
- Anonymous evaluations are provably unaffected by override lists.

## Phase 2: Composition with prerequisites, journey, docs

The behaviours that fall out of keeping overrides inside the own decision — the
prerequisite gate composes unchanged. No new risk; same seam. Extend the e2e
journey and the README.

- **Seam + interface.** Unchanged — `FeatureFlags.isEnabled(key, ctx)`.

### Modules touched

- `src/feature-flags.ts` — expected no-op or near-no-op (composition falls out
  of the own-decision placement).
- `tests/unit/feature-flags.test.ts` — extend the `user targeting overrides`
  block with prerequisite-interplay and regression specs.
- `tests/e2e/rollout-journey.test.ts` — canary chapter: a beta user forced in
  at low rollout, an affected user forced out at full rollout.
- `README.md` — document targeting beside the rollout and prerequisites
  examples.

### Binding ADRs

`ARCH-001`, `GEN-002`, `GEN-003`, `GEN-005`.

### Red behaviours

- An allow-listed user on a dependent flag is still gated by the dependent's
  prerequisite (overrides never bypass `requires`). _(highest risk of this
  phase: half-built-experience protection)_
- An override on a prerequisite flag propagates to the dependent flag for that
  user, both directions (allow lights the chain, deny darkens it).
- A flag with no override lists behaves exactly as before (regression guard).
- Repeated evaluation with the same context is stable (determinism guard).

### Manual Test Plan

- [ ] `npm run test:coverage` is green and stays at/above the 80% threshold
      (`vitest.config.ts`, `GEN-005`).
- [ ] `npm run test:e2e` is green: the journey now shows a beta user seeing the
      feature at 5% rollout and an affected user losing it at 100% rollout,
      stable across repeated calls.
- [ ] `npm run build`, then in a node REPL import `FeatureFlags` from `dist`,
      register `base` (`enabled`, `denyUsers:['u-bad']`) and `dep` (`enabled`,
      `requires:['base']`), and confirm `isEnabled('dep',{userId:'u-bad'})` →
      `false` while `isEnabled('dep',{userId:'u-ok'})` → `true`.
- [ ] README shows the targeting example next to rollout/prerequisites and
      matches the implemented API.

### Acceptance criteria

- All PRD user stories 1–10 are demonstrated by a passing test at the seam.
- e2e journey and README reflect the new capability.

## Out of scope

Segment/attribute/rule-based targeting, per-user percentages or variants,
time-boxed overrides, registration-time list linting, persistence — see the
PRD's Out of Scope.

## Verification

- `npm run build` and `npm run typecheck` clean (`GEN-003`).
- `npm test` (unit + smoke + e2e) and `npm run test:coverage` ≥ 80% (`GEN-005`).
- `npm run archgate` green — `ARCH-001` layering intact, `GEN-004` test pairing
  satisfied, `GEN-006` plan rules satisfied (this file links its PRD and every
  phase carries a Manual Test Plan).
- `npm run verify` (the full local gate) green before push.
- README updated to document targeting (per `AGENTS.md` › README-Maintenance).

## Further notes

Simulation note: produced in a non-interactive run — the module set and phase
boundaries were not confirmed by user dialogue; the plan follows the PLN-1
two-phase precedent (tracer bullet, then fall-out behaviours). Plan review
(grilling) outcome: the single core ambiguity — whether override checks belong
inside the own decision or as a wrapper around it — is resolved by the
composition argument (inside the own decision is what makes prerequisite
propagation emergent rather than special-cased); no further ambiguity changes
the build.
