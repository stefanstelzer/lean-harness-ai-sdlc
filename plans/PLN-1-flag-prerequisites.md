# Plan: PLN-1 Flag prerequisites

**Upstream PRD:** [prd/PRD-1-flag-prerequisites.md](../prd/PRD-1-flag-prerequisites.md)
Branch: feat/flag-prerequisites off main

## Context

Add prerequisite dependencies to the feature-flag engine: a flag may declare the
keys it depends on, and evaluates `true` only when it is itself enabled **and**
every prerequisite is enabled for the same context. The dependency is declared
once on the flag and resolved by the engine, removing caller-side glue and the
drift it causes. See the upstream PRD for the full problem framing and the
resolved design decisions (including overwrite revalidation).

## Architectural decisions

- **Deep module, one seam.** All behaviour lands behind the existing public seam
  `FeatureFlags` — `register`/constructor (the validation contract) and
  `isEnabled` (the evaluation contract). No new public symbol; no new module.
- **Lowest-layer type change.** `FeatureFlag` gains `requires?: string[]` in
  `src/types.ts`. `types.ts` stays import-free (`ARCH-001`).
- **Prerequisites resolve through the public path.** `isEnabled` evaluates each
  prerequisite by calling the same evaluation logic, so rollout gating and
  transitivity are emergent, not special-cased.
- **Cycle safety is a registration invariant.** `register` rejects any edge that
  closes a cycle over the post-registration graph; a constructed instance is
  always acyclic, so evaluation needs no runtime cycle guard.
- **Fail-closed.** Unknown prerequisite keys evaluate `false`.
- **Binding ADRs:** `ARCH-001` (layering: `types.ts` lowest, `index.ts`
  re-export-only), `GEN-003` (strict TS — handle the `undefined` arm of
  `noUncheckedIndexedAccess` on map lookups), `GEN-004`/`GEN-005` (test-first,
  Vitest at the seam).

## Phases (TDD red→green)

## Phase 1: Cycle-safe prerequisite resolution (tracer bullet)

The riskiest module: resolving a prerequisite graph without infinite recursion.
Prove registration rejects cycles and a single prerequisite gates evaluation,
end-to-end, before layering the rest on top.

- **Seam + interface.** `FeatureFlags.register(flag: FeatureFlag): this` —
  extended to validate the `requires` graph; `FeatureFlags.isEnabled(key, ctx)` —
  extended to require prerequisites. `FeatureFlag.requires?: string[]` added to
  `src/types.ts`.

### Modules touched

- `src/types.ts` — add optional `requires?: string[]` to `FeatureFlag`.
- `src/feature-flags.ts` — cycle check in `register`; prerequisite gate in
  `isEnabled`.
- `tests/unit/feature-flags.test.ts` — new `prerequisites` describe block.

### Binding ADRs

`ARCH-001`, `GEN-003`, `GEN-004`, `GEN-005`.

### Red behaviours

- Registering a direct self-cycle (`requires: ['a']` on key `a`) throws, naming
  the key. _(highest risk / validation contract first)_
- Registering an indirect cycle (`a→b`, then `b→a`) throws, naming the key.
- Re-registering an existing flag so the new edge closes a cycle throws
  (overwrite is revalidated).
- A dependent flag whose single prerequisite is enabled evaluates `true`.
- A dependent flag whose single prerequisite is disabled evaluates `false`.

### Manual Test Plan

- [ ] `npm test -- feature-flags --reporter=verbose` is green; the new
      `prerequisites` specs (cycle rejection + single-prerequisite gating) pass.
- [ ] In a node REPL: `new FeatureFlags([{key:'a',enabled:true,requires:['a']}])`
      throws an `Error` mentioning `a` (no stack overflow).

### Acceptance criteria

- Cyclic registrations throw at `register` time; no evaluation path can recurse
  infinitely.
- A single prerequisite correctly gates a dependent flag both ways.

## Phase 2: All-of, transitive, rollout-gated, fail-closed

The behaviours that fall out once the graph is proven safe. No new risk; same
seam.

- **Seam + interface.** Unchanged — `FeatureFlags.isEnabled(key, ctx)`.

### Modules touched

- `src/feature-flags.ts` — generalise the prerequisite gate to all-of /
  transitive (expected to be no-op or near-no-op if Phase 1 resolved through the
  public path).
- `tests/unit/feature-flags.test.ts` — extend the `prerequisites` block.
- `tests/e2e/rollout-journey.test.ts` — chain a prerequisite into the journey.
- `README.md` — document `requires` beside the rollout example.

### Binding ADRs

`ARCH-001`, `GEN-002` (keep the e2e journey green), `GEN-003`, `GEN-005`.

### Red behaviours

- A flag with multiple prerequisites is `true` only when **all** are enabled.
- A transitive chain `a→b→c` resolves (`a` true iff `c` true down the chain).
- A prerequisite gated by `rollout` gates the dependent flag for the same
  `userId` (per-user, deterministic).
- An unknown prerequisite key evaluates `false` (fail-closed).
- A flag with no `requires` behaves exactly as before (regression guard).

### Manual Test Plan

- [ ] `npm run test:coverage` is green and stays at/above the 80% threshold
      (`vitest.config.ts`, `GEN-005`).
- [ ] `npm run test:e2e` is green: the rollout journey now chains a prerequisite
      and the long-lived user's experience is still stable across calls.
- [ ] `npm run build`, then in a node REPL import `FeatureFlags` from `dist`,
      register `a` (rollout 100) and `b` (enabled, `requires:['a']`), and confirm
      `isEnabled('b',{userId:'u1'})` is `true` and stable across repeated calls.

### Acceptance criteria

- All PRD user stories 1–8 are demonstrated by a passing test at the seam.
- e2e journey and README reflect the new capability.

## Out of scope

Variant flags, negative prerequisites, persistence/loading, and an `explain()`
diagnostic — see the PRD's Out of Scope.

## Verification

- `npm run build` (typecheck via `tsc`) and `npm run typecheck` clean (`GEN-003`).
- `npm test` (unit + smoke + e2e) and `npm run test:coverage` ≥ 80% (`GEN-005`).
- `npm run archgate` green — `ARCH-001` layering intact, `GEN-004` test pairing
  satisfied.
- `npm run verify` (the full local gate) green before push.
- README updated to document `requires` (per `AGENTS.md` › README-Maintenance).
