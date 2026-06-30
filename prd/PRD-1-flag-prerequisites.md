# PRD-1: Flag prerequisites

## Problem Statement

As a release engineer rolling out a layered feature, I often have a flag that
only makes sense when another flag is already on. Example: `new-checkout-upsell`
must never show unless `new-checkout` itself is live for that same user. Today
the engine evaluates every flag in isolation (`isEnabled` looks at one flag's
`enabled`/`rollout` only), so I have to re-encode the dependency in calling code
at every call site. That duplication drifts: a flag can read "on" through the
library while its precondition is "off", shipping a half-built experience.

## Solution

Let a flag declare the flags it depends on. A flag evaluates `true` only when it
is itself enabled **and** every prerequisite it lists is enabled for the same
evaluation context. The dependency is expressed once, on the flag definition, and
the engine resolves it — so a single `isEnabled('new-checkout-upsell', ctx)` call
yields the correct, dependency-aware answer with no caller-side glue.

## User Stories

1. As a release engineer, I want to declare that flag A requires flag B, so that
   A can never evaluate `true` while B is `false` for the same user.
2. As a release engineer, I want a flag with multiple prerequisites, so that A is
   enabled only when **all** of B, C, … are enabled for that user.
3. As a release engineer, I want prerequisites to honour percentage rollout, so
   that A is gated by the prerequisite's actual per-user decision, not merely by
   whether the prerequisite is configured.
4. As a release engineer, I want prerequisite chains (A→B→C) to resolve
   transitively, so that A is `true` only when the whole chain is satisfied.
5. As a developer, I want a flag that lists no prerequisites to behave exactly as
   today, so that the feature is fully backward compatible.
6. As a developer, I want a clear error when I register a flag whose prerequisite
   would form a cycle (A→B→A, or A→A), so that evaluation can never infinite-loop
   or stack-overflow at request time.
7. As a developer, I want a flag that references an unknown prerequisite key to
   evaluate `false` (fail-closed), so that a typo disables the dependent feature
   rather than silently enabling it.
8. As a consumer of the library, I want `isEnabled` to stay deterministic and
   side-effect free, so that the same context yields the same answer every call.

## Implementation Decisions

- **Data shape.** `FeatureFlag` gains an optional `requires?: string[]` — the keys
  of the flags this one depends on. Absent/empty means "no prerequisites" and
  preserves today's behaviour (story 5). This is an additive, backward-compatible
  change to the lowest layer (`src/types.ts`, `ARCH-001`).
- **Evaluation contract.** `isEnabled(key, ctx)` returns `true` iff the flag is
  found, its own `enabled`/`rollout` decision is `true`, **and** `isEnabled` is
  `true` for every key in `requires` under the *same* `ctx`. Prerequisites are
  evaluated through the same public path, so rollout and transitivity (stories
  3, 4) come for free.
- **Fail-closed on unknown keys (story 7).** An unknown prerequisite key
  evaluates `false` (the engine already maps unknown keys to `false`), so a
  dependent flag with a typo'd prerequisite is disabled, never enabled.
- **Cycle safety is a registration-time contract, not a runtime guess (story 6).**
  A prerequisite edge that closes a cycle is a configuration error. It is detected
  and rejected by `register` with a thrown `Error` naming the offending key — the
  same place the existing key/rollout validation lives — so a constructed
  `FeatureFlags` instance is always safe to evaluate. Direct self-reference
  (`requires: ['self']` on key `self`) is the degenerate cycle and is rejected the
  same way.
- **Order independence.** Because cycles are rejected at registration but a flag
  may legitimately be registered before the prerequisite it names, the cycle check
  runs over the *current* known graph; forward references to not-yet-registered
  keys are allowed (they simply evaluate fail-closed until registered). The cycle
  check rejects only edges that close a loop among already-registered flags.
- **Overwrite is revalidated (resolved in PRD review).** `register` overwrites an
  existing key. The cycle check therefore runs over the edge set that results
  *after* applying the current registration — so re-registering an existing flag
  to add a `requires` edge that closes a loop (register `B→A`, then re-register
  `A→B`) is rejected, not silently accepted. Invariant: a successfully constructed
  or mutated `FeatureFlags` instance is always acyclic and safe to evaluate.
- **No change to the public barrel.** `FeatureFlag` is already re-exported from
  `src/index.ts`; the new optional field rides along. `index.ts` stays
  re-export-only (`ARCH-001`).

## Testing Decisions

- **Seam.** The single public seam is `FeatureFlags` — its `register`/constructor
  (validation contract) and `isEnabled` (evaluation contract). Tests exercise
  behaviour through that seam only; no internal helper is tested directly (per
  `/tdd`, `GEN-004`, `GEN-005`).
- **Behaviours to cover (validation/error first):**
  - registering a direct cycle (A→A) throws;
  - registering an indirect cycle (A→B→A) throws, naming the key;
  - a dependent flag with all prerequisites enabled evaluates `true`;
  - a dependent flag with one prerequisite disabled evaluates `false`;
  - an unknown prerequisite key evaluates `false` (fail-closed);
  - a prerequisite gated by rollout gates the dependent flag per the same user;
  - a transitive chain A→B→C resolves;
  - a flag with no `requires` is unchanged (regression guard).
- **Prior art.** `tests/unit/feature-flags.test.ts` already covers the
  rollout/validation contract in this exact style; the new specs sit beside them.
  The smoke (`tests/smoke/`) and e2e (`tests/e2e/`) layers exercise the public
  barrel and a rollout journey — extend the journey to chain a prerequisite.

## Out of Scope

- Variant/multivariate flags (returning a value, not a boolean).
- "Negative" prerequisites ("A requires B to be **off**").
- Persisting or loading flag definitions from a store; the engine stays in-memory
  and dependency-free.
- Diagnostics that explain *why* a flag evaluated the way it did (a possible
  future `explain()` seam).

## Further Notes

The risk concentrates in one place: resolving the prerequisite graph without
infinite recursion. That is the tracer-bullet phase. Everything else (multiple
prerequisites, transitivity, rollout interplay) falls out of evaluating
prerequisites through the same `isEnabled` path once the graph is proven safe.
